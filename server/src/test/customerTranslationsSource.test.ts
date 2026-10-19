import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildTranslationCatalog, loadCustomerTranslationsSource, translationCoverage, type TranslationManifest } from '../seeds/customer/customerTranslationsSource.js';
import { verifyCustomerSources } from '../seeds/customer/customerSource.js';

const root = new URL('../../../docs/customer-source/2026-10-18/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8')) as TranslationManifest;
const bytes = readFileSync(new URL('explore.md', root));
const build = () => buildTranslationCatalog(bytes, manifest);
const fixture = (body: string) => {
  const data = Buffer.from(body);
  return buildTranslationCatalog(data, { ...manifest, sha256: createHash('sha256').update(data).digest('hex'), byteLength: data.length });
};

describe('18 October opt-in translation source', () => {
  it('refuses corrupted source bytes before exposing any mappings', () => {
    expect(() => buildTranslationCatalog(Buffer.concat([bytes, Buffer.from('changed')]), manifest)).toThrow(/checksum|length/i);
    expect(() => buildTranslationCatalog(bytes, { ...manifest, sha256: '0'.repeat(64) })).toThrow(/checksum/i);
    expect(verifyCustomerSources()).toBe(true);
  });
  it('captures B1 question and full hint exactly in all five labelled locales', () => {
    const entries = build().entries;
    expect(entries.find(e => e.key === 'b01.activity-1.prompt.en')).toMatchObject({
      vi: { text: 'Con nghe thấy ai?' }, translation: { text: 'Who do you hear?' },
      provenance: { tabId: 't.6aij8uhnuc6p', capturedAt: '2026-10-18', sha256: manifest.sha256 },
    });
    expect(entries.filter(e => e.blockKey === 'b01.activity-1.hint').map(e => [e.locale, e.translation.text])).toEqual([
      ['en', 'Mom is a family member.'], ['ko', '엄마는 가족이에요.'], ['ja', 'お母さんは家族の一人です。'],
      ['fr', 'Maman est un membre de la famille.'], ['zh', '妈妈是家庭成员。'],
    ]);
  });
  it('captures B2 pen prompt and hint without replacing Vietnamese with a guessed question', () => {
    const catalog = build();
    expect(catalog.entries.find(e => e.key === 'b02.activity-1.prompt.en')).toMatchObject({
      vi: { text: 'Con hãy tìm từ bút nhé!' }, translation: { text: 'Find the word “bút”!' },
    });
    expect(catalog.entries.find(e => e.key === 'b02.activity-1.hint.fr')).toMatchObject({
      vi: { text: 'bút là đồ dùng để viết.' }, translation: { text: 'Un stylo sert à écrire.' },
    });
    expect(catalog.blocks.filter(b => b.status === 'missing-vi').map(b => b.key)).toEqual([
      'b02.activity-3.prompt', 'b02.activity-5.prompt', 'b03.activity-3.prompt',
      'b11.activity-3.prompt', 'b13.activity-4.prompt',
    ]);
  });
  it('uses explicit step-table column labels even when reordered, not locale positions', () => {
    const catalog = fixture('### **Bài 4\\. Bé làm gì?**\nHoạt động 5\\. Nghe và thực hiện\nNếu trẻ gặp khó khăn, lần lượt gợi ý:\n| Tiếng Việt | 日本語 | English |\n| --- | --- | --- |\n| Đứng lên | 立って | Stand up |');
    expect(catalog.entries.map(e => [e.locale, e.vi.text, e.translation.text])).toEqual([
      ['ja', 'Đứng lên', '立って'], ['en', 'Đứng lên', 'Stand up'],
    ]);
  });
  it('keeps unlabeled slash glosses unresolved rather than assigning locales by position', () => {
    const catalog = fixture('### Bài 2. Đồ vật\nHoạt động 2. Nghe\nGợi ý khi sai: sách = book / 책 / 本 / livre / 书.');
    expect(catalog.entries).toEqual([]);
    expect(catalog.blocks[0]).toMatchObject({ status: 'ambiguous-locales', section: 'hint' });
  });
  it('preserves separate question, step and challenge identities instead of runtime array IDs', () => {
    const catalog = build();
    for (const key of ['b03.activity-5.prompt-1.en', 'b03.activity-5.prompt-2.en', 'b17.activity-2.prompt-3.en', 'b12.step-2.prompt.en', 'b20.challenge-5.prompt.en']) {
      expect(catalog.entries.find(e => e.key === key), key).toBeDefined();
    }
    expect(new Set(catalog.entries.map(e => e.key)).size).toBe(catalog.entries.length);
    expect(catalog.lessons.map(l => l.number)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
  it('resolves only the explicit B15 reference using identical Vietnamese and records both locations', () => {
    const catalog = build();
    const entry = catalog.entries.find(e => e.key === 'b15.activity-7.prompt.en');
    expect(entry).toMatchObject({ vi: { text: 'Con hãy kể lại câu chuyện nhé!' }, translation: { text: 'Tell the story in your own words.' } });
    expect(entry?.provenance.referenceLine).toBeGreaterThan(entry?.translation.line ?? Infinity);
    const wrong = '### Bài 14. Kể\nHoạt động 3. Kể\nCâu hỏi: “Khác.”\n* English: Different.\n### Bài 15. Truyện\nHoạt động 7. Kể\nCâu hỏi: “Con kể nhé!”\nDùng bản dịch của câu hỏi ở Bài 14.';
    expect(fixture(wrong).entries.some(e => e.lesson === 15)).toBe(false);
  });
  it('rejects duplicate lesson/activity identities and duplicate locale labels', () => {
    expect(() => fixture('### Bài 1. A\n### Bài 1. B')).toThrow(/duplicate/i);
    expect(() => fixture('### Bài 1. A\nHoạt động 1. A\nHoạt động 1. B')).toThrow(/duplicate/i);
    expect(() => fixture('### Bài 1. A\nHoạt động 1. A\nCâu hỏi: “Ai?”\n* English: Who?\n* English: Someone?')).toThrow(/duplicate/i);
  });
  it('retains exact raw source lines for every paired translation and heading', () => {
    const catalog = build();
    const lines = bytes.toString('utf8').split(/\r?\n/);
    expect(catalog.entries.length).toBeGreaterThan(350);
    for (const entry of catalog.entries) {
      expect(lines[entry.vi.line - 1]).toBe(entry.vi.raw);
      expect(lines[entry.translation.line - 1]).toBe(entry.translation.raw);
      expect(entry.key).toMatch(/^b\d{2}\.(activity|step|challenge)-\d+\.(prompt|hint)(-\d+)?\.(en|ko|ja|fr|zh)$/);
    }
  });
  it('reports complete versus missing source coverage without claiming runtime mappings', () => {
    const catalog = loadCustomerTranslationsSource();
    const coverage = translationCoverage(catalog);
    expect(coverage.find(row => row.lesson === 2)).toMatchObject({
      promptGroups: 5, mappedPromptGroups: 3, mappedHintGroups: 1, pairs: 20,
      missingVietnamese: ['b02.activity-3.prompt', 'b02.activity-5.prompt'],
    });
    expect(coverage.find(row => row.lesson === 19)).toMatchObject({
      promptGroups: 1, mappedPromptGroups: 1, pairs: 5,
      activitiesWithoutPrompt: ['activity-2', 'activity-3', 'activity-4', 'activity-5'],
    });
    expect(catalog.entries).toHaveLength(415);
    expect(catalog.source.sha256).toBe('173d0c2bf181ec9209b857267063c8454223ef176457339f8f9c8be5d8156d49');
    expect(coverage.every(row => row.runtimeMapping === 'not-assigned')).toBe(true);
  });
  it('distinguishes a partial labelled translation from a complete language set', () => {
    const catalog = fixture('### Bài 1. A\nHoạt động 1. A\nCâu hỏi: “Ai?”\n* English: Who?');
    expect(translationCoverage(catalog)[0].partialLocales).toEqual([
      { key: 'b01.activity-1.prompt', missing: ['ko', 'ja', 'fr', 'zh'] },
    ]);
  });
  it('rejects conflicting VI rows and malformed tables instead of pairing unrelated text', () => {
    expect(() => fixture('### Bài 1. A\nHoạt động 1. A\nCâu hỏi: “Ai?”\n| Tiếng Việt | Khác? |\n| English | Who? |')).toThrow(/conflicting/i);
    expect(() => fixture('### Bài 1. A\nHoạt động 1. A\nGợi ý khi sai:\n| Tiếng Việt | English |\n| --- | --- |\n| Mẹ | Mom | Extra |')).toThrow(/inconsistent/i);
  });
  it('does not attach translations across activities or unrelated paragraphs', () => {
    expect(() => fixture('### Bài 1. A\nHoạt động 1. A\nCâu hỏi: “Ai?”\nHoạt động 2. B\n* English: Who?')).toThrow(/orphan/i);
    expect(() => fixture('### Bài 1. A\nHoạt động 1. A\nCâu hỏi: “Ai?”\nĐáp án: Mẹ\n* English: Who?')).toThrow(/orphan/i);
  });
  it('does not resolve a cross-reference with multiple matching source questions', () => {
    const catalog = fixture('### Bài 14. A\nHoạt động 1. A\nCâu hỏi: “Kể nhé!”\n* English: Tell it.\nHoạt động 2. B\nCâu hỏi: “Kể nhé!”\n* English: Retell it.\n### Bài 15. B\nHoạt động 7. C\nCâu hỏi: “Kể nhé!”\nDùng bản dịch của câu hỏi ở Bài 14.');
    expect(catalog.blocks.find(b => b.lesson === 15)?.status).toBe('missing-translations');
    expect(catalog.entries.some(e => e.lesson === 15)).toBe(false);
  });
});
