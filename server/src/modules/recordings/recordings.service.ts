import { Types } from 'mongoose';
import { Recording } from '../../models/Recording.js';
import { Child } from '../../models/Child.js';
import {
  detectAudio, invalidAudio, localAudioStorage, readDurationSec, MAX_RECORDING_BYTES,
} from '../../services/localAudioStorage.js';
import { assertRecordingContext } from './recordings.policy.js';
import { persistOwnedRecording, type RecordingReceipt } from './recordings.persistence.js';
import { buildRecordingAudioUrl } from './recordings.audioToken.js';

// Parent list view; the newest recordings are what the page shows. Bounded to
// keep the response and query cost predictable for long-lived profiles.
export const RECORDING_LIST_LIMIT = 200;

export type RecordingListItem = {
  id: string; _id: string; childId: string;
  lessonId?: { id: string; title?: string; order?: number };
  activityId?: string; contentVersion?: number; durationSec: number;
  mimeType?: string; byteSize?: number; wordOrPrompt?: string;
  createdAt: string; audioUrl: string;
};

export class RecordingsService {
  static async uploadRecording(
    parentId: string,
    data: {
      childId: string;
      lessonId?: string;
      activityId?: string;
      contentVersion?: number;
      wordOrPrompt?: string;
      buffer: Buffer;
      mimetype: string;
      originalname?: string;
    }
  ): Promise<RecordingReceipt> {
    const context = await assertRecordingContext(parentId, data);

    const kind = detectAudio(data.buffer);
    if (!kind) throw invalidAudio();
    if (data.buffer.length > MAX_RECORDING_BYTES) {
      throw { statusCode: 413, code: 'AUDIO_TOO_LARGE', message: 'Bản thu âm vượt quá 5 MiB.' };
    }

    // Duration comes from the bytes on the server, never from the client.
    const durationSec = await readDurationSec(data.buffer, kind.mime);
    const { storageKey } = await localAudioStorage.writeRecording(context.childId, kind, data.buffer);

    try {
      return await persistOwnedRecording(parentId, context, {
        storageKey, mimeType: kind.mime, byteSize: data.buffer.length, durationSec,
      });
    } catch (error) {
      // The recording did not durably commit (persist reconciles a lost ACK by id before
      // throwing), so the orphaned file must go. Deletion is best-effort and never masks the error.
      await localAudioStorage.deleteKey(storageKey);
      throw error;
    }
  }

  static async getRecordingsByChild(childId: string, parentId: string): Promise<RecordingListItem[]> {
    const child = await Child.exists({ _id: childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé hoặc không có quyền truy cập' };
    }

    const recordings = await Recording.find({ childId: child._id })
      .populate<{ lessonId?: { _id: Types.ObjectId; title?: string; order?: number } }>('lessonId', 'title order')
      .sort({ createdAt: -1 })
      .limit(RECORDING_LIST_LIMIT)
      .lean();

    // Expose a freshly signed audio URL; never leak the on-disk storageKey to clients.
    return recordings.map(recording => {
      const id = String(recording._id);
      const lesson = recording.lessonId;
      return {
        id, _id: id, childId: String(recording.childId),
        lessonId: lesson ? { id: String(lesson._id), title: lesson.title, order: lesson.order } : undefined,
        activityId: recording.activityId, contentVersion: recording.contentVersion,
        durationSec: recording.durationSec, mimeType: recording.mimeType, byteSize: recording.byteSize,
        wordOrPrompt: recording.wordOrPrompt, createdAt: recording.createdAt.toISOString(),
        audioUrl: buildRecordingAudioUrl(id),
      };
    });
  }
}
