import { Schema, model } from 'mongoose';

// Pending intents keep their publicId long enough for a monthly orphan
// reconciliation (an upload may have reached the provider without finalize).
// Completed intents are redundant with the Recording receipt and expire sooner.
export const PENDING_INTENT_RETENTION_MS = 30 * 86400000;
export const COMPLETED_INTENT_RETENTION_MS = 7 * 86400000;

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
  // `finalizing` is a leased claim: one finalize request owns provider inspection
  // and persistence; concurrent requests wait for its receipt.
  status: { type: String, enum: ['pending', 'finalizing', 'completed'], default: 'pending', required: true },
  claimToken: String,
  claimedAt: Date,
  recordingId: Schema.Types.ObjectId,
}, { timestamps: true });
schema.index({ parentId: 1, requestId: 1 }, { unique: true });
schema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });
export const RecordingUploadIntent = model('RecordingUploadIntent', schema);
