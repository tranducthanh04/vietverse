import { describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { parseDraft, validatePublish } from '../modules/content/content.validation.js';
import { toContentPayload, toLearnerLessonPayload } from '../modules/content/content.dto.js';
import { Lesson } from '../models/index.js';

const stageId = '507f1f77bcf86cd799439011';
const lessonDraft = (activities: unknown[]) => ({ stageId, order: 1, title: 'Bài 1', vocabulary: [], activities });
// A fully valid activity so validatePublish issues (if any) are only about promptTranslations.
const activity = (extra: Record<string, unknown> = {}) => ({
  id: 'a1', type: 'listen_choose', prompt: 'Con vật nào bơi dưới ao?',
  options: [{ id: 'ca', text: 'Cá' }, { id: 'ga', text: 'Gà' }], correctAnswer: 'ca', ...extra,
});
const vi = 'Con vật nào bơi dưới ao?';
const translations = { en: 'Which animal swims in the pond?', ko: '어떤 동물이 연못에서 헤엄치나요?' };

describe('Activity prompt translations — parseDraft/validatePublish', () => {
  it('keeps reviewed prompt translations through draft parsing and still publishes', () => {
    const draft = parseDraft('lesson', lessonDraft([activity({ promptTranslations: translations })]));
    expect(draft.activities[0].promptTranslations).toEqual(translations);
    expect(validatePublish('lesson', draft)).toEqual([]);
  });

  it('leaves promptTranslations absent when none are supplied (no empty object, no migration needed)', () => {
    const draft = parseDraft('lesson', lessonDraft([activity()]));
    expect(draft.activities[0].promptTranslations).toBeUndefined();
    expect(validatePublish('lesson', draft)).toEqual([]);
  });

  it('accepts a partial map (only some languages) without blocking publish', () => {
    const draft = parseDraft('lesson', lessonDraft([activity({ promptTranslations: { ja: '池で泳ぐ動物は？' } })]));
    expect(draft.activities[0].promptTranslations).toEqual({ ja: '池で泳ぐ動物は？' });
    expect(draft.activities[0].promptTranslations?.en).toBeUndefined();
    expect(validatePublish('lesson', draft)).toEqual([]);
  });

  it('trims each translation value', () => {
    const draft = parseDraft('lesson', lessonDraft([activity({ promptTranslations: { en: '   cat   ' } })]));
    expect(draft.activities[0].promptTranslations?.en).toBe('cat');
  });

  it('rejects an unsupported language key and the "other" locale', () => {
    expect(() => parseDraft('lesson', lessonDraft([activity({ promptTranslations: { de: 'x' } })]))).toThrow();
    expect(() => parseDraft('lesson', lessonDraft([activity({ promptTranslations: { other: 'x' } })]))).toThrow();
  });

  it('rejects a translation longer than 300 characters', () => {
    expect(() => parseDraft('lesson', lessonDraft([activity({ promptTranslations: { en: 'x'.repeat(301) } })]))).toThrow();
    // Exactly 300 after trimming is allowed.
    const draft = parseDraft('lesson', lessonDraft([activity({ promptTranslations: { en: `  ${'x'.repeat(300)}  ` } })]));
    expect(draft.activities[0].promptTranslations?.en).toHaveLength(300);
  });
});

describe('Activity prompt translations — DTO returned to the learner', () => {
  it('persists promptTranslations and returns them in the content and learner payloads', async () => {
    const saved = await Lesson.create({
      stageId: new Types.ObjectId(), order: 1, title: 'Bài 1',
      activities: [{
        id: 'a1', type: 'listen_choose', prompt: vi,
        options: [{ id: 'ca', text: 'Cá' }, { id: 'ga', text: 'Gà' }], correctAnswer: 'ca',
        promptTranslations: translations,
      }],
    });
    const payload = toContentPayload('lesson', (await Lesson.findById(saved._id))!);
    expect(payload.activities[0].promptTranslations).toEqual(translations);
    const learner = toLearnerLessonPayload(payload);
    expect(learner.activities[0].promptTranslations).toEqual(translations);
  });

  it('keeps promptTranslations on a new activity type while still hiding its answer key', async () => {
    const saved = await Lesson.create({
      stageId: new Types.ObjectId(), order: 1, title: 'Bài 2',
      activities: [{
        id: 'm1', type: 'multi_select', prompt: 'Chọn các con vật bơi được.',
        options: [{ id: 'ca', text: 'Cá' }, { id: 'ga', text: 'Gà' }], correctAnswer: ['ca'],
        promptTranslations: { en: 'Pick the animals that can swim.' },
      }],
    });
    const payload = toContentPayload('lesson', (await Lesson.findById(saved._id))!);
    const learner = toLearnerLessonPayload(payload);
    expect(learner.activities[0].promptTranslations).toEqual({ en: 'Pick the animals that can swim.' });
    expect((learner.activities[0] as { correctAnswer?: unknown }).correctAnswer).toBeUndefined();
  });

  it('leaves promptTranslations absent on a legacy activity document (no empty object)', async () => {
    const legacyId = new Types.ObjectId();
    await Lesson.collection.insertOne({
      _id: legacyId, stageId: new Types.ObjectId(), order: 3, title: 'Legacy', vocabulary: [],
      activities: [{ id: 'a1', type: 'word_card', prompt: 'Đọc từ', targetWord: 'mẹ' }],
    } as never);
    const payload = toContentPayload('lesson', (await Lesson.findById(legacyId))!);
    expect(payload.activities[0].promptTranslations).toBeUndefined();
  });
});
