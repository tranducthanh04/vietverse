import { describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { parseDraft, validatePublish } from '../modules/content/content.validation.js';
import { toContentPayload } from '../modules/content/content.dto.js';
import { CultureArticle, Story, Lesson } from '../models/index.js';

const quiz = { question: 'When?', options: ['Tet', 'Other'], correctAnswer: 0 };
const culture = { title: 'Tết', category: 'tet', intro: 'Giới thiệu', funFacts: ['Sự thật'], quiz: [quiz] };
const story = { type: 'dong_dao', title: 'Rồng rắn lên mây', lyrics: [{ timeSec: 0, text: 'Rồng rắn lên mây' }] };

describe('Companion-language translations', () => {
  it('leaves translations absent when none are supplied (no empty object, no migration needed)', () => {
    expect(parseDraft('culture', culture).translations).toBeUndefined();
    expect(parseDraft('story', story).translations).toBeUndefined();
  });

  it('keeps reviewed culture translations through draft parsing and still publishes', () => {
    const draft = parseDraft('culture', {
      ...culture,
      translations: { en: { title: 'Tet', intro: 'Intro', funFacts: ['Fact one'] } },
    });
    expect(draft.translations).toEqual({ en: { title: 'Tet', intro: 'Intro', funFacts: ['Fact one'] } });
    expect(validatePublish('culture', draft)).toEqual([]);
  });

  it('keeps reviewed story translations parallel to the Vietnamese source', () => {
    const draft = parseDraft('story', {
      ...story,
      translations: { en: { title: 'Dragon-snake', description: 'A rhyme', lyrics: ['Dragon-snake climbs'], vocab: ['row'] } },
    });
    expect(draft.translations?.en?.lyrics).toEqual(['Dragon-snake climbs']);
    expect(validatePublish('story', draft)).toEqual([]);
  });

  it('accepts a partial translation and ignores empty ones without blocking publish', () => {
    const draft = parseDraft('culture', { ...culture, translations: { ja: { intro: 'Japanese intro' } } });
    expect(draft.translations?.ja).toEqual({ intro: 'Japanese intro' });
    expect(draft.translations?.en).toBeUndefined();
    expect(validatePublish('culture', draft)).toEqual([]);
  });

  it('rejects an unsupported translation language and the "other" locale', () => {
    expect(() => parseDraft('culture', { ...culture, translations: { de: { intro: 'x' } } })).toThrow();
    expect(() => parseDraft('story', { ...story, translations: { other: { title: 'x' } } })).toThrow();
  });

  it('caps oversized translation arrays like their Vietnamese source', () => {
    expect(() => parseDraft('culture', { ...culture, translations: { en: { funFacts: Array(51).fill('x') } } })).toThrow();
    expect(() => parseDraft('story', { ...story, translations: { en: { lyrics: Array(501).fill('x') } } })).toThrow();
  });

  it('reads translations back from a live culture document and defaults legacy rows to empty', async () => {
    const translated = await CultureArticle.create({
      ...culture, intro: 'Giới thiệu', funFacts: ['Sự thật'],
      translations: { en: { title: 'Tet', intro: 'Intro', funFacts: ['Fact one'] } },
    });
    const payload = toContentPayload('culture', (await CultureArticle.findById(translated._id))!);
    expect(payload.translations).toEqual({ en: { title: 'Tet', intro: 'Intro', funFacts: ['Fact one'] } });

    const legacyId = new Types.ObjectId();
    await CultureArticle.collection.insertOne({ _id: legacyId, title: 'Legacy', category: 'tet', intro: 'Cũ', funFacts: ['Cũ'] });
    const legacy = toContentPayload('culture', (await CultureArticle.findById(legacyId))!);
    expect(legacy.translations).toBeUndefined();
  });

  it('persists story translations on the live model', async () => {
    const saved = await Story.create({
      ...story, lyrics: [{ timeSec: 0, text: 'Rồng rắn lên mây' }],
      translations: { en: { title: 'Dragon-snake', lyrics: ['Dragon-snake climbs'], vocab: ['row'] } },
    });
    const payload = toContentPayload('story', (await Story.findById(saved._id))!);
    expect(payload.translations?.en).toMatchObject({ title: 'Dragon-snake', lyrics: ['Dragon-snake climbs'], vocab: ['row'] });
  });

  it('persists an activity when-wrong hint and its support-language translations on the live lesson', async () => {
    const saved = await Lesson.create({
      stageId: new Types.ObjectId(), order: 1, title: 'Bài 1',
      activities: [{
        id: 'a1', type: 'listen_choose', prompt: 'Con vật nào bơi dưới ao?',
        options: [{ id: 'cá', text: 'Cá' }, { id: 'gà', text: 'Gà' }], correctAnswer: 'cá',
        wrongHint: 'cá', wrongHintTranslations: { en: { wrongHint: 'fish' }, ko: { wrongHint: '물고기' } },
      }],
    });
    const payload = toContentPayload('lesson', (await Lesson.findById(saved._id))!);
    expect(payload.activities[0].wrongHint).toBe('cá');
    expect(payload.activities[0].wrongHintTranslations).toEqual({ en: { wrongHint: 'fish' }, ko: { wrongHint: '물고기' } });
  });
});
