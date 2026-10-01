import { describe, it, expect } from 'vitest';
import { activityRegistry, getActivityComponent } from '../features/lesson-player/activityRegistry.js';
import { WordCardActivity } from '../features/lesson-player/activities/WordCardActivity.js';
import { ListenChooseActivity } from '../features/lesson-player/activities/ListenChooseActivity.js';
import { DragMatchActivity } from '../features/lesson-player/activities/DragMatchActivity.js';
import { FillBlankActivity } from '../features/lesson-player/activities/FillBlankActivity.js';
import { SortOrderActivity } from '../features/lesson-player/activities/SortOrderActivity.js';
import { RecordVoiceActivity } from '../features/lesson-player/activities/RecordVoiceActivity.js';
import { ReviewActivity } from '../features/lesson-player/activities/ReviewActivity.js';

describe('Lesson Engine Activity Registry', () => {
  it('should register all 7 required activity types', () => {
    expect(activityRegistry.word_card).toBe(WordCardActivity);
    expect(activityRegistry.listen_choose).toBe(ListenChooseActivity);
    expect(activityRegistry.drag_match).toBe(DragMatchActivity);
    expect(activityRegistry.fill_blank).toBe(FillBlankActivity);
    expect(activityRegistry.sort_order).toBe(SortOrderActivity);
    expect(activityRegistry.record_voice).toBe(RecordVoiceActivity);
    expect(activityRegistry.review).toBe(ReviewActivity);
  });

  it('should resolve correct component by type string', () => {
    expect(getActivityComponent('word_card')).toBe(WordCardActivity);
    expect(getActivityComponent('record_voice')).toBe(RecordVoiceActivity);
  });

  it('should fallback gracefully to ReviewActivity for unknown activity types', () => {
    const fallback = getActivityComponent('unknown_future_activity_type');
    expect(fallback).toBe(ReviewActivity);
  });
});
