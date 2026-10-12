import { Schema, model } from 'mongoose';

const schema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  nonce: { type: String, required: true },
  state: { type: String, enum: ['fresh', 'link'], default: 'fresh', required: true },
  googleId: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const GoogleAuthFlow = model('GoogleAuthFlow', schema);
