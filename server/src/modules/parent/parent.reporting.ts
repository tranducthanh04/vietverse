import { LessonProgress } from '../../models/LessonProgress.js';
import { Recording } from '../../models/Recording.js';
import { ExplorationLog } from '../../models/ExplorationLog.js';
import { Story } from '../../models/Story.js';
import { CultureArticle } from '../../models/CultureArticle.js';
import { StagesService } from '../stages/stages.service.js';

export async function getParentJourney(parentId: string, childId: string) {
  const catalog = await StagesService.getStagesForChild(parentId, childId);
  const stages = catalog.map(stage => {
    if (!('totalLessons' in stage) || typeof stage.totalLessons !== 'number'
      || !('completedCount' in stage) || typeof stage.completedCount !== 'number') {
      throw new Error('Child stage progress is required');
    }
    return {
      id: String(stage._id),
      order: stage.order,
      title: stage.title,
      totalLessons: stage.totalLessons,
      completedCount: stage.completedCount,
      percentage: stage.totalLessons ? Math.round(stage.completedCount / stage.totalLessons * 100) : 0,
      isCompleted: stage.totalLessons > 0 && stage.completedCount === stage.totalLessons,
      isUnlocked: stage.isUnlocked,
      requiresSubscription: stage.requiresSubscription,
      lockReason: stage.totalLessons === 0 ? 'no_lessons' : stage.isUnlocked ? null
        : stage.requiresSubscription ? 'subscription' : 'previous_stage',
    };
  });
  return {
    stages,
    currentStageId: stages.find(stage => !stage.isCompleted)?.id ?? null,
    isCompleted: stages.length > 0 && stages.every(stage => stage.isCompleted),
  };
}

export interface RecentActivity {
  id: string;
  kind: 'lesson' | 'recording' | 'story' | 'culture';
  title: string;
  occurredAt: Date;
  lessonStatus?: 'in_progress' | 'completed';
}

// Call only after checking ownership in ParentService. Each source is bounded
// before merging; exploration records represent first discovery, not every visit.
export async function getParentRecentActivities(childId: string): Promise<RecentActivity[]> {
  const limit = 10;
  const [lessons, recordings, explorations] = await Promise.all([
    LessonProgress.find({ childId, status: { $in: ['in_progress', 'completed'] } })
      .select('lessonId status updatedAt').sort({ updatedAt: -1, _id: -1 }).limit(limit)
      .populate<{ lessonId: { title: string } | null }>('lessonId', 'title').lean(),
    Recording.find({ childId }).select('wordOrPrompt createdAt').sort({ createdAt: -1, _id: -1 }).limit(limit).lean(),
    ExplorationLog.find({ childId }).select('kind refId createdAt').sort({ createdAt: -1, _id: -1 }).limit(limit).lean(),
  ]);
  const [stories, articles] = await Promise.all([
    Story.find({ _id: { $in: explorations.filter(log => log.kind === 'story').map(log => log.refId) } }).select('title').lean(),
    CultureArticle.find({ _id: { $in: explorations.filter(log => log.kind === 'culture').map(log => log.refId) } }).select('title').lean(),
  ]);
  const storyTitles = new Map(stories.map(story => [String(story._id), story.title]));
  const articleTitles = new Map(articles.map(article => [String(article._id), article.title]));
  const activities: RecentActivity[] = [
    ...lessons.map(progress => ({
      id: `lesson:${progress._id}`, kind: 'lesson' as const,
      title: progress.lessonId?.title ?? 'Bài học không còn khả dụng',
      occurredAt: progress.updatedAt,
      lessonStatus: progress.status as 'in_progress' | 'completed',
    })),
    ...recordings.map(recording => ({
      id: `recording:${recording._id}`, kind: 'recording' as const,
      title: recording.wordOrPrompt || 'Bản thu âm', occurredAt: recording.createdAt,
    })),
    ...explorations.map(log => ({
      id: `${log.kind}:${log._id}`, kind: log.kind,
      title: log.kind === 'story'
        ? storyTitles.get(String(log.refId)) ?? 'Truyện không còn khả dụng'
        : articleTitles.get(String(log.refId)) ?? 'Nội dung văn hóa không còn khả dụng',
      occurredAt: log.createdAt,
    })),
  ];
  return activities.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime() || b.id.localeCompare(a.id)).slice(0, limit);
}
