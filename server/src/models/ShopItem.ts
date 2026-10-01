import { Schema, model, Document } from 'mongoose';

export type ShopItemType = 'virtual' | 'physical';

export interface IShopItem extends Document {
  name: string;
  type: ShopItemType;
  costPoints: number;
  assetUrl: string;
  description?: string;
  badgeCode?: string; // If virtual badge
  stock?: number; // For physical items
  active: boolean;
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
  },
  {
    timestamps: true,
  }
);

export const ShopItem = model<IShopItem>('ShopItem', shopItemSchema);
