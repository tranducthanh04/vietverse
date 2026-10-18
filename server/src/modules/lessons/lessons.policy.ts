import { Child } from '../../models/Child.js';
import { Lesson } from '../../models/Lesson.js';
import { Stage } from '../../models/Stage.js';
import { LessonProgress } from '../../models/LessonProgress.js';
import { Subscription } from '../../models/Subscription.js';
import type { ClientSession, Types } from 'mongoose';

/**
 * Checks whether a user subscription is currently active, paid, and unexpired.
 */
export function isSubscriptionPaid(subscription: any): boolean {
  if (!subscription) return false;
  if (subscription.active !== true) return false;
  if (subscription.plan !== 'monthly' && subscription.plan !== 'yearly') return false;
  if (!subscription.expiresAt) return false;
  const expiry = new Date(subscription.expiresAt).getTime();
  return Number.isFinite(expiry) && expiry > Date.now();
}

type Deferred<T> = () => Promise<T>;

/**
 * Outside a transaction the query starts immediately and the returned thunk yields the same
 * promise, so independent reads overlap while results are still checked in the original order.
 * Inside a session MongoDB forbids concurrent operations, so the query stays lazy and sequential.
 */
function deferRead<T>(session: ClientSession | undefined, read: () => PromiseLike<T>): Deferred<T> {
  if (session) return async () => read();
  const pending = Promise.resolve(read());
  // The result may be skipped when an earlier check throws; never surface that as unhandled.
  pending.catch(() => undefined);
  return () => pending;
}

async function previousStageProgress(stageOrder: number, childId: string, session?: ClientSession) {
  const prevStage = await Stage.findOne({ order: stageOrder - 1 }).select('_id order').session(session ?? null).lean();
  if (!prevStage) return null;
  const prevLessons = await Lesson.find({ stageId: prevStage._id }).select('_id').session(session ?? null).lean();
  const completedCount = await LessonProgress.countDocuments({
    childId,
    lessonId: { $in: prevLessons.map((l) => l._id) },
    status: 'completed',
  }).session(session ?? null);
  return { order: prevStage.order, total: prevLessons.length, completedCount };
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
 *
 * The returned lesson is the full live document so callers can pass it to `readPublished`
 * instead of reading it again.
 */
export async function assertLessonUnlocked(
  childId: string,
  lessonId: string,
  parentId: string,
  session?: ClientSession
): Promise<{ child: any; lesson: any; stage: any }> {
  // Progress/subscription reads are keyed by the requested ids; their results are only used
  // after ownership and existence have been confirmed below.
  const childRead = deferRead(session, () => Child.findOne({ _id: childId, parentId }).select('_id viviPoints').session(session ?? null).lean());
  const lessonRead = deferRead(session, () => Lesson.findById(lessonId).session(session ?? null));
  const progressRead = deferRead(session, () => LessonProgress.findOne({ childId, lessonId }).select('status').session(session ?? null).lean());
  const subscriptionRead = deferRead(session, () => Subscription.findOne({ userId: parentId }).select('plan active expiresAt').session(session ?? null).lean());

  // 1. Verify child ownership
  const child = await childRead();
  if (!child) {
    throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé hoặc không có quyền sở hữu' };
  }

  // 2. Verify lesson existence
  const lesson = await lessonRead();
  if (!lesson) {
    throw { statusCode: 404, message: 'Không tìm thấy bài học' };
  }

  const stageRead = deferRead(session, () => Stage.findById(lesson.stageId).session(session ?? null));
  const stageLessonsRead = deferRead(session, () => Lesson.find({ stageId: lesson.stageId })
    .select('_id title').sort({ order: 1 }).session(session ?? null).lean<Array<{ _id: Types.ObjectId; title: string }>>());

  const stage = await stageRead();
  if (!stage) {
    throw { statusCode: 404, message: 'Không tìm thấy chặng học' };
  }

  // 3. If child already completed this lesson, it is unlocked (allow replay)
  const existingProgress = await progressRead();
  if (existingProgress && existingProgress.status === 'completed') {
    return { child, lesson, stage };
  }

  // 4. Verify stage unlock condition
  const isPaid = isSubscriptionPaid(await subscriptionRead());
  if (stage.order > 1 && !isPaid) {
    throw {
      statusCode: 403,
      message: 'Chặng học này yêu cầu gói đăng ký trả phí (Monthly hoặc Yearly).',
    };
  }
  const prevStageRead = stage.order > 1
    ? deferRead(session, () => previousStageProgress(stage.order, childId, session))
    : undefined;

  // 5. Locate the preceding lesson in the current stage
  const stageLessons = await stageLessonsRead();
  const lessonIndex = stageLessons.findIndex((l) => l._id.toString() === lesson._id.toString());
  const prevLesson = lessonIndex > 0 ? stageLessons[lessonIndex - 1] : undefined;
  const prevProgressRead = prevLesson
    ? deferRead(session, () => LessonProgress.exists({ childId, lessonId: prevLesson._id, status: 'completed' }).session(session ?? null))
    : undefined;

  if (prevStageRead) {
    const prev = await prevStageRead();
    if (prev && prev.completedCount < prev.total) {
      throw {
        statusCode: 403,
        message: `Bé cần hoàn thành toàn bộ bài học của Chặng ${prev.order} trước khi mở khóa Chặng này.`,
      };
    }
  }

  if (prevLesson && prevProgressRead && !(await prevProgressRead())) {
    throw {
      statusCode: 403,
      message: `Bé cần hoàn thành bài học trước đó: '${prevLesson.title}' trước khi học bài này.`,
    };
  }

  return { child, lesson, stage };
}
