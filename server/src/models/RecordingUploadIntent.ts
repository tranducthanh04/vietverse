import { Schema, model } from 'mongoose';

const schema = new Schema({
  parentId: { type: Schema.Types.ObjectId, required: true },
  requestId: { type: String, required: true },
  fingerprint: { type: String, required: true },
  childId: { type: Schema.Types.ObjectId, required: true, index: true },
  lessonId: Schema.Types.ObjectId,
  activityId: String,
  contentVersion: Number,
  wordOrPrompt: String,
  publicId: { type: String, required: true },
  timestamp: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
  deleteAt: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending', required: true },
  recordingId: Schema.Types.ObjectId,
}, { timestamps: true });
schema.index({ parentId: 1, requestId: 1 }, { unique: true });
schema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });
export const RecordingUploadIntent = model('RecordingUploadIntent', schema);
