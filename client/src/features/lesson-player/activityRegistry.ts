import React from 'react';
import { WordCardActivity } from './activities/WordCardActivity.js';
import { ListenChooseActivity } from './activities/ListenChooseActivity.js';
import { DragMatchActivity } from './activities/DragMatchActivity.js';
import { FillBlankActivity } from './activities/FillBlankActivity.js';
import { SortOrderActivity } from './activities/SortOrderActivity.js';
import { RecordVoiceActivity } from './activities/RecordVoiceActivity.js';
import { ReviewActivity } from './activities/ReviewActivity.js';

export interface ActivityRendererProps {
  activity: any;
  childId: string;
  lessonId: string;
  onComplete: (isCorrect: boolean, userAnswer?: any) => void;
}

export type ActivityComponent = React.FC<any>;

export const activityRegistry: Record<string, ActivityComponent> = {
  word_card: WordCardActivity,
  listen_choose: ListenChooseActivity,
  drag_match: DragMatchActivity,
  fill_blank: FillBlankActivity,
  sort_order: SortOrderActivity,
  record_voice: RecordVoiceActivity,
  review: ReviewActivity,
};

export function getActivityComponent(type: string): ActivityComponent {
  const Component = activityRegistry[type];
  if (!Component) {
    // Graceful fallback for unknown activity type
    return ReviewActivity;
  }
  return Component;
}
