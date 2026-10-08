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
  success: z.boolean(),
  data: z.object({
    orderCode: z.number().int().positive(),
    amount: z.number().int().nonnegative(),
    code: z.string(),
    desc: z.string(),
    reference: z.string(),
  }).passthrough(),
  signature: z.string().min(1),
}).passthrough();
