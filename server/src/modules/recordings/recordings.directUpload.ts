import { createHash, randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { Child } from '../../models/Child.js';
import { PENDING_INTENT_RETENTION_MS, RecordingUploadIntent } from '../../models/RecordingUploadIntent.js';
import { directAudioStorage, type UploadIntentDto } from '../../services/directAudioStorage.js';
import { assertRecordingContext } from './recordings.policy.js';
import { uploadIntentSchema, type UploadIntentInput } from './recordings.validation.js';
import { backoffMs, databaseUnavailable, finalizeInProgress, findOwnedRecordingReceipt, intentExpired, persistOwnedRecording,
  sleep, type RecordingReceipt } from './recordings.persistence.js';

// A claim older than the lease is presumed abandoned (crashed/timed-out function).
const CLAIM_LEASE_MS = 45_000;
// How long a concurrent finalize waits for the claim owner's receipt.
const CLAIM_WAIT_MS = 15_000;
const intentNotFound = () => ({ statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy lượt gửi thu âm.' });

async function claimIntent(parentId: string, intentId: string): Promise<string | undefined> {
  const claimToken = randomUUID();
  const now = new Date();
  const claimed = await RecordingUploadIntent.findOneAndUpdate(
    { _id: intentId, parentId, expiresAt: { $gt: now },
      $or: [{ status: 'pending' }, { status: 'finalizing', claimedAt: { $lt: new Date(now.getTime() - CLAIM_LEASE_MS) } }] },
    { $set: { status: 'finalizing', claimToken, claimedAt: now } },
    { new: true, projection: { _id: 1 } },
  );
  return claimed ? claimToken : undefined;
}

async function releaseClaim(intentId: string, claimToken: string) {
  try {
    await RecordingUploadIntent.updateOne({ _id: intentId, status: 'finalizing', claimToken },
      { $set: { status: 'pending' }, $unset: { claimToken: 1, claimedAt: 1 } });
  } catch { /* The lease expires on its own; a later finalize takes over. */ }
}

export class DirectRecordingsService {
  static async finalize(parentId: string, intentId: string): Promise<RecordingReceipt> {
    const deadline = Date.now() + CLAIM_WAIT_MS;
    for (let attempt = 0; ; attempt++) {
      // The Recording remains the receipt even after the intent TTL has elapsed.
      const existing = await findOwnedRecordingReceipt(parentId, intentId);
      if (existing) return existing;
      const intent = await RecordingUploadIntent.findOne({ _id: intentId, parentId }).lean();
      if (!intent) throw intentNotFound();
      // The receipt and the `completed` status commit together in one transaction.
      // A concurrent finalize can observe `completed` here while the receipt read at
      // the top of the loop raced that same commit and missed it. Re-read once before
      // concluding the recording is gone; genuine absence means it was removed with the child.
      if (intent.status === 'completed') {
        const settled = await findOwnedRecordingReceipt(parentId, intentId);
        if (settled) return settled;
        throw intentNotFound();
      }
      if (intent.expiresAt.getTime() <= Date.now()) throw intentExpired();
      const claimToken = await claimIntent(parentId, intentId);
      if (claimToken) return DirectRecordingsService.finalizeClaimed(parentId, intent, claimToken);
      // Another request owns provider inspection; wait for its receipt instead of racing it.
      if (Date.now() >= deadline) throw finalizeInProgress();
      await sleep(backoffMs(attempt, 100, 1000));
    }
  }

  private static async finalizeClaimed(parentId: string, intent: { _id: unknown; childId: unknown; lessonId?: unknown; activityId?: string | null;
    contentVersion?: number | null; wordOrPrompt?: string | null; publicId: string }, claimToken: string): Promise<RecordingReceipt> {
    const intentId = String(intent._id);
    try {
      const context = await assertRecordingContext(parentId, { childId: String(intent.childId),
        lessonId: intent.lessonId ? String(intent.lessonId) : undefined, activityId: intent.activityId ?? undefined,
        contentVersion: intent.contentVersion ?? undefined, wordOrPrompt: intent.wordOrPrompt ?? undefined });
      const audio = await directAudioStorage.inspect(intent.publicId);
      return await persistOwnedRecording(parentId, context,
        { url: audio.url, publicId: audio.publicId, resourceType: 'video', durationSec: audio.durationSec }, { id: intentId, claimToken });
    } catch (error) {
      try {
        const existing = await findOwnedRecordingReceipt(parentId, intentId);
        if (existing) return existing;
      } catch { /* Report the original failure. */ }
      await releaseClaim(intentId, claimToken);
      throw error;
    }
  }

  static async createIntent(parentId: string, input: UploadIntentInput): Promise<UploadIntentDto> {
    const parsed = uploadIntentSchema.parse(input);
    const context = await assertRecordingContext(parentId, parsed);
    const fingerprint = createHash('sha256').update(JSON.stringify({ ...context, byteLength: parsed.byteLength, mimeType: parsed.mimeType, durationSec: parsed.durationSec })).digest('hex');
    const publicId = `vietverse/recordings/${randomUUID()}`;
    const timestamp = directAudioStorage.signatureTimestamp();
    directAudioStorage.sign(publicId, timestamp); // Storage preflight outside transaction.
    let attempts = 0;
    let intent;
    const options = { maxCommitTimeMS: 5000, timeoutMS: 15000 };
    try {
      intent = await mongoose.connection.transaction(async session => {
        if (++attempts > 4) throw databaseUnavailable();
        if (attempts > 1) await sleep(backoffMs(attempts - 1));
        const existing = await RecordingUploadIntent.findOne({ parentId, requestId: parsed.requestId }).session(session);
        // Creation AND deduplication share the deletion boundary. A stale
        // snapshot conflicts with delete and retries against the absent child.
        const child = await Child.updateOne({ _id: context.childId, parentId }, { $inc: { __v: 1 } }, { session, timestamps: false });
        if (child.matchedCount !== 1) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ của bé.' };
        if (existing) return existing;
        const [created] = await RecordingUploadIntent.create([{ ...context, parentId, requestId: parsed.requestId, fingerprint, publicId, timestamp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), deleteAt: new Date(Date.now() + PENDING_INTENT_RETENTION_MS) }], { session });
        return created;
      }, options);
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode) throw error;
      throw databaseUnavailable();
    }
    if (intent.fingerprint !== fingerprint) throw { statusCode: 409, code: 'UPLOAD_INTENT_CONFLICT', message: 'Mã gửi lại đang thuộc bản thu khác.' };
    if (intent.expiresAt.getTime() <= Date.now()) throw { statusCode: 409, code: 'UPLOAD_INTENT_EXPIRED', message: 'Lượt gửi đã hết hạn. Vui lòng gửi lại bằng lượt mới.' };
    return { intentId: intent.id, expiresAt: intent.expiresAt.toISOString(), upload: directAudioStorage.sign(intent.publicId, intent.timestamp) };
  }
}
