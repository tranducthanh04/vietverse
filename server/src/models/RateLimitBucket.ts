import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: String, required: true },
  hits: { type: Number, required: true },
  resetAt: { type: Date, required: true },
}, { versionKey: false });
schema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });
export const RateLimitBucket = model('RateLimitBucket', schema);
