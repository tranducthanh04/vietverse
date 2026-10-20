import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { exploreCurriculum, buildExploreLessonPayload } from '../seeds/customer/exploreCurriculum.js';
import { listExploreImageTexts, imageUrlFor, normalizeImageKey } from '../seeds/customer/exploreCurriculumImages.js';
import { loadCustomerTranslationsSource } from '../seeds/customer/customerTranslationsSource.js';
import { parseDraft, validatePublish } from '../modules/content/content.validation.js';
import { SUPPORT_LANGUAGES } from '../models/contentTranslations.js';

const STAGE_ID = '507f1f77bcf86cd799439011';
const payloadOf = (order: number) => buildExploreLessonPayload(exploreCurriculum.find((l) => l.order === order)!, STAGE_ID);
const everyString = (value: unknown, out: string[] = []): string[] => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => everyString(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => everyString(item, out));
  return out;
};
// Case-insensitive scan for the banned terms. Diacritic-sensitive on purpose: stripping diacritics
// makes the legitimate word "gia đình" (family) — which the customer source itself uses — collide
// with the banned "giả định", so a diacritic-blind scan would reject the customer's own text.
// "minh họa"/"minh hoạ" (illustration) are both tone-placement spellings of the same word.
const BANNED = ['mẫu', 'demo', 'nháp', 'tự soạn', 'biên soạn', 'giả định', 'minh họa', 'minh hoạ'];

// The verbatim Khám phá source document. Read here (not via the translations parser, which only
// reads the detailed H3 headings) so the overview-diagram titles and each lesson's "Ngữ liệu" line
// can be checked against the payload.
const SOURCE = readFileSync(new URL('../../../docs/customer-source/2026-10-18/explore.md', import.meta.url), 'utf8');
const SOURCE_LINES = SOURCE.split(/\r?\n/);
const normVi = (value: string) => value.normalize('NFC').toLowerCase();
const stripMd = (raw: string) => raw.replace(/\\([\\`*{}[\]()#+.!_=>~-])/g, '$1').replace(/[*#]/g, '').trim();

/** The 20 lesson titles exactly as the overview diagram at the top of the source spells them. */
function overviewTitles(): Map<number, string> {
  const head = SOURCE.split('Màn hình chính')[0];
  const titles = new Map<number, string>();
  for (const line of head.split(/\r?\n/)) {
    const match = line.match(/Bài (\d+):\s*(.+?)\s*\*\*\s*$/);
    if (match) titles.set(Number(match[1]), `Bài ${match[1]}: ${match[2].trim()}`);
  }
  return titles;
}

/** The "Ngữ liệu" (language material) text listed under each lesson's detailed section. */
function nguLieuByLesson(): Map<number, string> {
  const material = new Map<number, string>();
  let current: number | undefined;
  for (const raw of SOURCE_LINES) {
    const line = stripMd(raw);
    const heading = line.match(/^Bài (\d+)\.\s/);
    if (heading) { current = Number(heading[1]); continue; }
    if (/^CHẶNG\s+\d/.test(line)) { current = undefined; continue; }
    if (current && /^Ngữ liệu/.test(line)) material.set(current, `${material.get(current) ?? ''} ${line}`);
  }
  return material;
}

type Activity = ReturnType<typeof payloadOf>['activities'][number];
/** The learner-facing content strings of an activity (options, target, items…), excluding prompt/hint. */
function activityContent(activity: Activity): string {
  const parts: string[] = [];
  for (const option of activity.options ?? []) if (option.text) parts.push(option.text);
  if (activity.targetWord) parts.push(activity.targetWord);
  for (const item of activity.orderedItems ?? []) parts.push(item);
  for (const pair of activity.pairs ?? []) parts.push(pair.left, pair.right);
  for (const blank of activity.blanks ?? []) parts.push(blank.sentence, blank.missing);
  for (const step of activity.steps ?? []) parts.push(step.text);
  for (const group of activity.groups ?? []) parts.push(group.label);
  return parts.join(' | ');
}

describe('Explore curriculum data', () => {
  it('has 20 lessons in stage/order 1..20 with the documented activity counts', () => {
    expect(exploreCurriculum.map((l) => l.order)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    for (const lesson of exploreCurriculum) expect(lesson.stageOrder).toBe(Math.ceil(lesson.order / 4));
    const counts = Object.fromEntries(exploreCurriculum.map((l) => [l.order, l.activities.length]));
    expect(counts[20]).toBe(5); // B20: five challenges
    // Every lesson covers its source "mục"; B3 (A5 splits into two questions) and B17 (A2 splits
    // into three) expand so no source question/translation is dropped.
    expect(counts).toMatchObject({ 1: 5, 2: 5, 3: 6, 4: 5, 5: 5, 6: 4, 7: 4, 8: 5, 9: 3, 10: 3, 11: 3, 12: 4, 13: 5, 14: 3, 15: 7, 16: 5, 17: 5, 18: 3, 19: 5, 20: 5 });
    expect(Object.values(counts).reduce((sum, n) => sum + n, 0)).toBe(90); // 90 activities kept after splitting multi-question items
  });

  it('titles all 20 lessons exactly as the overview diagram at the top of the source', () => {
    const overview = overviewTitles();
    expect(overview.size).toBe(20);
    for (const lesson of exploreCurriculum) {
      expect(lesson.title, `B${lesson.order}`).toBe(overview.get(lesson.order));
    }
  });

  it('builds a payload that passes parseDraft and the real publish rules for all 20 lessons', () => {
    for (const lesson of exploreCurriculum) {
      const payload = buildExploreLessonPayload(lesson, STAGE_ID);
      expect(() => parseDraft('lesson', payload)).not.toThrow();
      expect(validatePublish('lesson', payload)).toEqual([]);
    }
  });

  it('is production-ready: every activity has a VI prompt + 5 prompt translations and a VI hint + 5 hint translations', () => {
    for (const lesson of exploreCurriculum) {
      for (const activity of payloadOf(lesson.order).activities) {
        expect(activity.prompt.trim().length).toBeGreaterThan(0);
        expect(Object.keys(activity.promptTranslations ?? {}).sort()).toEqual([...SUPPORT_LANGUAGES].sort());
        for (const lang of SUPPORT_LANGUAGES) expect((activity.promptTranslations as Record<string, string>)[lang].trim().length).toBeGreaterThan(0);
        expect(activity.wrongHint?.trim().length).toBeGreaterThan(0);
        expect(Object.keys(activity.wrongHintTranslations ?? {}).sort()).toEqual([...SUPPORT_LANGUAGES].sort());
        for (const lang of SUPPORT_LANGUAGES) expect((activity.wrongHintTranslations as Record<string, { wrongHint: string }>)[lang].wrongHint.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('gives every lesson vocabulary with a meaning, every option a text, and uses the documented Từ vựng for chặng 1', () => {
    for (const lesson of exploreCurriculum) {
      const payload = payloadOf(lesson.order);
      expect(payload.vocabulary.length, `B${lesson.order} vocabulary`).toBeGreaterThanOrEqual(1);
      for (const word of payload.vocabulary) { expect(word.word.trim()).not.toBe(''); expect(word.meaning.trim()).not.toBe(''); }
      for (const activity of payload.activities) for (const option of activity.options ?? []) expect(option.text?.trim()).not.toBe('');
    }
    expect(payloadOf(1).vocabulary.map((w) => w.word)).toEqual(['mẹ', 'bố', 'ông', 'bà', 'anh', 'chị', 'em', 'bạn']);
    expect(payloadOf(2).vocabulary.map((w) => w.word)).toEqual(['sách', 'vở', 'bút', 'cặp', 'bàn', 'ghế']);
    expect(payloadOf(3).vocabulary.map((w) => w.word)).toEqual(['chó', 'mèo', 'gà', 'cá', 'trâu', 'chim']);
    expect(payloadOf(4).vocabulary.map((w) => w.word)).toEqual(['ăn', 'uống', 'ngủ', 'chơi', 'đọc', 'chạy', 'đi', 'ngồi']);
  });

  it('sources each B5–B20 vocabulary word (4–8 per lesson) from that lesson Ngữ liệu or its activities', () => {
    const material = nguLieuByLesson();
    for (const lesson of exploreCurriculum) {
      if (lesson.order < 5) continue;
      const payload = payloadOf(lesson.order);
      expect(payload.vocabulary.length, `B${lesson.order} vocabulary count`).toBeGreaterThanOrEqual(4);
      expect(payload.vocabulary.length, `B${lesson.order} vocabulary count`).toBeLessThanOrEqual(8);
      const haystack = normVi(
        `${payload.activities.map(activityContent).join(' || ')} || ${material.get(lesson.order) ?? ''}`,
      );
      for (const word of payload.vocabulary) {
        expect(haystack.includes(normVi(word.word)), `B${lesson.order} từ "${word.word}"`).toBe(true);
      }
    }
  });

  it('contains none of the banned words in any payload string', () => {
    for (const lesson of exploreCurriculum) {
      for (const text of everyString(payloadOf(lesson.order))) {
        const lower = text.normalize('NFC').toLowerCase();
        for (const banned of BANNED) expect(lower.includes(banned), `B${lesson.order}: "${text}"`).toBe(false);
      }
    }
  });

  it('keeps every Vietnamese question from the document verbatim and homes every reviewed translation pair', () => {
    const catalog = loadCustomerTranslationsSource();
    const prompts = new Map<number, string[]>();
    const promptTr = new Map<number, Record<string, string>[]>();
    const hintTr = new Map<number, Record<string, { wrongHint: string }>[]>();
    for (const lesson of exploreCurriculum) {
      const payload = payloadOf(lesson.order);
      prompts.set(lesson.order, payload.activities.map((a) => a.prompt));
      promptTr.set(lesson.order, payload.activities.map((a) => a.promptTranslations as Record<string, string>));
      hintTr.set(lesson.order, payload.activities.map((a) => a.wrongHintTranslations as Record<string, { wrongHint: string }>));
    }
    // Every mapped Vietnamese prompt appears verbatim as some activity prompt in its lesson.
    for (const block of catalog.blocks) {
      if (block.section !== 'prompt' || block.status !== 'mapped' || !block.vi) continue;
      expect(prompts.get(block.lesson), block.key).toContain(block.vi.text);
    }
    // Every reviewed VI→locale pair is carried by the lesson: prompts exactly, hint segments by containment.
    expect(catalog.entries).toHaveLength(415);
    for (const entry of catalog.entries) {
      if (entry.section === 'prompt') {
        expect(promptTr.get(entry.lesson)?.some((t) => t[entry.locale] === entry.translation.text), entry.key).toBe(true);
      } else {
        expect(hintTr.get(entry.lesson)?.some((t) => t[entry.locale]?.wrongHint.includes(entry.translation.text)), entry.key).toBe(true);
      }
    }
  });

  it('maps the special activities to existing renderers and never fabricates audio', () => {
    const b4 = payloadOf(4);
    const follow = b4.activities.find((a) => a.type === 'follow_steps');
    expect(follow?.steps?.map((s) => s.text)).toEqual(['Bé đứng lên.', 'Bé đi đến bàn.', 'Bé ngồi xuống.']);
    expect(payloadOf(5).activities.some((a) => a.type === 'multi_select')).toBe(true);
    expect(payloadOf(6).activities.some((a) => a.type === 'group_sort')).toBe(true);
    for (const order of [14, 16, 20]) expect(payloadOf(order).activities.some((a) => a.type === 'record_voice')).toBe(true);
    for (const lesson of exploreCurriculum) {
      for (const activity of payloadOf(lesson.order).activities) {
        expect(activity.audioUrl ?? '').toBe('');
        for (const option of activity.options ?? []) expect(option.audioUrl ?? '').toBe('');
      }
    }
  });

  it('leaves option/vocabulary images empty until Phase 04 fills the map and lists every image text', () => {
    for (const lesson of exploreCurriculum) {
      const payload = payloadOf(lesson.order);
      for (const word of payload.vocabulary) expect(word.imageUrl ?? '').toBe('');
      for (const activity of payload.activities) for (const option of activity.options ?? []) expect(option.imageUrl ?? '').toBe('');
    }
    expect(imageUrlFor('mẹ')).toBe('');
    const texts = listExploreImageTexts();
    expect(texts.length).toBe(120); // 105 before + 15 new unique vocabulary keys from B5–B20
    expect(texts).toContain(normalizeImageKey('mẹ'));
    expect(texts).toContain(normalizeImageKey('M'));
    // Newly added vocabulary words are picked up automatically by listExploreImageTexts().
    for (const word of ['bánh chưng', 'bánh giầy', 'mèo', 'mưa', 'cửa hàng', 'đi học']) {
      expect(texts, word).toContain(normalizeImageKey(word));
    }
    // Only option and vocabulary texts carry images (no word_card targetWord passages).
    expect(texts.some((t) => t.includes('Sáng nay'))).toBe(false);
  });
});
