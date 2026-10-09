import { expect, it } from 'vitest';
import { toLearnerLessonPayload } from '../modules/content/content.dto.js';
import type { LessonContent } from '../modules/content/content.types.js';

it('redacts new expected fields without mutating canonical or legacy payloads', () => {
  const canonical = { activities: [
    { id: 'm', type: 'multi_select', correctAnswer: ['a'], options: [{ id: 'a', text: 'M' }] },
    { id: 'g', type: 'group_sort', correctAnswer: { a: 'm' } },
    { id: 'f', type: 'fill_blanks', correctAnswer: 'unused', blankSlots: [{ id: 's', label: 'Ô', acceptedAnswers: ['mẹ'] }] },
    { id: 'r', type: 'review', correctAnswer: 'a' },
  ] } as LessonContent;
  const before = JSON.stringify(canonical);
  const learner = toLearnerLessonPayload(canonical);
  expect(learner).toEqual({ activities: [
    { id: 'm', type: 'multi_select', options: [{ id: 'a', text: 'M' }] },
    { id: 'g', type: 'group_sort' },
    { id: 'f', type: 'fill_blanks', blankSlots: [{ id: 's', label: 'Ô' }] },
    { id: 'r', type: 'review', correctAnswer: 'a' },
  ] });
  expect(JSON.stringify(canonical)).toBe(before);
});
