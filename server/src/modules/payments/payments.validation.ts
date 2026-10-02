import { z } from 'zod';

export const createCheckoutSchema = z.object({
  planType: z.enum(['monthly', 'yearly'], {
    required_error: 'Vui lòng chọn loại gói thuê bao (monthly hoặc yearly)',
  }),
  paymentMethod: z.string().optional().default('payos'),
});

export const webhookSchema = z.object({
  orderCode: z.string({
    required_error: 'Mã đơn hàng orderCode là bắt buộc',
  }),
  status: z.enum(['completed', 'failed', 'cancelled'], {
    required_error: 'Trạng thái status không hợp lệ',
  }),
  transactionRef: z.string().optional(),
  checksum: z.string().optional(),
});
