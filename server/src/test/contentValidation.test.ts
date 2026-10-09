import { describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { parseDraft, validatePublish } from '../modules/content/content.validation.js';
import { toContentPayload, normalizeLessonDraft } from '../modules/content/content.dto.js';

const stageId = '507f1f77bcf86cd799439011';
const lesson = (activities: unknown[]) => ({ stageId, order: 1, title: 'Lesson', vocabulary: [], activities });
const option = (id: string, text = id) => ({ id, text });
const activity = (type: string, extra = {}) => ({ id: 'a', type, prompt: 'Prompt', ...extra });
const story = { type: 'dong_dao', title: 'Rồng rắn lên mây', lyrics: [{ timeSec: 0, text: 'Rồng rắn lên mây' }] };
const quiz = { question: 'When?', options: ['Tet', 'Other'], correctAnswer: 0 };
const culture = { title: 'Tet', category: 'tet', intro: 'Intro', funFacts: ['Fact'], quiz: [quiz] };

describe('CMS draft and publish boundaries', () => {
  it('keeps incomplete drafts editable but refuses publishing them', () => {
    expect(parseDraft('lesson', {})).toMatchObject({ title: '', activities: [], vocabulary: [] });
    expect(validatePublish('lesson', parseDraft('lesson', {})).map((issue) => issue.field))
      .toEqual(expect.arrayContaining(['title', 'stageId', 'order', 'activities']));
  });

  it('preserves supplied lines without inventing audio timestamps', () => {
    const draft = parseDraft('story', { ...story, lyrics: [...story.lyrics, { timeSec: 0, text: 'Có cây xúc sắc' }] });
    expect(validatePublish('story', draft)).toEqual([]);
    expect(draft).toMatchObject({ audioUrl: '', durationSec: 0 });
    expect(draft.lyrics.map((line) => line.text)).toEqual(['Rồng rắn lên mây', 'Có cây xúc sắc']);
  });

  it.each(['javascript:alert(1)', 'data:audio/mp3;base64,abc', 'file:///private', '//evil.test/a', '/\\evil.test/a', 'https://user:pass@evil.test/a', 'http://example.test/a', '/a\nb'])('rejects unsafe media %s in drafts', (audioUrl) => {
    expect(() => parseDraft('story', { ...story, audioUrl })).toThrow();
  });
  it.each(['', '/audio/story.mp3', 'https://example.test/audio.mp3'])('accepts supported media %s', (audioUrl) => {
    expect(parseDraft('story', { ...story, audioUrl }).audioUrl).toBe(audioUrl);
  });

  it.each([
    activity('word_card', { targetWord: 'mẹ' }),
    activity('record_voice', { targetWord: 'mẹ' }),
    activity('listen_choose', { options: [option('a'), option('b')], correctAnswer: 'a' }),
    activity('review', { options: [option('a'), option('b')], correctAnswer: 'b' }),
    activity('fill_blank', { options: [option('a', 'bút'), option('b', 'cặp')], correctAnswer: 'a', blanks: [{ sentence: 'Bé viết bằng _____.', missing: 'bút' }] }),
    activity('drag_match', { pairs: [{ left: 'mẹ', right: 'mother' }, { left: 'bố', right: 'father' }] }),
    activity('sort_order', { orderedItems: ['Bé', 'đọc sách'], correctAnswer: ['Bé', 'đọc sách'] }),
  ])('publishes a usable $type activity and derives activity count', (value) => {
    const draft = parseDraft('lesson', { ...lesson([value]), totalActivities: 999 });
    expect(draft.totalActivities).toBe(1);
    expect(validatePublish('lesson', draft)).toEqual([]);
  });

  it.each([
    activity('word_card'), activity('record_voice'),
    activity('listen_choose', { options: [option('a'), option('b')], correctAnswer: 'absent' }),
    activity('review', { options: [{ id: 'a', imageUrl: '/a.png' }, option('b')], correctAnswer: 'a' }),
    activity('fill_blank', { options: [option('a'), option('b')], correctAnswer: 'a', blanks: [{ sentence: '__ and __', missing: 'a' }] }),
    activity('drag_match', { pairs: [{ left: 'A', right: '1' }, { left: ' a ', right: '2' }] }),
    activity('sort_order', { orderedItems: ['Bé', 'đọc'], correctAnswer: ['đọc', 'Bé'] }),
  ])('blocks unusable $type activity at publish', (value) => {
    expect(validatePublish('lesson', parseDraft('lesson', lesson([value]))).length).toBeGreaterThan(0);
  });

  it('rejects duplicate activity and option IDs even in drafts', () => {
    expect(() => parseDraft('lesson', lesson([activity('word_card'), activity('word_card')]))).toThrow();
    expect(() => parseDraft('lesson', lesson([activity('review', { options: [option('x'), option('x')] })]))).toThrow();
  });

  it.each([
    ['title', 'x'.repeat(201)],
    ['activities', Array.from({ length: 51 }, (_, i) => activity('word_card', { id: String(i) }))],
    ['vocabulary', Array.from({ length: 101 }, () => ({ word: 'a', meaning: 'b' }))],
  ])('rejects oversized lesson %s', (field, value) => {
    expect(() => parseDraft('lesson', { ...lesson([]), [field]: value })).toThrow();
  });

  it.each([
    activity('review', { options: Array.from({ length: 9 }, (_, i) => option(String(i))) }),
    activity('drag_match', { pairs: Array.from({ length: 13 }, (_, i) => ({ left: String(i), right: String(i) })) }),
    activity('sort_order', { orderedItems: Array.from({ length: 13 }, (_, i) => String(i)) }),
    activity('word_card', { prompt: 'x'.repeat(5001) }),
  ])('rejects oversized activity collections/text', (value) => {
    expect(() => parseDraft('lesson', lesson([value]))).toThrow();
  });

  it('enforces story, quiz, fact and payload size caps', () => {
    expect(() => parseDraft('story', { ...story, lyrics: Array.from({ length: 501 }, () => story.lyrics[0]) })).toThrow();
    expect(() => parseDraft('culture', { ...culture, funFacts: Array(51).fill('fact') })).toThrow();
    expect(() => parseDraft('culture', { ...culture, quiz: Array(21).fill(quiz) })).toThrow();
    expect(() => parseDraft('culture', { ...culture, quiz: [{ ...quiz, options: Array(9).fill('x') }] })).toThrow();
    expect(() => parseDraft('story', { ...story, lyrics: Array.from({ length: 500 }, () => ({ timeSec: 0, text: 'x'.repeat(5000) })) })).toThrow();
  });

  it('checks quiz answer range and unique choices, and requires a culture quiz', () => {
    for (const questions of [[], [{ ...quiz, correctAnswer: 2 }], [{ ...quiz, options: ['Tet', ' tet '] }], [{ ...quiz, options: ['Tet'] }]]) {
      expect(validatePublish('culture', parseDraft('culture', { ...culture, quiz: questions })).length).toBeGreaterThan(0);
    }
    expect(validatePublish('culture', parseDraft('culture', culture))).toEqual([]);
  });

  it('retains an unknown legacy category for deliberate correction', () => {
    const draft = parseDraft('culture', { ...culture, category: 'legacy' });
    expect(draft.category).toBe('legacy');
    expect(validatePublish('culture', draft).some((issue) => issue.field === 'category')).toBe(true);
  });

  it('rejects unordered/out-of-duration audio lyrics and invalid age groups', () => {
    for (const lyrics of [[{ timeSec: 11, text: 'x' }], [{ timeSec: 2, text: 'a' }, { timeSec: 2, text: 'b' }]]) {
      expect(validatePublish('story', parseDraft('story', { ...story, audioUrl: '/a.mp3', durationSec: 10, lyrics })).length).toBeGreaterThan(0);
    }
    expect(validatePublish('story', parseDraft('story', { ...story, audioUrl: '/a.mp3' })).length).toBeGreaterThan(0);
    expect(() => parseDraft('story', { ...story, ageGroups: ['adult'] })).toThrow();
  });

  it('creates detached whitelisted DTOs without persistence or nested metadata', () => {
    const original = { ...lesson([activity('word_card', { targetWord: 'mẹ' })]), stageId: { _id: new Types.ObjectId(stageId) }, _id: new Types.ObjectId(), contentVersion: 9, secret: 'private', vocabulary: [{ _id: new Types.ObjectId(), word: 'mẹ', meaning: 'mother' }] };
    const dto = toContentPayload('lesson', original);
    expect(dto.stageId).toBe(stageId);
    expect(dto).not.toHaveProperty('_id');
    expect(dto).not.toHaveProperty('secret');
    expect(dto).not.toHaveProperty('contentVersion');
    expect(dto.vocabulary[0]).not.toHaveProperty('_id');
    dto.activities[0].prompt = 'Changed';
    expect(original.activities[0].prompt).toBe('Prompt');
  });

  it('normalizes uniquely matched legacy text answers only in a copied draft', () => {
    const original = parseDraft('lesson', lesson([activity('fill_blank', {
      options: [option('a', 'bút'), option('b', 'cặp')], correctAnswer: 'bút',
      blanks: [{ sentence: 'Bé viết bằng __.', missing: 'bút' }],
    })]));
    const result = normalizeLessonDraft(original);
    expect(result.payload.activities[0].correctAnswer).toBe('a');
    expect(result.notes).toHaveLength(1);
    expect(original.activities[0].correctAnswer).toBe('bút');
    original.activities[0].options![1].text = 'bút';
    expect(normalizeLessonDraft(original).payload.activities[0].correctAnswer).toBe('bút');
  });
});
