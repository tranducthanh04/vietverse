import { describe, expect, it } from 'vitest';
import { gradeActivity } from '../modules/lessons/lessons.grading.js';
import { isSubscriptionPaid } from '../modules/lessons/lessons.policy.js';
import type { IActivity } from '../models/Lesson.js';

describe('legacy grading cannot manufacture canonical answers', () => {
  it.each(['listen_choose', 'review', 'fill_blank', 'drag_match', 'unknown'])('ignores forged correctness for %s without an answer', type => {
    expect(gradeActivity({ id: 'a', type, prompt: 'Question' } as IActivity, { activityId: 'a', isCorrect: true })).toBe(false);
  });
  it.each([undefined, []])('does not pass sorting without a nonempty sequence: %j', orderedItems => {
    expect(gradeActivity({ id: 'a', type: 'sort_order', prompt: 'Sort', orderedItems } as IActivity,
      { activityId: 'a', userAnswer: [], isCorrect: true })).toBe(false);
  });
  it('does not pass an empty matching answer', () => {
    expect(gradeActivity({ id: 'a', type: 'drag_match', prompt: 'Match', correctAnswer: [] } as IActivity,
      { activityId: 'a', userAnswer: [], isCorrect: true })).toBe(false);
  });
  it('preserves canonical matching, sorting, option answers and introductory cards', () => {
    expect(gradeActivity({ id: 'a', type: 'listen_choose', prompt: 'Choose', correctAnswer: 'a', options: [{ id: 'a', text: 'A' }] } as IActivity,
      { activityId: 'a', userAnswer: 'A', isCorrect: false })).toBe(true);
    expect(gradeActivity({ id: 'a', type: 'sort_order', orderedItems: ['con', 'ca'] } as IActivity,
      { activityId: 'a', userAnswer: ['con', 'ca'] })).toBe(true);
    expect(gradeActivity({ id: 'a', type: 'drag_match', pairs: [{ left: 'a', right: 'b' }] } as IActivity,
      { activityId: 'a', userAnswer: { a: 'b' } })).toBe(true);
    expect(gradeActivity({ id: 'a', type: 'word_card' } as IActivity, { activityId: 'a' })).toBe(true);
    expect(gradeActivity({ id: 'a', type: 'record_voice' } as IActivity, { activityId: 'a', isCorrect: true })).toBe(false);
  });
});

describe('paid access requires explicit active status and a valid future expiry', () => {
  it.each([
    { plan: 'monthly', active: true },
    { plan: 'monthly', expiresAt: '2099-01-01' },
    { plan: 'yearly', active: true, expiresAt: null },
    { plan: 'yearly', active: true, expiresAt: 'invalid' },
    { plan: 'yearly', active: false, expiresAt: '2099-01-01' },
    { plan: 'monthly', active: true, expiresAt: '2000-01-01' },
    { plan: 'free', active: true, expiresAt: '2099-01-01' },
  ])('rejects incomplete/ineligible subscription %j', subscription => {
    expect(isSubscriptionPaid(subscription)).toBe(false);
  });
  it.each(['monthly', 'yearly'])('accepts complete unexpired %s subscription', plan => {
    expect(isSubscriptionPaid({ plan, active: true, expiresAt: new Date('2099-01-01') })).toBe(true);
  });
});
