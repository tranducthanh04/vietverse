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

const objectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Mã định danh không hợp lệ');

export const childPointsQuerySchema = z.object({
  before: z
    .string()
    .datetime({ offset: true, message: 'before phải là thời điểm ISO 8601' })
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const EQUIP_SLOTS = ['avatar', 'profile_decoration'] as const;
export type EquipSlot = (typeof EQUIP_SLOTS)[number];

export const equipItemSchema = z
  .object({
    slot: z.enum(EQUIP_SLOTS),
    itemId: objectIdString.nullable(),
  })
  .strict();

