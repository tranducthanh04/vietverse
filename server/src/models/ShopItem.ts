import { Schema, model, Document } from 'mongoose';

export type ShopItemType = 'virtual' | 'physical';

export const SHOP_ITEM_CATEGORIES = ['badge', 'avatar', 'profile_decoration', 'collectible'] as const;
export type ShopItemCategory = (typeof SHOP_ITEM_CATEGORIES)[number];

export interface IShopItem extends Document {
  name: string;
  type: ShopItemType;
  /** Required for virtual items; physical gifts may omit it and are shown as "Quà gửi tận nhà". */
  category?: ShopItemCategory;
  costPoints: number;
  assetUrl: string;
  description?: string;
  badgeCode?: string; // If virtual badge
  stock?: number; // For physical items
  active: boolean;
  refundLock?: string;
  createdAt: Date;
  updatedAt: Date;
}

const shopItemSchema = new Schema<IShopItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['virtual', 'physical'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: SHOP_ITEM_CATEGORIES,
      // Enforced on document create/save. Update queries are guarded by the admin service.
      required: [
        function (this: { type?: ShopItemType }) {
          return this.type === 'virtual';
        },
        'Vật phẩm ảo bắt buộc có loại (category)',
      ],
    },
    costPoints: {
      type: Number,
      required: true,
      min: 0,
    },
    assetUrl: {
      type: String,
      required: true,
    },
    description: String,
    badgeCode: String,
    stock: {
      type: Number,
      default: 999,
    },
    active: {
      type: Boolean,
      default: true,
    },
    refundLock: { type: String, select: false },
  },
  {
    timestamps: true,
  }
);

export const ShopItem = model<IShopItem>('ShopItem', shopItemSchema);
