import { Recording } from '../../models/Recording.js';
import { Child } from '../../models/Child.js';
import { storageService } from '../../services/storage.service.js';
import { assertLessonUnlocked } from '../lessons/lessons.policy.js';
import { readPublished, resolveSubmissionVersion } from '../content/content.reader.js';

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
    const child = await Child.findOne({ _id: data.childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé hoặc không có quyền truy cập' };
    }

    if (Boolean(data.lessonId) !== Boolean(data.activityId)) throw { statusCode: 400, message: 'Cần cả bài học và hoạt động thu âm.' };
    let contentVersion: number | undefined;
    if (data.lessonId && data.activityId) {
      const { lesson } = await assertLessonUnlocked(data.childId, data.lessonId, parentId);
      contentVersion = resolveSubmissionVersion(data.contentVersion, lesson.contentVersion ?? 0);
      const { payload } = await readPublished('lesson', data.lessonId, contentVersion);
      if (!payload.activities.some(activity => activity.id === data.activityId && activity.type === 'record_voice')) {
        throw { statusCode: 400, message: 'Hoạt động không phải thu âm trong phiên bản bài học này.' };
      }
    } else if (data.contentVersion !== undefined) {
      throw { statusCode: 400, message: 'Phiên bản thu âm cần gắn với bài học.' };
    }

    const uploadRes = await storageService.uploadAudio(
      data.buffer,
      data.mimetype,
      data.originalname || `rec_${data.childId}`
    );

    const recording = await Recording.create({
      childId: child._id,
      lessonId: data.lessonId,
      activityId: data.activityId,
      contentVersion,
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
