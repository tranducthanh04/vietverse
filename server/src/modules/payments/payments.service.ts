import PayOS from '@payos/node';
import { PaymentOrder, PlanType, PaymentStatus } from '../../models/PaymentOrder.js';
import { Subscription } from '../../models/Subscription.js';
import { User } from '../../models/User.js';
import { env } from '../../config/env.js';
import { Types } from 'mongoose';

const PLAN_PRICES = {
  monthly: 99000,   // 99,000 VND
  yearly: 899000,   // 899,000 VND (Tiết kiệm ~25%)
};

const PLAN_MAX_CHILDREN = {
  monthly: 3,
  yearly: 5,
};

// Khởi tạo SDK PayOS nếu có cấu hình API Key thực từ cổng payos.vn
let payos: PayOS | null = null;
if (
  env.PAYOS_CLIENT_ID &&
  env.PAYOS_API_KEY &&
  env.PAYOS_CHECKSUM_KEY &&
  !env.PAYOS_CLIENT_ID.includes('your_payos')
) {
  payos = new PayOS(env.PAYOS_CLIENT_ID, env.PAYOS_API_KEY, env.PAYOS_CHECKSUM_KEY);
}

export class PaymentsService {
  /**
   * Khởi tạo đơn hàng và link checkout trực tiếp từ Cổng thanh toán PayOS / VietQR
   */
  static async createCheckout(
    userId: string,
    data: { planType: PlanType; paymentMethod?: string }
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'Không tìm thấy thông tin tài khoản phụ huynh' };
    }

    const amount = PLAN_PRICES[data.planType];
    if (!amount) {
      throw { statusCode: 400, message: 'Gói thanh toán không hợp lệ' };
    }

    // PayOS yêu cầu mã orderCode số (Ví dụ: 172839102)
    const numericOrderCode = Number(`${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 100)}`);
    const orderCodeStr = `VV${numericOrderCode}`;

    let checkoutUrl = '';

    // Nếu đã điền API Key PayOS thật ➔ Gọi Cổng thanh toán PayOS thật
    if (payos) {
      try {
        const paymentLinkRes = await payos.createPaymentLink({
          orderCode: numericOrderCode,
          amount,
          description: `Vietverse Goi ${data.planType === 'yearly' ? 'Nam' : 'Thang'}`,
          cancelUrl: `${env.CLIENT_ORIGIN}/phu-huynh/cai-dat?payment=cancelled`,
          returnUrl: `${env.CLIENT_ORIGIN}/phu-huynh/cai-dat?payment=success`,
        });
        checkoutUrl = paymentLinkRes.checkoutUrl;
      } catch (err: any) {
        throw { statusCode: 502, message: `Lỗi kết nối Cổng thanh toán PayOS: ${err.message}` };
      }
    } else {
      // Môi trường Dev/Test chưa điền API Key ➔ Sinh link VietQR Sandbox trực quan
      checkoutUrl = `https://img.vietqr.io/image/MB-0331000123456-compact2.png?amount=${amount}&addInfo=${orderCodeStr}&accountName=VIETVERSE%20EDU`;
    }

    const order = await PaymentOrder.create({
      userId: new Types.ObjectId(userId),
      orderCode: orderCodeStr,
      planType: data.planType,
      amount,
      status: 'pending',
      paymentMethod: payos ? 'payos_gateway' : 'vietqr_sandbox',
      checkoutUrl,
    });

    return {
      orderCode: order.orderCode,
      amount: order.amount,
      planType: order.planType,
      status: order.status,
      checkoutUrl: order.checkoutUrl,
      isRealGateway: !!payos,
      createdAt: order.createdAt,
    };
  }

  /**
   * Xử lý Webhook callback bất đồng bộ từ Cổng thanh toán thật (PayOS / Gateway Webhook)
   * Xác thực chữ ký mã hóaChecksum & Nâng cấp Subscription nguyên tử
   */
  static async handleWebhook(data: {
    orderCode: string;
    status: PaymentStatus;
    transactionRef?: string;
    signature?: string;
  }) {
    // Nếu có SDK PayOS ➔ Xác thực chữ ký Checksum an toàn chống giả mạo request
    if (payos && data.checksum) {
      try {
        const verifiedData = payos.verifyPaymentWebhookData({ ...data, signature: data.checksum } as any);
        data.orderCode = `VV${verifiedData.orderCode}`;
        data.status = verifiedData.code === '00' ? 'completed' : 'failed';
        data.transactionRef = verifiedData.reference;
      } catch {
        throw { statusCode: 400, message: 'Chữ ký Webhook (Checksum) không hợp lệ từ Cổng thanh toán' };
      }

    }

    const order = await PaymentOrder.findOne({ orderCode: data.orderCode });
    if (!order) {
      throw { statusCode: 404, message: `Không tìm thấy đơn hàng mã ${data.orderCode}` };
    }

    // Idempotency Check: Nếu đơn hàng đã hoàn tất trước đó, trả về kết quả thành công không bị lặp
    if (order.status === 'completed' && data.status === 'completed') {
      const existingSub = await Subscription.findOne({ userId: order.userId });
      return { order, subscription: existingSub, idempotencyHandled: true };
    }

    // Cập nhật trạng thái đơn hàng
    order.status = data.status;
    if (data.status === 'completed') {
      order.paidAt = new Date();
    }
    if (data.transactionRef) {
      order.transactionRef = data.transactionRef;
    }
    await order.save();

    let updatedSubscription = null;

    // Nếu thanh toán thành công ➔ Nâng cấp / Gia hạn gói Subscription
    if (data.status === 'completed') {
      const currentSub = await Subscription.findOne({ userId: order.userId });

      const now = new Date();
      let baseDate = now;
      if (currentSub?.expiresAt && new Date(currentSub.expiresAt) > now) {
        baseDate = new Date(currentSub.expiresAt);
      }

      const durationMonths = order.planType === 'yearly' ? 12 : 1;
      const newExpiresAt = new Date(baseDate.setMonth(baseDate.getMonth() + durationMonths));
      const maxAllowed = PLAN_MAX_CHILDREN[order.planType];

      updatedSubscription = await Subscription.findOneAndUpdate(
        { userId: order.userId },
        {
          $set: {
            userId: order.userId,
            plan: order.planType,
            active: true,
            maxChildren: maxAllowed,
            expiresAt: newExpiresAt,
          },
        },
        { new: true, upsert: true }
      );
    }

    return {
      order,
      subscription: updatedSubscription,
      idempotencyHandled: false,
    };
  }

  /**
   * Xem lịch sử thanh toán của Phụ huynh
   */
  static async getPaymentHistory(userId: string) {
    return PaymentOrder.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  /**
   * Tra cứu chi tiết đơn hàng theo orderCode
   */
  static async getOrderDetails(orderCode: string, userId: string) {
    const order = await PaymentOrder.findOne({
      orderCode,
      userId: new Types.ObjectId(userId),
    });

    if (!order) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn hàng' };
    }

    return order;
  }
}
