import { describe, expect, it } from 'vitest';
import type { IActivity } from '../models/Lesson.js';
import { gradeActivity } from '../modules/lessons/lessons.grading.js';

const grade = (activity: unknown, userAnswer: unknown) => gradeActivity(
  activity as IActivity, { activityId: 'a', userAnswer, isCorrect: true });
const multi = { id: 'a', type: 'multi_select', prompt: 'Chọn M',
  options: ['A', 'M', 'B', 'M', 'C', 'M'].map((text, i) => ({ id: `letter-${i + 1}`, text })),
  correctAnswer: ['letter-2', 'letter-4', 'letter-6'] };
const group = { id: 'a', type: 'group_sort', prompt: 'Phân nhóm',
  options: [{ id: 'me', text: 'mẹ' }, { id: 'meo', text: 'mèo' }, { id: 'ba', text: 'bà' }],
  groups: [{ id: 'm', label: 'M' }, { id: 'b', label: 'B' }], correctAnswer: { me: 'm', meo: 'm', ba: 'b' } };
const fill = { id: 'a', type: 'fill_blanks', prompt: 'Điền', template: 'Bé {{verb}} {{object}}.',
  blankSlots: [{ id: 'verb', label: 'Hành động', acceptedAnswers: ['đọc'] },
    { id: 'object', label: 'Đồ vật', acceptedAnswers: ['sách'] }] };
const steps = { id: 'a', type: 'follow_steps', prompt: 'Thực hiện',
  steps: [{ id: 'stand', text: 'Đứng lên' }, { id: 'sit', text: 'Ngồi xuống' }] };

describe('new canonical grading', () => {
  it('matches repeated display text by ID as an unordered exact set', () => {
    expect(grade(multi, ['letter-6', 'letter-2', 'letter-4'])).toBe(true);
  });
  it.each([[], ['letter-2'], ['letter-2', 'letter-4', 'letter-6', 'letter-1'],
    ['letter-2', 'letter-4', 'letter-4'], ['letter-2', 'letter-4', 'unknown'], true, undefined])
    ('rejects malformed multi %j despite forged correctness', answer => expect(grade(multi, answer)).toBe(false));
  it('accepts several items in the same group', () => {
    expect(grade(group, { me: 'm', meo: 'm', ba: 'b' })).toBe(true);
  });
  it.each([Object.create({ me: 'm', meo: 'm', ba: 'b' }), { me: 'm', meo: 'm', ba: 'b', extra: 'b' },
    { me: 'm', ba: 'b' }, { me: 'm', meo: 'x', ba: 'b' }, ['m', 'm', 'b'],
    JSON.parse('{"__proto__":"m","me":"m","meo":"m","ba":"b"}'), true])
    ('rejects non-exact or unsafe group map %j', answer => expect(grade(group, answer)).toBe(false));
  it('accepts NFC equivalent Vietnamese with case and surrounding space differences', () => {
    expect(grade(fill, { verb: ' ĐỌC ', object: 'sa\u0301ch' })).toBe(true);
  });
  it.each([{ verb: 'đọc', object: 'sach' }, { verb: 'đọc', object: 'sá ch' }, { verb: 'đọc', object: 'sách.' },
    { verb: 'sách', object: 'đọc' }, { verb: 'đọc' }, { verb: 'đọc', object: 'sách', extra: 'x' }, true])
    ('rejects missing, misplaced, or changed fill answer %j', answer => expect(grade(fill, answer)).toBe(false));
  it('accepts only the full ordered self-report', () => expect(grade(steps, ['stand', 'sit'])).toBe(true));
  it.each([true, [], ['sit', 'stand'], ['stand', 'stand'], ['stand'], ['stand', 'sit', 'x']])
    ('rejects malformed self-report %j', answer => expect(grade(steps, answer)).toBe(false));
  it('does not grant credit for missing canonical answers', () => {
    expect(grade({ ...multi, correctAnswer: undefined }, ['letter-2'])).toBe(false);
    expect(grade({ ...group, correctAnswer: {} }, {})).toBe(false);
    expect(grade({ ...fill, blankSlots: [] }, {})).toBe(false);
    expect(grade({ ...steps, steps: [] }, [])).toBe(false);
  });
});
