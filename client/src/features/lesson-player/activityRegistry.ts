import React from 'react';
import { WordCardActivity } from './activities/WordCardActivity.js';
import { ListenChooseActivity } from './activities/ListenChooseActivity.js';
import { DragMatchActivity } from './activities/DragMatchActivity.js';
import { FillBlankActivity } from './activities/FillBlankActivity.js';
import { SortOrderActivity } from './activities/SortOrderActivity.js';
import { RecordVoiceActivity } from './activities/RecordVoiceActivity.js';
import { ReviewActivity } from './activities/ReviewActivity.js';
import { MultiSelectActivity } from './activities/MultiSelectActivity.js';
import { GroupSortActivity } from './activities/GroupSortActivity.js';
import { FillBlanksActivity } from './activities/FillBlanksActivity.js';
import { FollowStepsActivity } from './activities/FollowStepsActivity.js';

export interface ActivityRendererProps {
  activity: any;
  childId: string;
  lessonId: string;
  contentVersion?: number;
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
  multi_select: MultiSelectActivity,
  group_sort: GroupSortActivity,
  fill_blanks: FillBlanksActivity,
  follow_steps: FollowStepsActivity,
};

const UnsupportedActivity = () => React.createElement('p', { role: 'alert', className: 'p-4' },
  'Hoạt động chưa được hỗ trợ. Vui lòng cập nhật trang hoặc nhờ phụ huynh kiểm tra.');

export function getActivityComponent(type: string): ActivityComponent {
  const Component = activityRegistry[type];
  if (!Component) {
    return UnsupportedActivity;
  }
  return Component;
}
