import { Schema, model } from 'mongoose';

// Reconciliation backlog for provider audio that could not be destroyed
// (child deletion after commit, legacy compensation). Operators drain it manually;
// a failed physical delete never rolls back or fails the business operation.
const schema = new Schema({
  publicId: { type: String, required: true },
  resourceType: String,
  source: { type: String, enum: ['child_deletion', 'legacy_compensation'], required: true },
  childId: Schema.Types.ObjectId,
  status: { type: String, enum: ['pending', 'done'], default: 'pending', required: true },
  attempts: { type: Number, default: 0 },
  lastError: String,
}, { timestamps: true });
export const AudioCleanupTask = model('AudioCleanupTask', schema);
