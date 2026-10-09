import type { IActivity } from '../../models/Lesson.js';
import { hasExactKeys, isPlainAnswerMap, isSafeActivityItemId, normalizeActivityText } from '../content/newActivity.contract.js';

function validIds(ids: string[]): boolean {
  return ids.length > 0 && ids.every(isSafeActivityItemId) && new Set(ids).size === ids.length;
}
function stringIds(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string') && validIds(value);
}

export function gradeNewActivity(activity: IActivity, userAnswer: unknown): boolean {
  switch (activity.type) {
    case 'multi_select': {
      const expected: unknown = activity.correctAnswer;
      const ids = (activity.options ?? []).map(option => option.id);
      return validIds(ids) && stringIds(expected) && expected.every(id => ids.includes(id)) &&
        stringIds(userAnswer) && userAnswer.length === expected.length && userAnswer.every(id => expected.includes(id));
    }
    case 'group_sort': {
      const expected: unknown = activity.correctAnswer;
      const ids = (activity.options ?? []).map(option => option.id);
      const groups = (activity.groups ?? []).map(group => group.id);
      if (!validIds(ids) || !validIds(groups) || !isPlainAnswerMap(expected) || !isPlainAnswerMap(userAnswer) ||
        !hasExactKeys(expected, ids) || !hasExactKeys(userAnswer, ids)) return false;
      return ids.every(id => typeof expected[id] === 'string' && groups.includes(expected[id] as string) && userAnswer[id] === expected[id]);
    }
    case 'fill_blanks': {
      const slots = activity.blankSlots ?? [];
      const ids = slots.map(slot => slot.id);
      if (!validIds(ids) || !isPlainAnswerMap(userAnswer) || !hasExactKeys(userAnswer, ids)) return false;
      return slots.every(slot => {
        const answer = userAnswer[slot.id];
        if (typeof answer !== 'string' || !answer.trim() || answer.length > 200) return false;
        return slot.acceptedAnswers?.some(expected => typeof expected === 'string' && Boolean(expected.trim()) &&
          normalizeActivityText(answer) === normalizeActivityText(expected)) ?? false;
      });
    }
    case 'follow_steps': {
      const expected = (activity.steps ?? []).map(step => step.id);
      return validIds(expected) && stringIds(userAnswer) && expected.length === userAnswer.length &&
        expected.every((id, index) => userAnswer[index] === id);
    }
    default: return false;
  }
}
