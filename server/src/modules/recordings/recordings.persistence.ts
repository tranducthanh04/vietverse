import mongoose from 'mongoose';
import { Child } from '../../models/Child.js';
import { Recording, type IRecording } from '../../models/Recording.js';
import { assertRecordingContext } from './recordings.policy.js';
import { buildRecordingAudioUrl } from './recordings.audioToken.js';
import type { RecordingContext } from './recordings.validation.js';

export type RecordingReceipt = {
  id: string; _id: string; childId: string; lessonId?: string; activityId?: string;
  contentVersion?: number; audioUrl: string; durationSec: number; mimeType?: string;
  byteSize?: number; wordOrPrompt?: string; createdAt: string;
};

export type StoredAudio = { storageKey: string; mimeType: string; byteSize: number; durationSec: number };

const notFound = () => ({ statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy bản thu âm hoặc hồ sơ của bé.' });
export const databaseUnavailable = () => ({ statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'Cơ sở dữ liệu chưa sẵn sàng. Vui lòng thử lại.' });

export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
/** Jittered exponential backoff, capped so request latency stays bounded. */
export const backoffMs = (attempt: number, baseMs = 50, capMs = 800) => {
  const ceiling = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.round(ceiling / 2 + Math.random() * ceiling / 2);
};

/** Every recording in an API response carries a freshly signed, expiring audio URL. */
export function toRecordingReceipt(recording: IRecording): RecordingReceipt {
  const id = String(recording._id);
  return {
    id, _id: id, childId: String(recording.childId),
    lessonId: recording.lessonId?.toString(), activityId: recording.activityId,
    contentVersion: recording.contentVersion, audioUrl: buildRecordingAudioUrl(id),
    durationSec: recording.durationSec, mimeType: recording.mimeType, byteSize: recording.byteSize,
    wordOrPrompt: recording.wordOrPrompt, createdAt: recording.createdAt.toISOString(),
  };
}

/**
 * Persists a recording that already has its audio on disk. The write serializes against child
 * deletion by touching the Child document, so a recording can never outlive its child. A
 * rejected commit that is actually durable is reconciled by the recording's own id (never by
 * client-supplied data); genuine uncertainty surfaces as 503 and the caller removes the file.
 */
export async function persistOwnedRecording(
  parentId: string,
  context: RecordingContext,
  audio: StoredAudio,
): Promise<RecordingReceipt> {
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
      const [recording] = await Recording.create([{ _id: recordingId, ...context, ...audio }], { session });
      return toRecordingReceipt(recording);
    }, options);
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode) throw error;
    // A rejected commit may already be durable. Reconcile by our exact ID, never by data
    // supplied by a client. Failure to read is uncertainty: surface it so the file is removed.
    try {
      const committed = await Recording.findById(recordingId);
      if (committed && await Child.exists({ _id: committed.childId, parentId })) return toRecordingReceipt(committed);
    } catch { /* fall through to uncertainty */ }
    throw databaseUnavailable();
  }
}
