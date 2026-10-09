import type { ContentKind, ContentPayloadMap, EditorialNote, LessonContent } from './content.types.js';
import { readSchemas } from './content.read-schema.js';

export function toContentPayload<K extends ContentKind>(kind: K, document: unknown): ContentPayloadMap[K] {
  const source = document as { toObject?: () => Record<string, unknown> };
  const plain = source.toObject ? source.toObject() : document as Record<string, unknown>;
  const copy = { ...plain };
  if (kind === 'lesson' && copy.stageId) {
    const stage = copy.stageId as { _id?: unknown };
    copy.stageId = String(stage._id ?? copy.stageId);
  }
  return readSchemas[kind].parse(copy) as ContentPayloadMap[K];
}

/** Learner-only projection. Canonical readers, CMS and graders must never use this. */
export function toLearnerLessonPayload(payload: LessonContent) {
  return { ...payload, activities: payload.activities.map(activity => {
    if (activity.type === 'multi_select' || activity.type === 'group_sort' || activity.type === 'fill_blanks') {
      const { correctAnswer: _expected, ...visible } = activity;
      if (activity.type === 'fill_blanks') {
        return { ...visible, blankSlots: activity.blankSlots?.map(({ acceptedAnswers: _answers, ...slot }) => slot) };
      }
      return visible;
    }
    return { ...activity };
  }) };
}

export function normalizeLessonDraft(input: LessonContent): { payload: LessonContent; notes: EditorialNote[] } {
  const payload = structuredClone(input);
  const notes: EditorialNote[] = [];
  payload.activities.forEach((activity, index) => {
    if (!['fill_blank', 'listen_choose', 'review'].includes(activity.type) || typeof activity.correctAnswer !== 'string') return;
    if (activity.options?.some((option) => option.id === activity.correctAnswer)) return;
    const normalize = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('vi');
    const answer = normalize(activity.correctAnswer);
    const matches = activity.options?.filter((option) => option.text && normalize(option.text) === answer) ?? [];
    if (matches.length === 1) activity.correctAnswer = matches[0].id;
    notes.push({ field: `activities.${index}.correctAnswer`, reason: 'normalization', message: matches.length === 1 ? 'Legacy text answer converted to option ID. Please check before publishing.' : 'Legacy answer is ambiguous. Please choose an option.' });
  });
  return { payload, notes };
}
