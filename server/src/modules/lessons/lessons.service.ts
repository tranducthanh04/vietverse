import { Lesson } from '../../models/Lesson.js';
import { LessonProgress } from '../../models/LessonProgress.js';
import { Child } from '../../models/Child.js';
import { Stage } from '../../models/Stage.js';
import { PointTransaction } from '../../models/PointTransaction.js';
import { POINT_RULES } from '../../constants/points.js';
import { assertLessonUnlocked } from './lessons.policy.js';
import { gradeActivity, ActivitySubmission } from './lessons.grading.js';
import { Recording } from '../../models/Recording.js';
import { readPublished, resolveSubmissionVersion } from '../content/content.reader.js';

export class LessonsService {
  static async getLessonById(lessonId: string, parentId?: string, childId?: string, contentVersion?: number) {
    if (!parentId || !childId) throw { statusCode: 400, message: 'Thiếu hồ sơ bé để mở bài học.' };
    const { stage } = await assertLessonUnlocked(childId, lessonId, parentId);
    const published = await readPublished('lesson', lessonId, contentVersion);
    return { ...published.payload, _id: lessonId, id: lessonId, stageId: stage, contentVersion: published.contentVersion };
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

    let pointsEarned = 0;

    // Only award points if passed and first time completed
    if (passed && isFirstTimeCompleted) {
      // Idempotent point awarding for completing this lesson (+10 points)
      const existingLessonTx = await PointTransaction.findOne({
        childId: child._id,
        reason: 'lesson',
        refId: lesson._id.toString(),
      });

      if (!existingLessonTx) {
        try {
          await PointTransaction.create({
            childId: child._id,
            delta: POINT_RULES.LESSON_COMPLETE,
            reason: 'lesson',
            refId: lesson._id.toString(),
            description: `Hoàn thành bài học: ${lesson.title}`,
          });

          pointsEarned += POINT_RULES.LESSON_COMPLETE;
        } catch (err: any) {
          if (err.code !== 11000) throw err;
        }
      }

      // Check Stage completion bonus (+20 points)
      const allStageLessons = await Lesson.find({ stageId: lesson.stageId });
      const allStageLessonIds = allStageLessons.map((l) => l._id.toString());
      const completedProgresses = await LessonProgress.find({
        childId: child._id,
        lessonId: { $in: allStageLessonIds },
        status: 'completed',
      });

      const isStageFullyDone =
        allStageLessons.length > 0 &&
        allStageLessons.every((l) =>
          completedProgresses.some((p) => p.lessonId.toString() === l._id.toString())
        );

      if (isStageFullyDone) {
        const existingStageTx = await PointTransaction.findOne({
          childId: child._id,
          reason: 'stage_complete',
          refId: lesson.stageId.toString(),
        });

        if (!existingStageTx) {
          try {
            await PointTransaction.create({
              childId: child._id,
              delta: POINT_RULES.STAGE_COMPLETE,
              reason: 'stage_complete',
              refId: lesson.stageId.toString(),
              description: `Hoàn thành toàn bộ chặng học!`,
            });
            pointsEarned += POINT_RULES.STAGE_COMPLETE;
          } catch (err: any) {
            if (err.code !== 11000) throw err;
          }
        }
      }

      // Check Lesson 20 Treasure bonus (+50 points)
      if (lesson.order === 20) {
        const existingTreasureTx = await PointTransaction.findOne({
          childId: child._id,
          reason: 'treasure',
          refId: `treasure_lesson_${lesson._id.toString()}`,
        });

        if (!existingTreasureTx) {
          try {
            await PointTransaction.create({
              childId: child._id,
              delta: POINT_RULES.LESSON_20_TREASURE,
              reason: 'treasure',
              refId: `treasure_lesson_${lesson._id.toString()}`,
              description: `Mở khóa Báu vật Nước Nam (Bài 20)!`,
            });
            pointsEarned += POINT_RULES.LESSON_20_TREASURE;
          } catch (err: any) {
            if (err.code !== 11000) throw err;
          }
        }
      }
    }

    // Atomically increment child's points if any points were awarded
    let updatedChild = child;
    if (pointsEarned > 0) {
      updatedChild = (await Child.findByIdAndUpdate(
        child._id,
        {
          $inc: { viviPoints: pointsEarned },
        },
        { new: true }
      ))!;
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
