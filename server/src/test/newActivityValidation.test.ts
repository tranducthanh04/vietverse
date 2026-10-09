import { describe, expect, it } from 'vitest';
import { Lesson } from '../models/Lesson.js';
import { parseDraft, validatePublish } from '../modules/content/content.validation.js';
import { toContentPayload } from '../modules/content/content.dto.js';

const stageId = '507f1f77bcf86cd799439011';
const lesson = (a: unknown) => ({ stageId, order: 1, title: 'Lesson', vocabulary: [], activities: [a] });
const multi = { id: 'a', type: 'multi_select', prompt: 'Chọn M',
  options: ['A', 'M', 'B', 'M', 'C', 'M'].map((text, i) => ({ id: `letter-${i + 1}`, text })),
  correctAnswer: ['letter-2', 'letter-4', 'letter-6'] };
const group = { id: 'a', type: 'group_sort', prompt: 'Phân nhóm',
  options: [{ id: 'me', text: 'mẹ' }, { id: 'meo', text: 'mèo' }],
  groups: [{ id: 'm', label: 'M' }, { id: 'b', label: 'B' }], correctAnswer: { me: 'm', meo: 'm' } };
const fill = { id: 'a', type: 'fill_blanks', prompt: 'Điền', template: 'Bé {{verb}} {{object}}.',
  blankSlots: [{ id: 'verb', label: 'Hành động', acceptedAnswers: ['đọc'] },
    { id: 'object', label: 'Đồ vật', acceptedAnswers: ['sách'] }] };
const steps = { id: 'a', type: 'follow_steps', prompt: 'Thực hiện',
  steps: [{ id: 'stand', text: 'Đứng lên' }, { id: 'sit', text: 'Ngồi xuống' }] };
const issues = (a: unknown) => validatePublish('lesson', parseDraft('lesson', lesson(a)));

describe('additive activity authoring contracts', () => {
  it.each([multi, group, fill, steps])('publishes and retains canonical $type fields', a => {
    const draft = parseDraft('lesson', lesson(a));
    expect(validatePublish('lesson', draft)).toEqual([]);
    expect(toContentPayload('lesson', draft).activities[0]).toMatchObject(a);
    const live = new Lesson(draft);
    expect(live.validateSync()).toBeUndefined();
    expect(toContentPayload('lesson', live.toObject()).activities[0]).toMatchObject(a);
  });
  it.each(['multi_select', 'group_sort', 'fill_blanks', 'follow_steps'])('keeps incomplete %s editable, not publishable', type => {
    const draft = parseDraft('lesson', lesson({ id: 'a', type, prompt: '' }));
    expect(validatePublish('lesson', draft).length).toBeGreaterThan(0);
  });
  it('allows 12 repeated multi options while keeping legacy limit8', () => {
    const options = Array.from({ length: 12 }, (_, i) => ({ id: `i-${i}`, text: 'M' }));
    expect(issues({ ...multi, options, correctAnswer: ['i-0'] })).toEqual([]);
    expect(() => parseDraft('lesson', lesson({ ...multi, options: [...options, { id: 'i-12', text: 'M' }] }))).toThrow();
    expect(() => parseDraft('lesson', lesson({ ...multi, type: 'review', options: options.slice(0, 9), correctAnswer: 'i-0' }))).toThrow();
  });
  it.each(['__proto__', 'constructor', 'prototype', 'bad space', 'đ', 'a'.repeat(65)])('rejects unsafe new item ID %s', id => {
    expect(() => parseDraft('lesson', lesson({ ...multi, options: [{ id, text: 'M' }] }))).toThrow();
  });
  it('does not apply new ID restrictions to legacy options', () => {
    expect(parseDraft('lesson', lesson({ id: 'a', type: 'review', prompt: 'P', options: [{ id: 'có dấu', text: 'M' }] })).activities[0].options?.[0].id).toBe('có dấu');
  });
  it.each([[], ['letter-2', 'letter-2'], ['unknown'], true, { x: 'y' }])('blocks invalid multi answer %j at publish', correctAnswer => {
    expect(issues({ ...multi, correctAnswer }).length).toBeGreaterThan(0);
  });
  it.each([{}, { me: 'm' }, { me: 'm', meo: 'x' }, { me: 'm', meo: 'm', extra: 'm' }, []])('blocks invalid group mapping %j', correctAnswer => {
    expect(issues({ ...group, correctAnswer }).length).toBeGreaterThan(0);
  });
  it('rejects duplicate IDs even in incomplete new drafts', () => {
    for (const a of [{ ...multi, options: [{ id: 'x' }, { id: 'x' }] },
      { ...group, groups: [{ id: 'x', label: '' }, { id: 'x', label: '' }] },
      { ...fill, blankSlots: [{ id: 'x', label: '', acceptedAnswers: [] }, { id: 'x', label: '', acceptedAnswers: [] }] },
      { ...steps, steps: [{ id: 'x', text: '' }, { id: 'x', text: '' }] }]) {
      expect(() => parseDraft('lesson', lesson(a))).toThrow();
    }
  });
  it('rejects unsafe answer map keys before Zod can strip them', () => {
    const correctAnswer = JSON.parse('{"__proto__":"m","me":"m","meo":"m"}');
    expect(() => parseDraft('lesson', lesson({ ...group, correctAnswer }))).toThrow();
  });
  it('blocks normalized duplicate group labels', () => {
    expect(issues({ ...group, groups: [{ id: 'm', label: 'M' }, { id: 'b', label: ' m ' }] }).length).toBeGreaterThan(0);
  });
  it.each(['{{verb}} {{verb}}', '{{verb}} {{unknown}}', '{{verb} {{object}}', '{{verb}}', '{{verb}} {{object}} {{}}'])
    ('blocks non-bijective/malformed template %s', template => expect(issues({ ...fill, template }).length).toBeGreaterThan(0));
  it('enforces new field bounds without requiring complete drafts', () => {
    for (const a of [{ ...group, groups: Array.from({ length: 7 }, (_, i) => ({ id: `g${i}`, label: '' })) },
      { ...fill, template: 'x'.repeat(5001) },
      { ...fill, blankSlots: [{ id: 'v', label: '', acceptedAnswers: ['x'.repeat(201)] }] },
      { ...fill, blankSlots: [{ id: 'v', label: '', acceptedAnswers: ['a','b','c','d','e'] }] },
      { ...steps, steps: [{ id: 's', text: 'x'.repeat(501) }] },
      { ...steps, steps: Array.from({ length: 4 }, (_, i) => ({ id: `s${i}`, text: '' })) }]) {
      expect(() => parseDraft('lesson', lesson(a))).toThrow();
    }
    expect(issues({ ...fill, blankSlots: fill.blankSlots.map(s => ({ ...s, acceptedAnswers: ['   '] })) }).length).toBeGreaterThan(0);
  });
});
