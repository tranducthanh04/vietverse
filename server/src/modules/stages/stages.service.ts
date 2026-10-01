import { Stage } from '../../models/Stage.js';
import { Lesson } from '../../models/Lesson.js';
import { LessonProgress } from '../../models/LessonProgress.js';
import { Subscription } from '../../models/Subscription.js';
import { Child } from '../../models/Child.js';
import { isSubscriptionPaid } from '../lessons/lessons.policy.js';

export class StagesService {
  static async getStagesForChild(parentId: string, childId?: string) {
    const stages = await Stage.find().sort({ order: 1 });
    const subscription = await Subscription.findOne({ userId: parentId });
    const isPaid = isSubscriptionPaid(subscription);

    if (!childId) {
      // Just return stage overview
      return stages.map((stage) => ({
        ...stage.toObject(),
        isUnlocked: stage.order === 1 || isPaid,
        requiresSubscription: stage.order > 1 && !isPaid,
      }));
    }

    const child = await Child.findOne({ _id: childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé' };
    }

    // Get all completed lessons for this child
    const completedProgresses = await LessonProgress.find({
      childId: child._id,
      status: 'completed',
    });

    const completedLessonIds = new Set(completedProgresses.map((p) => p.lessonId.toString()));
    const progressMap = new Map(completedProgresses.map((p) => [p.lessonId.toString(), p]));

    const enrichedStages = await Promise.all(
      stages.map(async (stage) => {
        const lessons = await Lesson.find({ stageId: stage._id }).sort({ order: 1 });
        const totalLessons = lessons.length;
        const completedCount = lessons.filter((l) => completedLessonIds.has(l._id.toString())).length;

        // Stage 1 is always unlocked. Stage N is unlocked if Stage N-1 has all lessons completed
        const isPlanEligible = stage.order === 1 || isPaid;
        let isStageUnlocked = stage.order === 1;

        if (stage.order > 1) {
          const prevStage = stages.find((s) => s.order === stage.order - 1);
          if (prevStage) {
            const prevLessons = await Lesson.find({ stageId: prevStage._id });
            const allPrevDone =
              prevLessons.length > 0 &&
              prevLessons.every((l) => completedLessonIds.has(l._id.toString()));
            isStageUnlocked = Boolean(allPrevDone && isPlanEligible);
          }
        }

        // Determine lesson unlock statuses
        const enrichedLessons = lessons.map((lesson, idx) => {
          const progress = progressMap.get(lesson._id.toString());
          let isLessonUnlocked = false;

          if (isStageUnlocked) {
            if (idx === 0) {
              isLessonUnlocked = true;
            } else {
              const prevLesson = lessons[idx - 1];
              isLessonUnlocked = completedLessonIds.has(prevLesson._id.toString());
            }
          }

          return {
            _id: lesson._id,
            order: lesson.order,
            title: lesson.title,
            description: lesson.description,
            freeInStarterPlan: lesson.freeInStarterPlan,
            totalActivities: lesson.activities.length,
            isUnlocked: isLessonUnlocked,
            status: progress?.status || 'not_started',
            stars: progress?.stars || 0,
            scorePercent: progress?.scorePercent || 0,
          };
        });

        return {
          ...stage.toObject(),
          isUnlocked: isStageUnlocked,
          requiresSubscription: stage.order > 1 && !isPaid,
          totalLessons,
          completedCount,
          isCompleted: totalLessons > 0 && completedCount === totalLessons,
          lessons: enrichedLessons,
        };
      })
    );

    return enrichedStages;
  }
}
