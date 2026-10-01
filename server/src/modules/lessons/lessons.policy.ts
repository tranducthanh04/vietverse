import { Child } from '../../models/Child.js';
import { Lesson } from '../../models/Lesson.js';
import { Stage } from '../../models/Stage.js';
import { LessonProgress } from '../../models/LessonProgress.js';
import { Subscription } from '../../models/Subscription.js';

/**
 * Checks whether a user subscription is currently active, paid, and unexpired.
 */
export function isSubscriptionPaid(subscription: any): boolean {
  if (!subscription) return false;
  if (subscription.active === false) return false;
  if (subscription.plan !== 'monthly' && subscription.plan !== 'yearly') return false;
  if (subscription.expiresAt && new Date(subscription.expiresAt) <= new Date()) return false;
  return true;
}

/**
 * Enforces lesson unlock policies according to business rules:
 * 1. Child must belong to parentId.
 * 2. Lesson must exist.
 * 3. If lesson was already completed by this child, it is unlocked (allow review/replay).
 * 4. Stage 1 is accessible to all valid users. Stage N (N > 1) requires an active paid subscription
 *    and 100% completion of Stage N-1.
 * 5. Within an unlocked stage, the first lesson is unlocked; subsequent lessons require the
 *    immediately preceding lesson in that stage to be completed.
 */
export async function assertLessonUnlocked(
  childId: string,
  lessonId: string,
  parentId: string
): Promise<{ child: any; lesson: any; stage: any }> {
  // 1. Verify child ownership
  const child = await Child.findOne({ _id: childId, parentId });
  if (!child) {
    throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé hoặc không có quyền sở hữu' };
  }

  // 2. Verify lesson existence
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw { statusCode: 404, message: 'Không tìm thấy bài học' };
  }

  const stage = await Stage.findById(lesson.stageId);
  if (!stage) {
    throw { statusCode: 404, message: 'Không tìm thấy chặng học' };
  }

  // 3. If child already completed this lesson, it is unlocked (allow replay)
  const existingProgress = await LessonProgress.findOne({
    childId: child._id,
    lessonId: lesson._id,
  });
  if (existingProgress && existingProgress.status === 'completed') {
    return { child, lesson, stage };
  }

  // 4. Verify stage unlock condition
  const subscription = await Subscription.findOne({ userId: parentId });
  const isPaid = isSubscriptionPaid(subscription);

  if (stage.order > 1) {
    if (!isPaid) {
      throw {
        statusCode: 403,
        message: 'Chặng học này yêu cầu gói đăng ký trả phí (Monthly hoặc Yearly).',
      };
    }

    const prevStage = await Stage.findOne({ order: stage.order - 1 });
    if (prevStage) {
      const prevLessons = await Lesson.find({ stageId: prevStage._id });
      const prevLessonIds = prevLessons.map((l) => l._id);
      const completedCount = await LessonProgress.countDocuments({
        childId: child._id,
        lessonId: { $in: prevLessonIds },
        status: 'completed',
      });
      if (completedCount < prevLessons.length) {
        throw {
          statusCode: 403,
          message: `Bé cần hoàn thành toàn bộ bài học của Chặng ${prevStage.order} trước khi mở khóa Chặng này.`,
        };
      }
    }
  }

  // 5. Verify lesson sequence in current stage
  const stageLessons = await Lesson.find({ stageId: stage._id }).sort({ order: 1 });
  const lessonIndex = stageLessons.findIndex((l) => l._id.toString() === lesson._id.toString());

  if (lessonIndex > 0) {
    const prevLesson = stageLessons[lessonIndex - 1];
    const prevProgress = await LessonProgress.findOne({
      childId: child._id,
      lessonId: prevLesson._id,
      status: 'completed',
    });
    if (!prevProgress) {
      throw {
        statusCode: 403,
        message: `Bé cần hoàn thành bài học trước đó: '${prevLesson.title}' trước khi học bài này.`,
      };
    }
  }

  return { child, lesson, stage };
}
