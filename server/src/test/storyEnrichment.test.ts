import { describe, expect, it } from 'vitest';
import { stories } from '../seeds/catalog.js';
import { storyEnrichment, SUPPORT_LANGUAGE_ORDER, type StoryEnrichmentEntry } from '../seeds/customer/storyEnrichment.js';
import { parseDraft, validatePublish } from '../modules/content/content.validation.js';
import { SUPPORT_LANGUAGES } from '../models/contentTranslations.js';

// Fold away case and diacritics the way the data ban is specified ("không phân biệt hoa thường hay
// dấu"), then match the forbidden authoring words as whole words so legitimate content such as the
// French "animaux" or the Vietnamese "màu" / "gia đình" is not caught by a bare substring.
const fold = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const FORBIDDEN = /\b(mau|demo|nhap|tu soan|bien soan|gia dinh|minh hoa|illustrative|unreviewed|sample|placeholder)\b/;

// Every authored string in the entry, excluding `sourceLyrics` (verbatim production source, which
// may legitimately contain folk words such as "ăn mau chóng lớn").
function authoredStrings(entry: StoryEnrichmentEntry): string[] {
  const values = [entry.description, ...entry.vocab];
  for (const q of entry.quiz) values.push(q.question, q.explanation, ...q.options);
  for (const lang of SUPPORT_LANGUAGE_ORDER) {
    const t = entry.translations[lang];
    values.push(t.title, t.description, ...t.lyrics, ...t.vocab);
  }
  return values;
}

describe('story enrichment data', () => {
  const seedKeys = stories.map((story) => story.seedKey);

  it('covers every one of the 21 catalog stories and nothing else', () => {
    expect(seedKeys).toHaveLength(21);
    expect(Object.keys(storyEnrichment).sort()).toEqual([...seedKeys].sort());
  });

  it.each(stories.map((story) => [story.seedKey, story] as const))('%s has well-formed vocab and quiz', (seedKey, story) => {
    const entry = storyEnrichment[seedKey];
    expect(entry).toBeDefined();

    // 4–8 vocab words, each appearing in the lyrics (case-insensitive, so a word is still accepted
    // when it only occurs capitalised at the start of a line).
    expect(entry.vocab.length).toBeGreaterThanOrEqual(4);
    expect(entry.vocab.length).toBeLessThanOrEqual(8);
    const lyricsText = entry.sourceLyrics.join('\n').toLowerCase();
    for (const word of entry.vocab) {
      expect(word.trim()).not.toBe('');
      expect(lyricsText).toContain(word.toLowerCase());
    }

    // Exactly three comprehension questions, three distinct options, a valid answer and an explanation.
    expect(entry.quiz).toHaveLength(3);
    for (const q of entry.quiz) {
      expect(q.question.trim()).not.toBe('');
      expect(q.options).toHaveLength(3);
      expect(new Set(q.options).size).toBe(3);
      for (const option of q.options) expect(option.trim()).not.toBe('');
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(q.correctAnswer).toBeLessThan(q.options.length);
      expect(q.explanation.trim()).not.toBe('');
    }
  });

  it.each(stories.map((story) => [story.seedKey] as const))('%s has a complete, line-aligned translation in all five languages', (seedKey) => {
    const entry = storyEnrichment[seedKey];
    expect(Object.keys(entry.translations).sort()).toEqual([...SUPPORT_LANGUAGES].sort());
    for (const lang of SUPPORT_LANGUAGES) {
      const t = entry.translations[lang];
      expect(t.title.trim(), `${seedKey}/${lang} title`).not.toBe('');
      expect(t.description.trim(), `${seedKey}/${lang} description`).not.toBe('');
      // lyrics[] parallel by line to the source; vocab[] parallel by word to the source vocab.
      expect(t.lyrics.length, `${seedKey}/${lang} lyrics count`).toBe(entry.sourceLyrics.length);
      expect(t.vocab.length, `${seedKey}/${lang} vocab count`).toBe(entry.vocab.length);
      for (const line of t.lyrics) expect(line.trim(), `${seedKey}/${lang} lyric line`).not.toBe('');
      for (const word of t.vocab) expect(word.trim(), `${seedKey}/${lang} vocab word`).not.toBe('');
    }
  });

  it.each(stories.map((story) => [story.seedKey, story] as const))('%s produces a publishable story payload', (seedKey, story) => {
    const entry = storyEnrichment[seedKey];
    const payload = {
      type: story.type,
      title: story.title,
      author: '',
      description: entry.description,
      coverImage: '',
      lyrics: entry.sourceLyrics.map((text, index) => ({ timeSec: index, text })),
      audioUrl: '',
      durationSec: 0,
      ageGroups: ['5-6', '6-8'],
      vocab: entry.vocab,
      quiz: entry.quiz,
      translations: entry.translations,
    };
    const parsed = parseDraft('story', payload);
    expect(validatePublish('story', parsed)).toEqual([]);
  });

  it.each(stories.map((story) => [story.seedKey] as const))('%s contains no draft/sample authoring words', (seedKey) => {
    const entry = storyEnrichment[seedKey];
    for (const value of authoredStrings(entry)) {
      const folded = fold(value);
      expect(FORBIDDEN.test(folded), `forbidden word in: ${value}`).toBe(false);
    }
  });
});
