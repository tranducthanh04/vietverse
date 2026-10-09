import { Schema, model, Document } from 'mongoose';
import { POINT_RULE_KEYS, PointRuleKey } from '../constants/points.js';

export const POINT_RULE_MAX_AMOUNT = 1000;

/**
 * Admin override for a built-in point rule (D3). Only the fixed keys in POINT_RULES exist;
 * a missing document means the code default applies.
 */
export interface IPointRule extends Document {
  key: PointRuleKey;
  amount: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pointRuleSchema = new Schema<IPointRule>(
  {
    key: { type: String, enum: POINT_RULE_KEYS, required: true, unique: true },
    amount: {
      type: Number,
      required: true,
      min: 0,
      max: POINT_RULE_MAX_AMOUNT,
      validate: { validator: Number.isInteger, message: 'amount phải là số nguyên' },
    },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export const PointRule = model<IPointRule>('PointRule', pointRuleSchema);
