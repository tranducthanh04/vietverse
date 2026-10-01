import { z } from 'zod';

export const redeemItemSchema = z.object({
  childId: z.string().min(1, 'Thiếu childId'),
  itemId: z.string().min(1, 'Thiếu itemId'),
  shippingAddress: z
    .object({
      recipientName: z.string().min(1, 'Thiếu tên người nhận'),
      phone: z.string().min(8, 'Số điện thoại không hợp lệ'),
      street: z.string().min(1, 'Thiếu địa chỉ giao hàng'),
      ward: z.string().optional(),
      district: z.string().optional(),
      city: z.string().min(1, 'Thiếu tỉnh/thành phố'),
    })
    .optional(),
});
