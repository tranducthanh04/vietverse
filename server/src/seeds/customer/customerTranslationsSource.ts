import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export interface TranslationManifest {
  schemaVersion: number; documentUrl: string; capturedAt: string; tabId: string;
  file: string; sha256: string; byteLength: number;
}
export interface SourceText { text: string; line: number; raw: string }
export interface TranslationBlock {
  key: string; lesson: number; lessonHeading: SourceText; activityKey: string;
  activityHeading: SourceText; section: 'prompt' | 'hint'; vi: SourceText | null;
  translations: Record<string, SourceText>; line: number;
  status: 'mapped' | 'missing-vi' | 'missing-translations' | 'ambiguous-locales';
  referenceLine?: number;
}
export interface TranslationEntry {
  key: string; blockKey: string; lesson: number; activityKey: string;
  section: 'prompt' | 'hint'; locale: string; vi: SourceText; translation: SourceText;
  provenance: TranslationManifest & { lessonLine: number; activityLine: number; referenceLine?: number };
}
export interface TranslationCatalog {
  source: TranslationManifest; blocks: TranslationBlock[]; entries: TranslationEntry[];
  lessons: { number: number; heading: SourceText; activityKeys: string[] }[];
}
const languageLabels = new Map([
  ['Tiếng Việt', 'vi'], ['English', 'en'], ['한국어', 'ko'],
  ['日本語', 'ja'], ['Français', 'fr'], ['简体中文', 'zh'],
]);
const activityKinds = new Map([['Hoạt động', 'activity'], ['Bước', 'step'], ['Thử thách', 'challenge']]);

// Decode Markdown syntax only. Do not translate, normalize case or change punctuation.
function plain(text: string) {
  return text.replace(/\\([\\`*{}\[\]()#+.!_=>~-])/g, '$1').replace(/\*\*/g, '')
    .replace(/^#+\s*/, '').replace(/^\*\s+/, '').trim();
}
function unquote(text: string) {
  return text.startsWith('“') && text.endsWith('”') ? text.slice(1, -1) : text;
}

export function buildTranslationCatalog(bytes: Uint8Array, source: TranslationManifest): TranslationCatalog {
  if (source.schemaVersion !== 1 || source.file !== 'explore.md' || !/^t\.[a-z0-9]+$/.test(source.tabId)) {
    throw new Error('Unsupported source manifest');
  }
  if (bytes.length !== source.byteLength) throw new Error('Source byte length mismatch');
  if (createHash('sha256').update(bytes).digest('hex') !== source.sha256) throw new Error('Source checksum mismatch');
  const catalog: TranslationCatalog = { source, blocks: [], entries: [], lessons: [] };
  const lines = Buffer.from(bytes).toString('utf8').split(/\r?\n/);
  let lesson: TranslationCatalog['lessons'][number] | undefined;
  let activity: { key: string; heading: SourceText } | undefined;
  let current: TranslationBlock | undefined;
  let tableLabels: string[] | undefined;
  let tableRow = 0;
  let questionSuffix = '';
  const references: { block: TranslationBlock; lesson: number; line: number }[] = [];
  const ref = (text: string, index: number): SourceText => ({ text, line: index + 1, raw: lines[index] });
  const block = (section: TranslationBlock['section'], suffix: string, vi: SourceText | null, index: number) => {
    if (!lesson || !activity) throw new Error(`Translation outside a named activity at line ${index + 1}`);
    const key = `b${String(lesson.number).padStart(2, '0')}.${activity.key}.${section}${suffix}`;
    if (catalog.blocks.some(item => item.key === key)) throw new Error(`Duplicate section: ${key}`);
    const value: TranslationBlock = { key, lesson: lesson.number, lessonHeading: lesson.heading,
      activityKey: activity.key, activityHeading: activity.heading, section, vi,
      translations: {}, line: index + 1, status: 'missing-translations' };
    catalog.blocks.push(value);
    return value;
  };
  const addText = (target: TranslationBlock, locale: string, text: string, index: number) => {
    if (!text) throw new Error(`Empty translation at line ${index + 1}`);
    if (locale === 'vi') {
      if (target.vi && target.vi.text !== text) throw new Error(`Conflicting Vietnamese at line ${index + 1}`);
      target.vi ??= ref(text, index);
    } else {
      if (target.translations[locale]) throw new Error(`Duplicate locale at line ${index + 1}`);
      target.translations[locale] = ref(text, index);
    }
  };

  for (const [index, raw] of lines.entries()) {
    const text = plain(raw);
    if (!text) continue;
    const lessonMatch = text.match(/^Bài (\d+)\.\s+(.+)$/);
    if (lessonMatch) {
      const number = Number(lessonMatch[1]);
      if (number < 1 || number > 20 || catalog.lessons.some(item => item.number === number)) throw new Error('Invalid or duplicate lesson');
      lesson = { number, heading: ref(text, index), activityKeys: [] };
      catalog.lessons.push(lesson);
      activity = undefined; current = undefined; tableLabels = undefined; questionSuffix = '';
      continue;
    }
    if (/^CHẶNG\s+\d/.test(text)) {
      lesson = undefined; activity = undefined; current = undefined; tableLabels = undefined;
      continue;
    }
    const activityMatch = text.match(/^(Hoạt động|Bước|Thử thách) (\d+)\.\s+(.+)$/);
    if (lesson && activityMatch) {
      const key = `${activityKinds.get(activityMatch[1])}-${activityMatch[2]}`;
      if (lesson.activityKeys.includes(key)) throw new Error(`Duplicate activity: ${key}`);
      activity = { key, heading: ref(text, index) };
      lesson.activityKeys.push(key);
      current = undefined; tableLabels = undefined; questionSuffix = '';
      continue;
    }
    if (!lesson || !activity) continue;

    if (text.startsWith('|')) {
      const cells = text.slice(1, -1).split('|').map(cell => plain(cell));
      if (cells.every(cell => /^:?-+:?$/.test(cell))) continue;
      const labels = cells.map(cell => languageLabels.get(cell));
      if (labels[0] === 'vi' && labels.every(Boolean)) {
        if (new Set(labels).size !== labels.length) throw new Error('Duplicate table locale');
        // A labelled hint table supplies individual source segments, not runtime hint indices.
        if (!current || current.section !== 'hint') throw new Error('Hint table without context');
        if (!current.vi && !Object.keys(current.translations).length) catalog.blocks.splice(catalog.blocks.indexOf(current), 1);
        tableLabels = labels as string[]; tableRow = 0; current = undefined;
      } else if (tableLabels) {
        if (cells.length !== tableLabels.length) throw new Error('Inconsistent translation table');
        current = block('hint', `-${++tableRow}`, null, index);
        cells.forEach((cell, column) => addText(current!, tableLabels![column], cell, index));
      } else if (cells.length === 2 && languageLabels.has(cells[0])) {
        if (!current) throw new Error('Translation table without a question/hint');
        addText(current, languageLabels.get(cells[0])!, cells[1], index);
      } else if (cells[0] !== 'Ngôn ngữ') throw new Error(`Unrecognized table at line ${index + 1}`);
      continue;
    }
    tableLabels = undefined;
    const prompt = text.match(/^(?:Câu hỏi(?: (\d+))?|Câu (\d+)|Lí Lắc hỏi|Câu đố):\s*(.*)$/);
    if (prompt) {
      const value = unquote(prompt[3]);
      questionSuffix = prompt[1] || prompt[2] ? `-${prompt[1] || prompt[2]}` : '';
      current = block('prompt', questionSuffix, value ? ref(value, index) : null, index);
      continue;
    }
    if (/^(?:Gợi ý|Nếu sai|Nếu trẻ gặp khó khăn)/.test(text)) {
      const value = text.match(/^Gợi ý(?: khi sai)?:\s*(.+)$/)?.[1];
      current = block('hint', questionSuffix, value ? ref(value, index) : null, index);
      if (text.includes(' / ') || text.includes(' = ')) current.status = 'ambiguous-locales';
      continue;
    }
    const reuse = text.match(/^Dùng bản dịch của câu hỏi ở Bài (\d+)\./);
    if (reuse && current?.section === 'prompt') {
      references.push({ block: current, lesson: Number(reuse[1]), line: index + 1 });
      current = undefined;
      continue;
    }
    const translated = text.match(/^([^:]+):\s*(.*)$/);
    if (translated && languageLabels.has(translated[1])) {
      if (!current) throw new Error(`Orphan translation at line ${index + 1}`);
      addText(current, languageLabels.get(translated[1])!, translated[2], index);
      continue;
    }
    current = undefined;
  }

  for (const reference of references) {
    const candidates = catalog.blocks.filter(item => item.lesson === reference.lesson && item.section === 'prompt'
      && item.vi?.text === reference.block.vi?.text && item.vi && Object.keys(item.translations).length > 0);
    reference.block.referenceLine = reference.line;
    if (candidates.length === 1) reference.block.translations = { ...candidates[0].translations };
  }
  for (const item of catalog.blocks) {
    if (item.status === 'ambiguous-locales') continue;
    if (Object.keys(item.translations).length === 0) continue;
    item.status = item.vi ? 'mapped' : 'missing-vi';
    if (!item.vi) continue;
    for (const [locale, translation] of Object.entries(item.translations)) {
      catalog.entries.push({ key: `${item.key}.${locale}`, blockKey: item.key, lesson: item.lesson,
        activityKey: item.activityKey, section: item.section, locale, vi: item.vi, translation,
        provenance: { ...source, lessonLine: item.lessonHeading.line, activityLine: item.activityHeading.line,
          ...(item.referenceLine ? { referenceLine: item.referenceLine } : {}) } });
    }
  }
  return catalog;
}

// Opt-in only: existing importer/bootstrap continue to use the 09 October catalog.
export function loadCustomerTranslationsSource() {
  const root = new URL('../../../../docs/customer-source/2026-10-18/', import.meta.url);
  const source = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8')) as TranslationManifest;
  return buildTranslationCatalog(readFileSync(new URL('explore.md', root)), source);
}

export function translationCoverage(catalog: TranslationCatalog) {
  const locales = [...languageLabels.values()].filter(locale => locale !== 'vi');
  return catalog.lessons.map(lesson => {
    const blocks = catalog.blocks.filter(item => item.lesson === lesson.number);
    const prompts = blocks.filter(item => item.section === 'prompt');
    return {
      lesson: lesson.number, heading: lesson.heading,
      promptGroups: prompts.filter(item => Object.keys(item.translations).length > 0).length,
      mappedPromptGroups: prompts.filter(item => item.status === 'mapped').length,
      mappedHintGroups: blocks.filter(item => item.section === 'hint' && item.status === 'mapped').length,
      pairs: catalog.entries.filter(item => item.lesson === lesson.number).length,
      missingVietnamese: blocks.filter(item => item.status === 'missing-vi').map(item => item.key),
      activitiesWithoutPrompt: lesson.activityKeys.filter(key => !prompts.some(item => item.activityKey === key)),
      partialLocales: blocks.filter(item => Object.keys(item.translations).length > 0)
        .map(item => ({ key: item.key, missing: locales.filter(locale => !item.translations[locale]) }))
        .filter(item => item.missing.length > 0),
      unresolved: blocks.filter(item => item.status !== 'mapped').map(item => ({ key: item.key, line: item.line, status: item.status })),
      runtimeMapping: 'not-assigned' as const,
    };
  });
}
