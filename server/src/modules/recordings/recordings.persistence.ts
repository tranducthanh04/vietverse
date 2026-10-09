import mongoose, { type ClientSession } from 'mongoose';
import { Child } from '../../models/Child.js';
import { Recording, type IRecording } from '../../models/Recording.js';
import { RecordingUploadIntent } from '../../models/RecordingUploadIntent.js';
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

// Both legacy and direct uploads coordinate with child deletion by writing Child.
// No provider network call is held inside this transaction.
export async function persistOwnedRecording(parentId: string, context: RecordingContext,
  audio: { url: string; publicId?: string; durationSec: number }, intentId?: string): Promise<RecordingReceipt> {
  await assertRecordingContext(parentId, context);
  try {
    let attempts = 0;
    const options = { maxCommitTimeMS: 5000, timeoutMS: 15000 };
    return await mongoose.connection.transaction(async session => {
      if (++attempts > 3) throw databaseUnavailable();
      const child = await Child.updateOne({ _id: context.childId, parentId }, { $inc: { __v: 1 } }, { session, timestamps: false });
      if (child.matchedCount !== 1) throw notFound();
      if (intentId) {
        const existing = await findOwnedRecordingReceipt(parentId, intentId, session);
        if (existing) return existing;
        const intent = await RecordingUploadIntent.findOne({ _id: intentId, parentId, childId: context.childId }).session(session);
        if (!intent) throw notFound();
        if (intent.expiresAt.getTime() <= Date.now()) throw intentExpired();
      }
      const [recording] = await Recording.create([{ ...context, ...audio, ...(intentId ? { uploadIntentId: intentId } : {}) }], { session });
      if (intentId) {
        const result = await RecordingUploadIntent.updateOne({ _id: intentId, parentId, status: 'pending' },
          { $set: { status: 'completed', recordingId: recording._id } }, { session });
        if (result.matchedCount !== 1) throw notFound();
      }
      return receipt(recording);
    }, options);
  } catch (error) {
    if (intentId && (error as { code?: number }).code === 11000) {
      const existing = await findOwnedRecordingReceipt(parentId, intentId);
      if (existing) return existing;
    }
    if ((error as { statusCode?: number }).statusCode) throw error;
    throw databaseUnavailable();
  }
}
