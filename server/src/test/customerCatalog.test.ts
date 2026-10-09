import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { customerCatalog } from '../seeds/customer/customerCatalog.js';
import { verifyCustomerSources } from '../seeds/customer/customerSource.js';

describe('customer source coverage', () => {
  it('verifies the saved source bytes and covers all supplied sections', () => {
    expect(verifyCustomerSources()).toBe(true);
    expect(customerCatalog.filter(entry => entry.kind === 'story')).toHaveLength(21);
    expect(customerCatalog.filter(entry => entry.kind === 'lesson').map(entry => entry.order)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(customerCatalog.filter(entry => entry.kind === 'culture').map(entry => entry.payload.category)).toEqual(['tet', 'am_thuc', 'trang_phuc', 'phong_tuc', 'le_hoi', 'vat_dung', 'thien_nhien', 'tro_choi_dan_gian']);
  });
  it('imports the actual Rồng rắn verses without fabricated media', () => {
    const entry = customerCatalog.find(entry => entry.key === 'story-02');
    if (entry?.kind !== 'story') throw new Error('Missing story');
    expect(entry.payload.lyrics.map(line => line.text)).toEqual(['Rồng rắn lên mây', 'Có cây xúc sắc', 'Có quả đồng hồ', 'Hỏi thăm thầy thuốc', 'Có nhà hay không?']);
    expect(entry.payload.audioUrl).toBe(''); expect(entry.source.tabId).toBe('t.4844z8cb97b');
  });
  it('keeps every selected lyric in source order, with the first supplied variants only', () => {
    const source = readFileSync(new URL('../../../docs/customer-source/2026-10-09/stories.md', import.meta.url), 'utf8')
      .replace(/\\([!\.])/g, '$1').split(/\r?\n/).map(line => line.replace(/^>\s*/, '').trim());
    const counts = [24, 5, 8, 10, 10, 6, 6, 15, 12, 16, 10, 6, 5, 7, 11, 18, 6, 6, 4, 10, 17];
    customerCatalog.filter(entry => entry.kind === 'story').forEach((entry, index) => {
      expect(entry.payload.lyrics).toHaveLength(counts[index]);
      let cursor = -1;
      for (const lyric of entry.payload.lyrics) {
        cursor = source.findIndex((line, at) => at > cursor && line === lyric.text);
        expect(cursor, `${entry.key}: ${lyric.text}`).toBeGreaterThanOrEqual(0);
        expect(lyric.timeSec).toBe(0);
      }
    });
    for (const key of ['story-06', 'story-13']) expect(customerCatalog.find(entry => entry.key === key)?.editorialNotes.some(note => note.reason === 'variant')).toBe(true);
    expect(customerCatalog.find(entry => entry.key === 'story-21')?.editorialNotes.some(note => note.reason === 'attribution')).toBe(true);
  });
  it('uses provided lesson words and questions while flagging unsupported or incomplete source work', () => {
    const first = customerCatalog.find(entry => entry.key === 'lesson-01');
    if (first?.kind !== 'lesson') throw new Error('Missing lesson');
    expect(first.payload.vocabulary.map(word => word.word)).toEqual(['mẹ', 'bố', 'ông', 'bà', 'anh', 'chị', 'em', 'bạn']);
    expect(first.payload.activities.some(activity => activity.prompt.includes('Đây là mẹ.'))).toBe(true);
    expect(first.payload.activities.some(activity => activity.correctAnswer === 'option-0')).toBe(true);
    expect(customerCatalog.find(entry => entry.key === 'lesson-05')?.editorialNotes.some(note => note.reason === 'unsupported_activity')).toBe(true);
    expect(customerCatalog.find(entry => entry.key === 'lesson-04')?.editorialNotes.some(note => note.reason === 'unsupported_activity')).toBe(true);
    const last = customerCatalog.find(entry => entry.key === 'lesson-20');
    if (last?.kind !== 'lesson') throw new Error('Missing lesson');
    expect(last.payload.activities).toEqual([]);
    const food = customerCatalog.find(entry => entry.key === 'culture-am_thuc');
    if (food?.kind !== 'culture') throw new Error('Missing culture');
    expect(food.payload.quiz[0]).toMatchObject({ question: 'Bánh chưng thường xuất hiện vào dịp nào?', options: ['Tết', 'Trung thu', 'Sinh nhật'], correctAnswer: 0 });
    expect(food.payload.funFacts).toEqual([]);
  });
});
