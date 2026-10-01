import { Schema, model, Document, Types } from 'mongoose';

export type PlanType = 'free' | 'monthly' | 'yearly';

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  plan: PlanType;
  startedAt: Date;
  expiresAt?: Date;
  maxChildren: number;
  paymentRef?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'monthly', 'yearly'],
      default: 'free',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
    maxChildren: {
      type: Number,
      default: 1, // Free: 1, Monthly: 1, Yearly: 3
    },
    paymentRef: String,
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
