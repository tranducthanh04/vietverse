import { z } from 'zod';

export const createCheckoutSchema = z.object({
  planType: z.enum(['monthly', 'yearly'], {
    required_error: 'Vui lòng chọn loại gói thuê bao (monthly hoặc yearly)',
  }),
  paymentMethod: z.string().optional().default('payos'),
});

export const webhookSchema = z.object({
  code: z.string(),
  desc: z.string(),
  // Không bắt buộc: mẫu giao dịch PayOS gửi khi xác minh webhook url lúc đăng ký không
  // kèm `success`, chỉ payload thanh toán thật mới có. Để bắt buộc thì Zod từ chối ngay
  // ở controller và trả 400, nên request không bao giờ tới được nhánh "đã ký nhưng không
  // có đơn hàng" trong service — PayOS báo "Webhook url không hoạt động" và không đăng ký
  // được. An toàn vì không chỗ nào đọc trường này; chữ ký vẫn do payos.webhooks.verify kiểm.
  success: z.boolean().optional(),
  data: z.object({
    orderCode: z.number().int().positive(),
    amount: z.number().int().nonnegative(),
    code: z.string(),
    desc: z.string(),
    reference: z.string(),
  }).passthrough(),
  signature: z.string().min(1),
}).passthrough();
