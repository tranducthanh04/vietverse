import { Recording } from '../../models/Recording.js';
import { Child } from '../../models/Child.js';
import { storageService } from '../../services/storage.service.js';
import { assertRecordingContext } from './recordings.policy.js';

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

    const recording = await Recording.create({
      childId: context.childId,
      lessonId: data.lessonId,
      activityId: data.activityId,
      contentVersion: context.contentVersion,
      url: uploadRes.url,
      publicId: uploadRes.publicId,
      durationSec: data.durationSec ? Math.max(0, Math.min(180, Number(data.durationSec))) : 0,
      wordOrPrompt: data.wordOrPrompt || '',
    });

    return { ...recording.toObject(), id: recording.id };
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
