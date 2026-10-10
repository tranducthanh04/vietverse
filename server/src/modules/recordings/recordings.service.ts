import { Recording } from '../../models/Recording.js';
import { Child } from '../../models/Child.js';
import { storageService } from '../../services/storage.service.js';
import { assertRecordingContext } from './recordings.policy.js';
import { persistOwnedRecording } from './recordings.persistence.js';

export class RecordingsService {
  static async uploadRecording(
    parentId: string,
    data: {
      childId: string;
      lessonId?: string;
      activityId?: string;
      contentVersion?: number;
      durationSec?: number;
      wordOrPrompt?: string;
      buffer: Buffer;
      mimetype: string;
      originalname?: string;
    }
  ) {
    const context = await assertRecordingContext(parentId, data);

    const uploadRes = await storageService.uploadAudio(
      data.buffer,
      data.mimetype,
      data.originalname || `rec_${data.childId}`
    );

    try {
      return await persistOwnedRecording(parentId, context, { ...uploadRes,
        durationSec: data.durationSec ? Math.max(0, Math.min(180, Number(data.durationSec))) : 0 });
    } catch (error) {
      // Only a definite business rejection is safe to compensate. A DB/commit
      // failure can mean a durable Recording with a lost ACK; retain that audio.
      const status = (error as { statusCode?: number }).statusCode;
      if (status && status >= 400 && status < 500) {
        try { await storageService.deleteAudio(uploadRes.publicId); } catch { /* manual reconciliation */ }
      }
      throw error;
    }
  }

  static async getRecordingsByChild(childId: string, parentId: string) {
    const child = await Child.findOne({ _id: childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé hoặc không có quyền truy cập' };
    }

    return Recording.find({ childId: child._id })
      .populate('lessonId', 'title order')
      .sort({ createdAt: -1 });
  }
}
