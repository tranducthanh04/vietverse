import { z } from 'zod';
import type { ContentKind, ContentPayloadMap, FieldIssue } from './content.types.js';

export const contentKinds = ['lesson', 'story', 'culture'] as const;
export const cultureCategories = ['tet', 'am_thuc', 'trang_phuc', 'phong_tuc', 'le_hoi', 'vat_dung', 'thien_nhien', 'tro_choi_dan_gian'] as const;
const normalized = (text: string) => text.normalize('NFC').trim().toLocaleLowerCase('vi');
export function isAllowedMediaUrl(value: string): boolean {
  if (!value) return true;
  if (/[\u0000-\u0020\u007f\\]/.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}
const media = z.string().max(2048).refine(isAllowedMediaUrl, 'Use HTTPS or a same-origin asset path').default('');
const text = z.string().max(5000);
const short = z.string().max(200);
const id = z.string().max(100);
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const answer = z.union([text, z.array(text).max(12), z.number().finite(), z.boolean(), z.record(text)]).optional();
const optionSchema = z.object({ id, text: text.optional(), imageUrl: media, audioUrl: media });
export const activityDraftSchema = z.object({
  id: id.default(''),
  type: z.enum(['listen_choose', 'word_card', 'drag_match', 'fill_blank', 'sort_order', 'record_voice', 'review']),
  prompt: text.default(''), subPrompt: text.optional(), audioUrl: media, imageUrl: media,
  options: z.array(optionSchema).max(8).optional(), correctAnswer: answer,
  hints: z.array(text).max(20).optional(), targetWord: text.optional(), targetPhonetic: text.optional(),
  pairs: z.array(z.object({ left: text, right: text })).max(12).optional(),
  blanks: z.array(z.object({ sentence: text, missing: text })).max(1).optional(),
  orderedItems: z.array(text).max(12).optional(), pointsWeight: z.number().finite().nonnegative().optional(),
});
const vocabularySchema = z.object({ word: text.default(''), meaning: text.default(''), phonetic: text.optional(), audioUrl: media, imageUrl: media });
const quizSchema = z.object({ question: text.default(''), options: z.array(text).max(8).default([]), correctAnswer: z.number().int().default(-1), explanation: text.optional() });
export const lessonDraftSchema = z.object({
  stageId: z.union([objectId, z.literal('')]).default(''), order: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
  title: short.default(''), description: text.default(''),
  vocabulary: z.array(vocabularySchema).max(100).default([]), activities: z.array(activityDraftSchema).max(50).default([]),
  freeInStarterPlan: z.boolean().default(false), totalActivities: z.number().optional(),
}).transform((lesson) => ({ ...lesson, totalActivities: lesson.activities.length }));
export const storyDraftSchema = z.object({
  type: z.enum(['dong_dao', 'co_tich', 'tho', 'ngu_ngon']).default('dong_dao'), title: short.default(''),
  author: short.default(''), description: text.default(''), coverImage: media,
  lyrics: z.array(z.object({ timeSec: z.number().finite().nonnegative().default(0), text })).max(500).default([]),
  audioUrl: media, durationSec: z.number().finite().nonnegative().default(0),
  ageGroups: z.array(z.enum(['5-6', '6-8'])).max(2).default(['5-6']),
  vocab: z.array(text).max(100).default([]), quiz: z.array(quizSchema).max(20).default([]),
});
export const cultureDraftSchema = z.object({
  category: short.default(''), title: short.default(''), intro: text.default(''), coverImage: media,
  funFacts: z.array(text).max(50).default([]), quiz: z.array(quizSchema).max(20).default([]),
  audioUrl: media, tags: z.array(short).max(50).default([]),
});
const schemas = { lesson: lessonDraftSchema, story: storyDraftSchema, culture: cultureDraftSchema };

function duplicateIssues(values: string[], field: string, issues: FieldIssue[], normalize = true) {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    const key = normalize ? normalized(value) : value;
    if (seen.has(key)) issues.push({ field: `${field}.${index}`, message: 'Duplicate value' });
    seen.add(key);
  });
}

export function parseDraft<K extends ContentKind>(kind: K, input: unknown): ContentPayloadMap[K] {
  if (Buffer.byteLength(JSON.stringify(input) ?? '', 'utf8') > 512 * 1024) {
    throw new z.ZodError([{ code: 'custom', path: [], message: 'Content exceeds 512 KiB' }]);
  }
  const result = schemas[kind].parse(input);
  const issues: FieldIssue[] = [];
  if (kind === 'lesson') {
    const lesson = result as ContentPayloadMap['lesson'];
    duplicateIssues(lesson.activities.map((a) => a.id).filter(Boolean), 'activities', issues, false);
    lesson.activities.forEach((a, index) => duplicateIssues((a.options ?? []).map((o) => o.id), `activities.${index}.options`, issues, false));
  }
  if (issues.length) throw new z.ZodError(issues.map(({ field, message }) => ({ code: 'custom', path: field.split('.'), message })));
  return result as ContentPayloadMap[K];
}

export function validatePublish<K extends ContentKind>(kind: K, input: ContentPayloadMap[K]): FieldIssue[] {
  let payload: ContentPayloadMap[K];
  try { payload = parseDraft(kind, input); }
  catch (error) {
    if (error instanceof z.ZodError) return error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    throw error;
  }
  const issues: FieldIssue[] = [];
  const requireText = (value: string | undefined, field: string) => {
    if (!value?.trim()) issues.push({ field, message: 'Required' });
  };
  const minimum = (values: unknown[] | undefined, count: number, field: string) => {
    if (!values || values.length < count) issues.push({ field, message: `At least ${count} required` });
  };
  requireText(payload.title, 'title');
  if (kind === 'lesson') {
    const lesson = payload as ContentPayloadMap['lesson'];
    requireText(lesson.stageId, 'stageId');
    if (lesson.order < 1) issues.push({ field: 'order', message: 'Order must be positive' });
    minimum(lesson.activities, 1, 'activities');
    lesson.vocabulary.forEach((word, i) => { requireText(word.word, `vocabulary.${i}.word`); requireText(word.meaning, `vocabulary.${i}.meaning`); });
    lesson.activities.forEach((a, i) => {
      const path = `activities.${i}`;
      requireText(a.id, `${path}.id`); requireText(a.prompt, `${path}.prompt`);
      if (a.type === 'word_card' || a.type === 'record_voice') requireText(a.targetWord, `${path}.targetWord`);
      if (['listen_choose', 'review', 'fill_blank'].includes(a.type)) {
        minimum(a.options, 2, `${path}.options`);
        for (const [j, option] of (a.options ?? []).entries()) {
          requireText(option.id, `${path}.options.${j}.id`);
          requireText(a.type === 'listen_choose' ? option.text || option.imageUrl : option.text, `${path}.options.${j}.text`);
        }
        if (typeof a.correctAnswer !== 'string' || !a.options?.some((option) => option.id === a.correctAnswer)) {
          issues.push({ field: `${path}.correctAnswer`, message: 'Choose an existing option ID' });
        }
        duplicateIssues((a.options ?? []).map((o) => o.text || o.imageUrl), `${path}.options`, issues);
      }
      if (a.type === 'fill_blank') {
        const blank = a.blanks?.[0];
        if (!blank || (blank.sentence.match(/_{2,}/g) ?? []).length !== 1) issues.push({ field: `${path}.blanks`, message: 'Exactly one blank marker required' });
        requireText(blank?.missing, `${path}.blanks.0.missing`);
        const correct = a.options?.find((o) => o.id === a.correctAnswer)?.text;
        if (!correct || normalized(correct) !== normalized(blank?.missing ?? '')) issues.push({ field: `${path}.correctAnswer`, message: 'Answer must match the missing word' });
      }
      if (a.type === 'drag_match') {
        minimum(a.pairs, 2, `${path}.pairs`);
        for (const side of ['left', 'right'] as const) {
          (a.pairs ?? []).forEach((pair, j) => requireText(pair[side], `${path}.pairs.${j}.${side}`));
          duplicateIssues((a.pairs ?? []).map((pair) => pair[side]), `${path}.pairs.${side}`, issues);
        }
      }
      if (a.type === 'sort_order') {
        minimum(a.orderedItems, 2, `${path}.orderedItems`);
        (a.orderedItems ?? []).forEach((item, j) => requireText(item, `${path}.orderedItems.${j}`));
        duplicateIssues(a.orderedItems ?? [], `${path}.orderedItems`, issues);
        if (!Array.isArray(a.correctAnswer) || JSON.stringify(a.correctAnswer) !== JSON.stringify(a.orderedItems)) issues.push({ field: `${path}.correctAnswer`, message: 'Answer must match ordered items' });
      }
    });
  } else {
    const content = payload as ContentPayloadMap['story'] | ContentPayloadMap['culture'];
    content.quiz.forEach((question, i) => {
      requireText(question.question, `quiz.${i}.question`); minimum(question.options, 2, `quiz.${i}.options`);
      question.options.forEach((option, j) => requireText(option, `quiz.${i}.options.${j}`));
      duplicateIssues(question.options, `quiz.${i}.options`, issues);
      if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) issues.push({ field: `quiz.${i}.correctAnswer`, message: 'Choose an existing option' });
    });
    if (kind === 'story') {
      const story = payload as ContentPayloadMap['story'];
      minimum(story.lyrics, 1, 'lyrics'); minimum(story.ageGroups, 1, 'ageGroups');
      duplicateIssues(story.ageGroups, 'ageGroups', issues);
      if (story.audioUrl && story.durationSec <= 0) issues.push({ field: 'durationSec', message: 'Audio duration required' });
      story.lyrics.forEach((line, i) => {
        requireText(line.text, `lyrics.${i}.text`);
        if (story.audioUrl && (line.timeSec > story.durationSec || (i > 0 && line.timeSec <= story.lyrics[i - 1].timeSec))) issues.push({ field: `lyrics.${i}.timeSec`, message: 'Times must increase within audio duration' });
      });
    } else {
      const culture = payload as ContentPayloadMap['culture'];
      if (!(cultureCategories as readonly string[]).includes(culture.category)) issues.push({ field: 'category', message: 'Choose a supported category' });
      requireText(culture.intro, 'intro'); minimum(culture.funFacts, 1, 'funFacts'); minimum(culture.quiz, 1, 'quiz');
      culture.funFacts.forEach((fact, i) => requireText(fact, `funFacts.${i}`));
      duplicateIssues(culture.tags, 'tags', issues);
    }
  }
  return issues;
}
