export interface ParentStageProgress {
  id: string;
  order: number;
  title: string;
  totalLessons: number;
  completedCount: number;
  percentage: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  requiresSubscription: boolean;
  lockReason: 'no_lessons' | 'subscription' | 'previous_stage' | null;
}

export interface ParentRecentActivity {
  id: string;
  kind: 'lesson' | 'recording' | 'story' | 'culture';
  title: string;
  occurredAt: string;
  lessonStatus?: 'in_progress' | 'completed';
}

export interface ParentProgress {
  child: { id: string; name: string; viviPoints: number };
  overview: { totalLessonsCompleted: number; totalRecordings: number; storiesExplored: number; cultureExplored: number };
  competencies: { key: string; name: string; percentage: number; statusLabel: string; description: string }[];
  // Optional during a rolling deployment with the previous API version.
  journey?: { stages: ParentStageProgress[]; currentStageId: string | null; isCompleted: boolean };
  recentActivities?: ParentRecentActivity[];
}
