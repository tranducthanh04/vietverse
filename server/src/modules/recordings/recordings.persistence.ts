import mongoose, { type ClientSession } from 'mongoose';
import { Child } from '../../models/Child.js';
import { Recording, type IRecording } from '../../models/Recording.js';
import { COMPLETED_INTENT_RETENTION_MS, RecordingUploadIntent } from '../../models/RecordingUploadIntent.js';
import { assertRecordingContext } from './recordings.policy.js';
import type { RecordingContext } from './recordings.validation.js';

export type RecordingReceipt = {
  id: string; _id: string; childId: string; lessonId?: string; activityId?: string;
  contentVersion?: number; url: string; publicId?: string; durationSec: number;
  wordOrPrompt?: string; createdAt: string;
};
const notFound = () => ({ statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy bản thu âm hoặc hồ sơ của bé.' });
export const databaseUnavailable = () => ({ statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'Cơ sở dữ liệu chưa sẵn sàng. Vui lòng thử lại.' });
export const intentExpired = () => ({ statusCode: 409, code: 'UPLOAD_INTENT_EXPIRED', message: 'Lượt gửi đã hết hạn. Vui lòng gửi lại bằng lượt mới.' });
export const finalizeInProgress = () => ({ statusCode: 409, code: 'UPLOAD_FINALIZE_IN_PROGRESS', message: 'Bản thu đang được xác nhận. Vui lòng thử gửi lại sau giây lát.' });

export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
/** Jittered exponential backoff, capped so request latency stays bounded. */
export const backoffMs = (attempt: number, baseMs = 50, capMs = 800) => {
  const ceiling = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.round(ceiling / 2 + Math.random() * ceiling / 2);
};

function receipt(recording: IRecording): RecordingReceipt {
  return { id: String(recording._id), _id: String(recording._id), childId: String(recording.childId),
    lessonId: recording.lessonId?.toString(), activityId: recording.activityId, contentVersion: recording.contentVersion,
    url: recording.url, publicId: recording.publicId, durationSec: recording.durationSec,
    wordOrPrompt: recording.wordOrPrompt, createdAt: recording.createdAt.toISOString() };
}

export async function findOwnedRecordingReceipt(parentId: string, intentId: string, session?: ClientSession): Promise<RecordingReceipt | undefined> {
  const recording = await Recording.findOne({ uploadIntentId: intentId }).session(session ?? null);
  if (!recording) return undefined;
  if (!await Child.exists({ _id: recording.childId, parentId }).session(session ?? null)) throw notFound();
  return receipt(recording);
}

// Never let a lookup failure mask the original error.
async function receiptOrUndefined(parentId: string, intentId: string): Promise<RecordingReceipt | undefined> {
  try { return await findOwnedRecordingReceipt(parentId, intentId); } catch { return undefined; }
}

// Both legacy and direct uploads coordinate with child deletion by writing Child.
// No provider network call is held inside this transaction. A direct finalize
// must hold the intent claim (`claimToken`) acquired before provider inspection.
export async function persistOwnedRecording(parentId: string, context: RecordingContext,
  audio: { url: string; publicId?: string; resourceType?: string; durationSec: number },
  intent?: { id: string; claimToken: string }): Promise<RecordingReceipt> {
  const intentId = intent?.id;
  await assertRecordingContext(parentId, context);
  // Stable across transaction retries and commit-acknowledgement loss.
  const recordingId = new mongoose.Types.ObjectId();
  try {
    let attempts = 0;
    const options = { maxCommitTimeMS: 5000, timeoutMS: 15000 };
    return await mongoose.connection.transaction(async session => {
      if (++attempts > 4) throw databaseUnavailable();
      // Desynchronise writers that conflicted on the same Child document.
      if (attempts > 1) await sleep(backoffMs(attempts - 1));
      const child = await Child.updateOne({ _id: context.childId, parentId }, { $inc: { __v: 1 } }, { session, timestamps: false });
      if (child.matchedCount !== 1) throw notFound();
      if (intent) {
        const existing = await findOwnedRecordingReceipt(parentId, intent.id, session);
        if (existing) return existing;
        const current = await RecordingUploadIntent.findOne({ _id: intent.id, parentId, childId: context.childId }).session(session);
        if (!current) throw notFound();
        if (current.expiresAt.getTime() <= Date.now()) throw intentExpired();
      }
      const [recording] = await Recording.create([{ _id: recordingId, ...context, ...audio, ...(intent ? { uploadIntentId: intent.id } : {}) }], { session });
      if (intent) {
        const result = await RecordingUploadIntent.updateOne({ _id: intent.id, parentId, status: 'finalizing', claimToken: intent.claimToken },
          { $set: { status: 'completed', recordingId: recording._id, deleteAt: new Date(Date.now() + COMPLETED_INTENT_RETENTION_MS) },
            $unset: { claimToken: 1, claimedAt: 1 } }, { session });
        // Claim lost to a lease takeover: the new owner produces the receipt.
        if (result.matchedCount !== 1) throw finalizeInProgress();
      }
      return receipt(recording);
    }, options);
  } catch (error) {
    // A concurrent or earlier request may already have produced the receipt.
    if (intentId) {
      const existing = await receiptOrUndefined(parentId, intentId);
      if (existing) return existing;
    }
    if ((error as { statusCode?: number }).statusCode) throw error;
    // A rejected commit may already be durable. Reconcile by our exact ID,
    // never by URL/publicId supplied by a client. Failure to read is uncertainty.
    try {
      const committed = await Recording.findById(recordingId);
      if (committed && await Child.exists({ _id: committed.childId, parentId })) return receipt(committed);
    } catch { /* Retain provider asset for manual reconciliation. */ }
    throw databaseUnavailable();
  }
}
