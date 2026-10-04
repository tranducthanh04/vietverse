import { Schema, model, Document, Types } from 'mongoose';

export type PaymentTestStatus = 'pending' | 'completed' | 'failed';

export interface IPaymentTestOrder extends Document {
  userId: Types.ObjectId;
  orderCode: string;
  amount: number;
  status: PaymentTestStatus;
  checkoutUrl?: string;
  paymentLinkId?: string;
  paidAt?: Date;
  transactionRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTestOrderSchema = new Schema<IPaymentTestOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderCode: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true, immutable: true, default: 2000 },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending', index: true },
    checkoutUrl: String,
    paymentLinkId: String,
    paidAt: Date,
    transactionRef: String,
  },
  { timestamps: true }
);

export const PaymentTestOrder = model<IPaymentTestOrder>('PaymentTestOrder', paymentTestOrderSchema);
