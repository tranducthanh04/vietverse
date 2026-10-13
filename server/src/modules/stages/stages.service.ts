import { Types } from 'mongoose';
import { Stage } from '../../models/Stage.js';
import { Lesson } from '../../models/Lesson.js';
import { LessonProgress } from '../../models/LessonProgress.js';
import { Subscription } from '../../models/Subscription.js';
import { Child } from '../../models/Child.js';
import { isSubscriptionPaid } from '../lessons/lessons.policy.js';

interface LessonSummary {
  _id: Types.ObjectId;
  stageId: Types.ObjectId;
  order: number;
  title: string;
  description?: string;
  freeInStarterPlan?: boolean;
  activityCount: number;
}

interface ProgressSummary {
  lessonId: Types.ObjectId;
  status: string;
  stars?: number;
  scorePercent?: number;
}

// One round-trip for the whole catalogue: only the fields the map needs, with the
// activity count computed in the database instead of loading every activity.
function loadLessonSummaries() {
  return Lesson.aggregate<LessonSummary>([
    { $sort: { stageId: 1, order: 1 } },
    {
      $project: {
        stageId: 1,
        order: 1,
        title: 1,
        description: 1,
        freeInStarterPlan: 1,
        activityCount: { $size: { $ifNull: ['$activities', []] } },
      },
    },
  ]);
}

function groupByStage(lessons: LessonSummary[]) {
  const byStage = new Map<string, LessonSummary[]>();
  for (const lesson of lessons) {
    const key = lesson.stageId.toString();
    const list = byStage.get(key);
    if (list) list.push(lesson);
    else byStage.set(key, [lesson]);
  }
  return byStage;
}

export class StagesService {
  static async getStagesForChild(parentId: string, childId?: string) {
    if (!childId) {
      const [stages, subscription] = await Promise.all([
        Stage.find().sort({ order: 1 }),
        Subscription.findOne({ userId: parentId }),
      ]);
      const isPaid = isSubscriptionPaid(subscription);
      // Just return stage overview
      return stages.map((stage) => ({
        ...stage.toObject(),
        isUnlocked: stage.order === 1 || isPaid,
        requiresSubscription: stage.order > 1 && !isPaid,
      }));
    }

    // All reads are independent; progress is only used after the child's ownership is confirmed.
    const [stages, subscription, child, completedProgresses, lessons] = await Promise.all([
      Stage.find().sort({ order: 1 }),
      Subscription.findOne({ userId: parentId }),
      Child.findOne({ _id: childId, parentId }).select('_id').lean(),
      LessonProgress.find({ childId, status: 'completed' })
        .select('lessonId status stars scorePercent')
        .lean<ProgressSummary[]>(),
      loadLessonSummaries(),
    ]);
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé' };
    }
    const isPaid = isSubscriptionPaid(subscription);

    const completedLessonIds = new Set(completedProgresses.map((p) => p.lessonId.toString()));
    const progressMap = new Map(completedProgresses.map((p) => [p.lessonId.toString(), p]));
    const lessonsByStage = groupByStage(lessons);
    const stageByOrder = new Map(stages.map((stage) => [stage.order, stage]));

    return stages.map((stage) => {
      const stageLessons = lessonsByStage.get(stage._id.toString()) ?? [];
      const totalLessons = stageLessons.length;
      const completedCount = stageLessons.filter((l) => completedLessonIds.has(l._id.toString())).length;

      // Stage 1 is always unlocked. Stage N is unlocked if Stage N-1 has all lessons completed
      const isPlanEligible = stage.order === 1 || isPaid;
      let isStageUnlocked = stage.order === 1;

      if (stage.order > 1) {
        const prevStage = stageByOrder.get(stage.order - 1);
        if (prevStage) {
          const prevLessons = lessonsByStage.get(prevStage._id.toString()) ?? [];
          const allPrevDone =
            prevLessons.length > 0 &&
            prevLessons.every((l) => completedLessonIds.has(l._id.toString()));
          isStageUnlocked = Boolean(allPrevDone && isPlanEligible);
        }
      }

      // Determine lesson unlock statuses
      const enrichedLessons = stageLessons.map((lesson, idx) => {
        const progress = progressMap.get(lesson._id.toString());
        let isLessonUnlocked = false;

        if (isStageUnlocked) {
          if (idx === 0) {
            isLessonUnlocked = true;
          } else {
            const prevLesson = stageLessons[idx - 1];
            isLessonUnlocked = completedLessonIds.has(prevLesson._id.toString());
          }
        }

        return {
          _id: lesson._id,
          order: lesson.order,
          title: lesson.title,
          description: lesson.description,
          freeInStarterPlan: lesson.freeInStarterPlan ?? false,
          totalActivities: lesson.activityCount,
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
    });
  }
}
