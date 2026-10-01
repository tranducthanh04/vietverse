import { Lesson } from '../../models/Lesson.js';
import { LessonProgress } from '../../models/LessonProgress.js';
import { Child } from '../../models/Child.js';
import { Stage } from '../../models/Stage.js';
import { PointTransaction } from '../../models/PointTransaction.js';
import { POINT_RULES } from '../../constants/points.js';
import { Types } from 'mongoose';

export class LessonsService {
  static async getLessonById(lessonId: string) {
    const lesson = await Lesson.findById(lessonId).populate('stageId');
    if (!lesson) {
      throw { statusCode: 404, message: 'Không tìm thấy bài học' };
    }
    return lesson;
  }

  static async completeLesson(
    lessonId: string,
    parentId: string,
    data: { childId: string; scorePercent: number; durationSec?: number; answers?: any[] }
  ) {
    const child = await Child.findOne({ _id: data.childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé hoặc không có quyền sở hữu' };
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw { statusCode: 404, message: 'Không tìm thấy bài học' };
    }

    // Calculate stars
    let stars = 1;
    if (data.scorePercent >= 90) {
      stars = 3;
    } else if (data.scorePercent >= 70) {
      stars = 2;
    }

    // Upsert LessonProgress
    const existingProgress = await LessonProgress.findOne({
      childId: child._id,
      lessonId: lesson._id,
    });

    const isFirstTimeCompleted = !existingProgress || existingProgress.status !== 'completed';

    const progress = await LessonProgress.findOneAndUpdate(
      { childId: child._id, lessonId: lesson._id },
      {
        $set: {
          status: 'completed',
          scorePercent: Math.max(existingProgress?.scorePercent || 0, data.scorePercent),
          stars: Math.max(existingProgress?.stars || 0, stars),
          completedAt: new Date(),
        },
        $inc: { attempts: 1 },
      },
      { upsert: true, new: true }
    );

    let pointsEarned = 0;

    // Idempotent point awarding for completing this lesson
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
      pointsEarned,
      totalPoints: updatedChild.viviPoints,
      isFirstTimeCompleted,
    };
  }
}
