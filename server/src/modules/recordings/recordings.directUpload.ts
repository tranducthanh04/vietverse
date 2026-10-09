import { createHash, randomUUID } from 'node:crypto';
import { RecordingUploadIntent } from '../../models/RecordingUploadIntent.js';
import { directAudioStorage, type UploadIntentDto } from '../../services/directAudioStorage.js';
import { assertRecordingContext } from './recordings.policy.js';
import { uploadIntentSchema, type UploadIntentInput } from './recordings.validation.js';
import { findOwnedRecordingReceipt, intentExpired, persistOwnedRecording, type RecordingReceipt } from './recordings.persistence.js';

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
    let intent = await RecordingUploadIntent.findOne({ parentId, requestId: parsed.requestId });
    if (!intent) {
      const publicId = `vietverse/recordings/${randomUUID()}`;
      const timestamp = Math.floor(Date.now() / 1000);
      directAudioStorage.sign(publicId, timestamp); // Check storage before writing an intent.
      try {
        intent = await RecordingUploadIntent.create({ ...context, parentId, requestId: parsed.requestId, fingerprint, publicId, timestamp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), deleteAt: new Date(Date.now() + 7 * 86400000) });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        intent = await RecordingUploadIntent.findOne({ parentId, requestId: parsed.requestId });
        if (!intent) throw error;
      }
    }
    if (intent.fingerprint !== fingerprint) throw { statusCode: 409, code: 'UPLOAD_INTENT_CONFLICT', message: 'Mã gửi lại đang thuộc bản thu khác.' };
    if (intent.expiresAt.getTime() <= Date.now()) throw { statusCode: 409, code: 'UPLOAD_INTENT_EXPIRED', message: 'Lượt gửi đã hết hạn. Vui lòng gửi lại bằng lượt mới.' };
    return { intentId: intent.id, expiresAt: intent.expiresAt.toISOString(), upload: directAudioStorage.sign(intent.publicId, intent.timestamp) };
  }
}
