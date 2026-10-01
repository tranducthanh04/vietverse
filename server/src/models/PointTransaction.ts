import { Schema, model, Document, Types } from 'mongoose';
import { PointReason } from '../constants/points.js';

export interface IPointTransaction extends Document {
  childId: Types.ObjectId;
  delta: number; // positive for awards, negative for redemptions
  reason: PointReason;
  refId?: string; // lessonId, articleId, stageId, or itemId
  description?: string;
  createdAt: Date;
}

const pointTransactionSchema = new Schema<IPointTransaction>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    delta: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      enum: ['lesson', 'culture_quiz', 'stage_complete', 'treasure', 'redeem', 'refund'],
      required: true,
      index: true,
    },
    refId: {
      type: String,
      index: true,
    },
    description: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound sparse index to enforce idempotency when refId is present:
// Prevents awarding duplicate points for the same lesson, quiz, or stage to the same child
pointTransactionSchema.index(
  { childId: 1, reason: 1, refId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      refId: { $type: 'string' },
      reason: { $nin: ['redeem', 'refund'] }, // Redemptions & Refunds can happen multiple times
    },
  }
);

export const PointTransaction = model<IPointTransaction>(
  'PointTransaction',
  pointTransactionSchema
);
