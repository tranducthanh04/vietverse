import { Child } from '../../models/Child.js';
import { assertLessonUnlocked } from '../lessons/lessons.policy.js';
import { readPublished, resolveSubmissionVersion } from '../content/content.reader.js';
import type { RecordingContext } from './recordings.validation.js';

export async function assertRecordingContext(parentId: string, context: RecordingContext): Promise<RecordingContext> {
  if (!await Child.exists({ _id: context.childId, parentId })) {
    throw { statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ của bé hoặc không có quyền truy cập.' };
  }
  if (Boolean(context.lessonId) !== Boolean(context.activityId)) throw { statusCode: 400, message: 'Cần cả bài học và hoạt động thu âm.' };
  let contentVersion: number | undefined;
  if (context.lessonId && context.activityId) {
    const { lesson } = await assertLessonUnlocked(context.childId, context.lessonId, parentId);
    contentVersion = resolveSubmissionVersion(context.contentVersion, lesson.contentVersion ?? 0);
    const { payload } = await readPublished('lesson', context.lessonId, contentVersion);
    if (!payload.activities.some(activity => activity.id === context.activityId && activity.type === 'record_voice')) {
      throw { statusCode: 400, message: 'Hoạt động không phải thu âm trong phiên bản bài học này.' };
    }
  } else if (context.contentVersion !== undefined) throw { statusCode: 400, message: 'Phiên bản thu âm cần gắn với bài học.' };
  return { childId: context.childId, lessonId: context.lessonId, activityId: context.activityId, contentVersion, wordOrPrompt: context.wordOrPrompt ?? '' };
}
