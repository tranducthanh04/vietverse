import { Schema, model, Document, Types } from 'mongoose';
import { PointReason, POINT_REASONS, ONE_TIME_AWARD_REASONS } from '../constants/points.js';

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
      enum: [...POINT_REASONS],
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
      // Only one-time earning reasons; redeem/refund/use_reward may repeat for the same refId.
      // MongoDB rejects $nin/$not in partial indexes (the former $nin filter never built),
      // so the filter lists the award reasons with $in (requires MongoDB >= 6.0).
      reason: { $in: [...ONE_TIME_AWARD_REASONS] },
    },
  }
);

// Serves newest-first history pagination per child.
pointTransactionSchema.index({ childId: 1, createdAt: -1 });

export const PointTransaction = model<IPointTransaction>(
  'PointTransaction',
  pointTransactionSchema
);
