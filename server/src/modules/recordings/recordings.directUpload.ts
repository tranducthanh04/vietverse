import { createHash, randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { Child } from '../../models/Child.js';
import { RecordingUploadIntent } from '../../models/RecordingUploadIntent.js';
import { directAudioStorage, type UploadIntentDto } from '../../services/directAudioStorage.js';
import { assertRecordingContext } from './recordings.policy.js';
import { uploadIntentSchema, type UploadIntentInput } from './recordings.validation.js';
import { databaseUnavailable, findOwnedRecordingReceipt, intentExpired, persistOwnedRecording, type RecordingReceipt } from './recordings.persistence.js';

export class DirectRecordingsService {
  static async finalize(parentId: string, intentId: string): Promise<RecordingReceipt> {
    // The Recording remains the receipt even after the intent TTL has elapsed.
    const existing = await findOwnedRecordingReceipt(parentId, intentId);
    if (existing) return existing;
    const intent = await RecordingUploadIntent.findOne({ _id: intentId, parentId });
    if (!intent) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy lượt gửi thu âm.' };
    if (intent.expiresAt.getTime() <= Date.now()) throw intentExpired();
    const context = await assertRecordingContext(parentId, { childId: intent.childId.toString(),
      lessonId: intent.lessonId?.toString(), activityId: intent.activityId ?? undefined, contentVersion: intent.contentVersion ?? undefined, wordOrPrompt: intent.wordOrPrompt ?? undefined });
    const audio = await directAudioStorage.inspect(intent.publicId);
    return persistOwnedRecording(parentId, context, { url: audio.url, publicId: audio.publicId, durationSec: audio.durationSec }, intentId);
  }

  static async createIntent(parentId: string, input: UploadIntentInput): Promise<UploadIntentDto> {
    const parsed = uploadIntentSchema.parse(input);
    const context = await assertRecordingContext(parentId, parsed);
    const fingerprint = createHash('sha256').update(JSON.stringify({ ...context, byteLength: parsed.byteLength, mimeType: parsed.mimeType, durationSec: parsed.durationSec })).digest('hex');
    const publicId = `vietverse/recordings/${randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000);
    directAudioStorage.sign(publicId, timestamp); // Storage preflight outside transaction.
    let attempts = 0;
    let intent;
    const options = { maxCommitTimeMS: 5000, timeoutMS: 15000 };
    try {
      intent = await mongoose.connection.transaction(async session => {
        if (++attempts > 3) throw databaseUnavailable();
        const existing = await RecordingUploadIntent.findOne({ parentId, requestId: parsed.requestId }).session(session);
        // Creation AND deduplication share the deletion boundary. A stale
        // snapshot conflicts with delete and retries against the absent child.
        const child = await Child.updateOne({ _id: context.childId, parentId }, { $inc: { __v: 1 } }, { session, timestamps: false });
        if (child.matchedCount !== 1) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ của bé.' };
        if (existing) return existing;
        const [created] = await RecordingUploadIntent.create([{ ...context, parentId, requestId: parsed.requestId, fingerprint, publicId, timestamp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), deleteAt: new Date(Date.now() + 7 * 86400000) }], { session });
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
