import { Schema, model, Document, Types } from 'mongoose';
import type { PlanType } from './Subscription.js';

export type PaidPlanType = Exclude<PlanType, 'free'>;
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface IPaymentOrder extends Document {
  userId: Types.ObjectId;
  orderCode: string;
  planType: PaidPlanType;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  checkoutUrl?: string;
  paymentLinkId?: string;
  paidAt?: Date;
  transactionRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentOrderSchema = new Schema<IPaymentOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    planType: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'payos',
    },
    checkoutUrl: {
      type: String,
    },
    paymentLinkId: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    transactionRef: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentOrder = model<IPaymentOrder>('PaymentOrder', paymentOrderSchema);
