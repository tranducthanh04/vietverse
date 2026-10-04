import { randomInt } from 'node:crypto';
import { PayOS, type Webhook } from '@payos/node';
import { PaymentOrder, type PaidPlanType } from '../../models/PaymentOrder.js';
import { PaymentTestOrder } from '../../models/PaymentTestOrder.js';
import { Subscription } from '../../models/Subscription.js';
import { User } from '../../models/User.js';
import { env } from '../../config/env.js';
import mongoose, { Types } from 'mongoose';

const PLAN_PRICES: Record<PaidPlanType, number> = {
  monthly: 149000,
  yearly: 990000,
};

const PLAN_MAX_CHILDREN: Record<PaidPlanType, number> = {
  monthly: 1,
  yearly: 3,
};

const payos = env.PAYOS_CLIENT_ID
  ? new PayOS({
      clientId: env.PAYOS_CLIENT_ID,
      apiKey: env.PAYOS_API_KEY,
      checksumKey: env.PAYOS_CHECKSUM_KEY,
    })
  : null;

export class PaymentsService {
  /** Creates a fixed-value production gateway test for an authenticated parent/admin; no subscription is changed. */
  static async createTestCheckout(userId: string) {
    if (!payos) {
      throw { statusCode: 503, message: 'Thanh toán PayOS chưa được cấu hình trên hệ thống' };
    }

    const pendingOrder = await PaymentTestOrder.findOne({
      userId: new Types.ObjectId(userId),
      status: 'pending',
      checkoutUrl: { $exists: true, $ne: '' },
    }).sort({ createdAt: -1 });
    if (pendingOrder) {
      return {
        orderCode: pendingOrder.orderCode,
        amount: pendingOrder.amount,
        status: pendingOrder.status,
        checkoutUrl: pendingOrder.checkoutUrl,
        createdAt: pendingOrder.createdAt,
      };
    }

    let numericOrderCode: number;
    let orderCode: string;
    do {
      numericOrderCode = randomInt(100_000_000, 1_000_000_000);
      orderCode = `VT${numericOrderCode}`;
    } while (
      await PaymentTestOrder.exists({ orderCode }) ||
      await PaymentOrder.exists({ orderCode: `VV${numericOrderCode}` })
    );
    const order = await PaymentTestOrder.create({
      userId: new Types.ObjectId(userId),
      orderCode,
      amount: 10000,
      status: 'pending',
    });

    try {
      const paymentLink = await payos.paymentRequests.create({
        orderCode: numericOrderCode,
        amount: 10000,
        description: 'Vietverse test 10000',
        items: [{ name: 'Thanh toan thu Vietverse', quantity: 1, price: 10000 }],
        cancelUrl: `${env.CLIENT_ORIGIN}/thanh-toan-thu?orderCode=${orderCode}&payment=returned`,
        returnUrl: `${env.CLIENT_ORIGIN}/thanh-toan-thu?orderCode=${orderCode}&payment=returned`,
      });
      order.checkoutUrl = paymentLink.checkoutUrl;
      order.paymentLinkId = paymentLink.paymentLinkId;
      await order.save();
    } catch (err) {
      order.status = 'failed';
      await order.save();
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      throw { statusCode: 502, message: `Không thể tạo liên kết PayOS: ${message}` };
    }

    return {
      orderCode: order.orderCode,
      amount: order.amount,
      status: order.status,
      checkoutUrl: order.checkoutUrl,
      createdAt: order.createdAt,
    };
  }

  static async getTestOrderDetails(orderCode: string, userId: string) {
    const order = await PaymentTestOrder.findOne({ orderCode, userId: new Types.ObjectId(userId) })
      .select('orderCode amount status checkoutUrl paidAt transactionRef createdAt updatedAt');
    if (!order) throw { statusCode: 404, message: 'Không tìm thấy giao dịch test' };
    return order;
  }

  /**
   * Tạo đơn nội bộ trước, sau đó yêu cầu PayOS tạo payment link.
   */
  static async createCheckout(
    userId: string,
    data: { planType: PaidPlanType; paymentMethod?: string }
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'Không tìm thấy thông tin tài khoản phụ huynh' };
    }
    if (user.role !== 'parent') {
      throw { statusCode: 403, message: 'Chỉ tài khoản phụ huynh mới được mua gói học' };
    }

    const amount = PLAN_PRICES[data.planType];
    if (!amount) {
      throw { statusCode: 400, message: 'Gói thanh toán không hợp lệ' };
    }

    if (!payos) {
      throw { statusCode: 503, message: 'Thanh toán PayOS chưa được cấu hình trên hệ thống' };
    }

    const numericOrderCode = randomInt(100_000_000, 1_000_000_000);
    const orderCode = `VV${numericOrderCode}`;
    const order = await PaymentOrder.create({
      userId: new Types.ObjectId(userId),
      orderCode,
      planType: data.planType,
      amount,
      status: 'pending',
      paymentMethod: 'payos',
    });

    try {
      const paymentLink = await payos.paymentRequests.create({
        orderCode: numericOrderCode,
        amount,
        description: `Vietverse ${data.planType === 'yearly' ? 'goi nam' : 'goi thang'}`,
        items: [{ name: `Vietverse ${data.planType === 'yearly' ? 'Gói năm' : 'Gói tháng'}`, quantity: 1, price: amount }],
        cancelUrl: `${env.CLIENT_ORIGIN}/thanh-toan?payment=returned`,
        returnUrl: `${env.CLIENT_ORIGIN}/thanh-toan?payment=returned`,
      });
      order.checkoutUrl = paymentLink.checkoutUrl;
      order.paymentLinkId = paymentLink.paymentLinkId;
      await order.save();
    } catch (err) {
      order.status = 'failed';
      await order.save();
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      throw { statusCode: 502, message: `Không thể tạo liên kết PayOS: ${message}` };
    }

    return {
      orderCode: order.orderCode,
      amount: order.amount,
      planType: order.planType,
      status: order.status,
      checkoutUrl: order.checkoutUrl,
      isRealGateway: true,
      createdAt: order.createdAt,
    };
  }

  /**
   * Xác minh payload PayOS rồi cập nhật đơn và subscription trong một transaction.
   */
  static async handleWebhook(payload: Webhook) {
    if (!payos) {
      throw { statusCode: 503, message: 'PayOS chưa được cấu hình; từ chối webhook' };
    }

    let verifiedData: Awaited<ReturnType<PayOS['webhooks']['verify']>>;
    try {
      verifiedData = await payos.webhooks.verify(payload);
    } catch {
      throw { statusCode: 400, message: 'Chữ ký webhook PayOS không hợp lệ' };
    }

    const orderCode = `VV${verifiedData.orderCode}`;
    const testOrderCode = `VT${verifiedData.orderCode}`;
    const testOrder = await PaymentTestOrder.findOne({ orderCode: testOrderCode });
    if (testOrder) {
      if (verifiedData.amount !== testOrder.amount) {
        throw { statusCode: 400, message: 'Số tiền webhook không khớp với giao dịch test' };
      }

      const session = await mongoose.startSession();
      let result: { order: typeof testOrder; subscription: null; idempotencyHandled: boolean } | null = null;
      try {
        await session.withTransaction(async () => {
          const currentTestOrder = await PaymentTestOrder.findOne({ orderCode: testOrderCode }).session(session);
          if (!currentTestOrder) throw { statusCode: 404, message: `Không tìm thấy giao dịch ${testOrderCode}` };
          if (currentTestOrder.status !== 'pending') {
            result = { order: currentTestOrder, subscription: null, idempotencyHandled: true };
            return;
          }

          if (verifiedData.code === '00') {
            currentTestOrder.status = 'completed';
            currentTestOrder.paidAt = new Date();
            currentTestOrder.transactionRef = verifiedData.reference;
          } else {
            currentTestOrder.status = 'failed';
          }
          await currentTestOrder.save({ session });
          result = { order: currentTestOrder, subscription: null, idempotencyHandled: false };
        });
      } finally {
        await session.endSession();
      }
      if (!result) throw { statusCode: 500, message: 'Không thể ghi nhận giao dịch test' };
      return result;
    }

    const order = await PaymentOrder.findOne({ orderCode });
    if (!order) {
      throw { statusCode: 404, message: `Không tìm thấy đơn hàng mã ${orderCode}` };
    }

    if (verifiedData.amount !== order.amount) {
      throw { statusCode: 400, message: 'Số tiền webhook không khớp với đơn hàng' };
    }

    const isPaid = verifiedData.code === '00';
    const session = await mongoose.startSession();
    let result: { order: typeof order; subscription: unknown; idempotencyHandled: boolean } | null = null;
    try {
      await session.withTransaction(async () => {
        const currentOrder = await PaymentOrder.findOne({ orderCode }).session(session);
        if (!currentOrder) throw { statusCode: 404, message: `Không tìm thấy đơn hàng mã ${orderCode}` };
        if (currentOrder.status === 'completed') {
          const existingSub = await Subscription.findOne({ userId: currentOrder.userId }).session(session);
          result = { order: currentOrder, subscription: existingSub, idempotencyHandled: true };
          return;
        }
        if (currentOrder.status !== 'pending') {
          result = { order: currentOrder, subscription: null, idempotencyHandled: true };
          return;
        }

        if (!isPaid) {
          currentOrder.status = 'failed';
          await currentOrder.save({ session });
          result = { order: currentOrder, subscription: null, idempotencyHandled: false };
          return;
        }

        const currentSub = await Subscription.findOne({ userId: currentOrder.userId }).session(session);
        const now = new Date();
        const baseDate = currentSub?.expiresAt && currentSub.expiresAt > now ? currentSub.expiresAt : now;
        const newExpiresAt = new Date(baseDate);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + (currentOrder.planType === 'yearly' ? 12 : 1));
        const updatedSubscription = await Subscription.findOneAndUpdate(
          { userId: currentOrder.userId },
          {
            $set: {
              userId: currentOrder.userId,
              plan: currentOrder.planType,
              active: true,
              maxChildren: PLAN_MAX_CHILDREN[currentOrder.planType],
              expiresAt: newExpiresAt,
              paymentRef: currentOrder.orderCode,
            },
          },
          { new: true, upsert: true, session }
        );

        currentOrder.status = 'completed';
        currentOrder.paidAt = new Date();
        currentOrder.transactionRef = verifiedData.reference;
        await currentOrder.save({ session });
        result = { order: currentOrder, subscription: updatedSubscription, idempotencyHandled: false };
      });
    } finally {
      await session.endSession();
    }

    if (!result) throw { statusCode: 500, message: 'Không thể ghi nhận kết quả thanh toán' };
    return result;
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
