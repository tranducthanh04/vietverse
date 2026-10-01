import { Schema, model, Document, Types } from 'mongoose';

export type RedemptionStatus = 'pending' | 'shipped' | 'delivered';

export interface IRedemption extends Document {
  childId: Types.ObjectId;
  itemId: Types.ObjectId;
  status: RedemptionStatus;
  pointsSpent: number;
  shippingAddress?: {
    recipientName: string;
    phone: string;
    street: string;
    ward?: string;
    district?: string;
    city: string;
  };
  trackingCode?: string;
  carrier?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const redemptionSchema = new Schema<IRedemption>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'ShopItem',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'shipped', 'delivered'],
      default: 'pending',
      index: true,
    },
    pointsSpent: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      recipientName: String,
      phone: String,
      street: String,
      ward: String,
      district: String,
      city: String,
    },
    trackingCode: String,
    carrier: String,
    notes: String,
  },
  {
    timestamps: true,
  }
);

export const Redemption = model<IRedemption>('Redemption', redemptionSchema);
