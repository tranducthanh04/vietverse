import { Types } from 'mongoose';
import { Lesson } from '../../models/Lesson.js';
import { LessonProgress } from '../../models/LessonProgress.js';
import { Child } from '../../models/Child.js';
import { PointTransaction } from '../../models/PointTransaction.js';
import { PointReason } from '../../constants/points.js';
import { getPointRuleAmount } from '../../services/pointRules.service.js';
import { assertLessonUnlocked } from './lessons.policy.js';
import { gradeActivity, ActivitySubmission } from './lessons.grading.js';
import { Recording } from '../../models/Recording.js';
import { readPublished, resolveSubmissionVersion } from '../content/content.reader.js';
import { toLearnerLessonPayload } from '../content/content.dto.js';
import { isNewActivityType } from '../content/newActivity.contract.js';

interface AwardDraft {
  delta: number;
  reason: PointReason;
  refId: string;
  description: string;
}

interface BulkWriteErrorLike {
  writeErrors?: Array<{ code?: number; err?: { code?: number } }>;
  insertedDocs?: Array<{ _id: Types.ObjectId; delta: number }>;
}

/**
 * Inserts reward transactions with one read + one bulk insert. Rules set to 0 write nothing. Rows already
 * present (same child/reason/refId) fail with E11000 and are skipped, so only newly inserted
 * deltas count toward the balance. Any other write error removes this call's rows and rethrows.
 */
async function insertNewAwards(childId: Types.ObjectId, drafts: AwardDraft[]) {
  const positive = drafts.filter((draft) => draft.delta > 0);
  if (positive.length === 0) return { insertedIds: [] as Types.ObjectId[], pointsEarned: 0 };
  // One read skips known awards (defence in depth if the unique index is missing on a deployment);
  // the unique index still decides concurrent races below.
  const existing = await PointTransaction.find({
    childId,
    $or: positive.map(({ reason, refId }) => ({ reason, refId })),
  }).select('reason refId').lean();
  const existingKeys = new Set(existing.map((tx) => `${tx.reason}|${tx.refId}`));
  const payable = positive.filter((draft) => !existingKeys.has(`${draft.reason}|${draft.refId}`));
  if (payable.length === 0) return { insertedIds: [] as Types.ObjectId[], pointsEarned: 0 };
  let inserted: Array<{ _id: Types.ObjectId; delta: number }>;
  try {
    inserted = await PointTransaction.insertMany(
      payable.map((draft) => ({ childId, ...draft })),
      { ordered: false }
    );
  } catch (error: unknown) {
    const bulk = error as BulkWriteErrorLike;
    const writeErrors = bulk.writeErrors ?? [];
    inserted = bulk.insertedDocs ?? [];
    const onlyDuplicates = writeErrors.length > 0
      && writeErrors.every((writeError) => (writeError.code ?? writeError.err?.code) === 11000);
    if (!onlyDuplicates) {
      if (inserted.length) await PointTransaction.deleteMany({ _id: { $in: inserted.map((doc) => doc._id) } });
      throw error;
    }
  }
  return {
    insertedIds: inserted.map((doc) => doc._id),
    pointsEarned: inserted.reduce((sum, doc) => sum + doc.delta, 0),
  };
}

export class LessonsService {
  static async getLessonById(lessonId: string, parentId?: string, childId?: string, contentVersion?: number, activityContract?: 2) {
    if (!parentId || !childId) throw { statusCode: 400, message: 'Thiếu hồ sơ bé để mở bài học.' };
    const { stage } = await assertLessonUnlocked(childId, lessonId, parentId);
    const published = await readPublished('lesson', lessonId, contentVersion);
    if (activityContract !== 2 && published.payload.activities.some(activity => isNewActivityType(activity.type))) {
      throw { statusCode: 409, code: 'ACTIVITY_CLIENT_UPDATE_REQUIRED', message: 'Vui lòng cập nhật trang để học hoạt động mới.' };
    }
    return { ...toLearnerLessonPayload(published.payload), _id: lessonId, id: lessonId, stageId: stage, contentVersion: published.contentVersion };
  }

  static async completeLesson(
    lessonId: string,
    parentId: string,
    data: {
      childId: string;
      contentVersion?: number;
      scorePercent?: number;
      durationSec?: number;
      answers?: ActivitySubmission[];
    }
  ) {
    // 1. Enforce unlock & ownership
    const { child, lesson } = await assertLessonUnlocked(data.childId, lessonId, parentId);
    const contentVersion = resolveSubmissionVersion(data.contentVersion, lesson.contentVersion ?? 0);
    const { payload } = await readPublished('lesson', lessonId, contentVersion);
    const submittedIds = (data.answers ?? []).map(answer => answer.activityId);
    if (new Set(submittedIds).size !== submittedIds.length) {
      throw { statusCode: 400, code: 'DUPLICATE_ACTIVITY_ANSWER', message: 'Mỗi hoạt động chỉ được gửi một câu trả lời.' };
    }

    // 2. Validate activity IDs belong to this lesson
    const lessonActivityIds = new Set(payload.activities.map((a) => a.id));
    if (data.answers && data.answers.length > 0) {
      for (const ans of data.answers) {
        if (!lessonActivityIds.has(ans.activityId)) {
          throw {
            statusCode: 400,
            message: `Hoạt động '${ans.activityId}' không thuộc bài học này.`,
          };
        }
      }
    }

    // 3. Server-side grading of activities
    let correctActivitiesCount = 0;
    const passedActivityIds: string[] = [];
    const totalActivities = payload.activities.length;
    let computedScorePercent = 0;
    const recordingIds = (data.answers ?? []).map(answer => answer.userAnswer)
      .filter((answer): answer is string => typeof answer === 'string' && /^[a-f\d]{24}$/i.test(answer));
    const recordings = recordingIds.length ? await Recording.find({
      _id: { $in: recordingIds }, childId: child._id, lessonId,
      ...(contentVersion === 0 ? { $or: [{ contentVersion: 0 }, { contentVersion: { $exists: false } }] } : { contentVersion }),
    }).select('_id activityId') : [];
    const recordingActivities = new Map(recordings.map(recording => [recording.id, recording.activityId]));

    if (totalActivities === 0) {
      computedScorePercent = 100;
    } else {
      if (!data.answers || data.answers.length === 0) {
        throw {
          statusCode: 400,
          message: 'Thiếu câu trả lời cho các hoạt động trong bài học.',
        };
      }

      for (const activity of payload.activities) {
        const submission = data.answers.find((a) => a.activityId === activity.id);
        const correct = activity.type === 'record_voice'
          ? typeof submission?.userAnswer === 'string' && recordingActivities.get(submission.userAnswer) === activity.id
          : gradeActivity(activity, submission);
        if (correct) {
          correctActivitiesCount++;
          passedActivityIds.push(activity.id);
        }
      }

      computedScorePercent = Math.round((correctActivitiesCount / totalActivities) * 100);
    }

    // Must reach at least 50% to pass and complete
    const passed = computedScorePercent >= 50;

    // Calculate stars
    let stars = 0;
    if (computedScorePercent >= 90) {
      stars = 3;
    } else if (computedScorePercent >= 70) {
      stars = 2;
    } else if (passed) {
      stars = 1;
    }

    // Check existing progress
    const existingProgress = await LessonProgress.findOne({
      childId: child._id,
      lessonId: lesson._id,
    });

    const isFirstTimeCompleted = !existingProgress || existingProgress.status !== 'completed';

    // Upsert LessonProgress
    const newStatus = passed ? 'completed' : existingProgress?.status || 'in_progress';
    const progress = await LessonProgress.findOneAndUpdate(
      { childId: child._id, lessonId: lesson._id },
      {
        $set: {
          status: newStatus,
          scorePercent: Math.max(existingProgress?.scorePercent || 0, computedScorePercent),
          stars: Math.max(existingProgress?.stars || 0, stars),
          ...(passed ? { completedAt: new Date() } : {}),
        },
        $inc: { attempts: 1 },
      },
      { upsert: true, new: true }
    );

    // Reward drafts; the partial unique index on (childId, reason, refId) makes each award one-time.
    const awards: AwardDraft[] = [];
    if (passed) {
      // D1: +ACTIVITY_COMPLETE per server-passed activity, only on a passed submission (assumption:
      // keeps the existing 50% pass gate for all rewards). Already-awarded activities are skipped by the index.
      const activityAmount = await getPointRuleAmount('ACTIVITY_COMPLETE');
      for (const activityId of passedActivityIds) {
        awards.push({
          delta: activityAmount,
          reason: 'activity',
          refId: `${lesson._id.toString()}:${activityId}`,
          description: `Hoàn thành hoạt động trong bài: ${lesson.title}`,
        });
      }
    }

    if (passed && isFirstTimeCompleted) {
      awards.push({
        delta: await getPointRuleAmount('LESSON_COMPLETE'),
        reason: 'lesson',
        refId: lesson._id.toString(),
        description: `Hoàn thành bài học: ${lesson.title}`,
      });

      // Stage bonus: every lesson of the stage has a completed progress for this child.
      const stageLessonIds = await Lesson.distinct('_id', { stageId: lesson.stageId });
      const completedLessonIds = stageLessonIds.length
        ? await LessonProgress.distinct('lessonId', {
            childId: child._id,
            lessonId: { $in: stageLessonIds },
            status: 'completed',
          })
        : [];
      if (stageLessonIds.length > 0 && completedLessonIds.length === stageLessonIds.length) {
        awards.push({
          delta: await getPointRuleAmount('STAGE_COMPLETE'),
          reason: 'stage_complete',
          refId: lesson.stageId.toString(),
          description: `Hoàn thành toàn bộ chặng học!`,
        });
      }

      if (lesson.order === 20) {
        awards.push({
          delta: await getPointRuleAmount('LESSON_20_TREASURE'),
          reason: 'treasure',
          refId: `treasure_lesson_${lesson._id.toString()}`,
          description: `Mở khóa Báu vật Nước Nam (Bài 20)!`,
        });
      }
    }

    const { insertedIds, pointsEarned } = await insertNewAwards(child._id, awards);

    // Atomically increment child's points; on failure remove this request's ledger rows (compensation)
    let updatedChild = child;
    if (pointsEarned > 0) {
      try {
        const incremented = await Child.findByIdAndUpdate(
          child._id,
          { $inc: { viviPoints: pointsEarned } },
          { new: true }
        );
        if (!incremented) throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé' };
        updatedChild = incremented;
      } catch (err) {
        await PointTransaction.deleteMany({ _id: { $in: insertedIds } });
        throw err;
      }
    }

    return {
      progress,
      stars,
      scorePercent: computedScorePercent,
      pointsEarned,
      totalPoints: updatedChild.viviPoints,
      isFirstTimeCompleted,
      passed,
    };
  }
}
