import { z } from 'zod';

// Read projections whitelist fields without retroactively imposing CMS authoring limits.
// Writes still use parseDraft/validatePublish, including the stricter media policy.
const text = z.string();
const optionalText = text.optional();
const media = text.default('');
const strings = z.array(text);
const activity = z.object({
  id: text.default(''), type: z.enum(['listen_choose', 'word_card', 'drag_match', 'fill_blank', 'sort_order', 'record_voice', 'review', 'multi_select', 'group_sort', 'fill_blanks', 'follow_steps']),
  prompt: text.default(''), subPrompt: optionalText, audioUrl: media, imageUrl: media,
  options: z.array(z.object({ id: text, text: optionalText, imageUrl: media, audioUrl: media })).optional(),
  correctAnswer: z.union([text, strings, z.number(), z.boolean(), z.record(text)]).optional(),
  hints: strings.optional(), targetWord: optionalText, targetPhonetic: optionalText,
  pairs: z.array(z.object({ left: text, right: text })).optional(),
  blanks: z.array(z.object({ sentence: text, missing: text })).optional(),
  orderedItems: strings.optional(), pointsWeight: z.number().optional(),
  groups: z.array(z.object({ id: text, label: text })).optional(),
  template: optionalText,
  blankSlots: z.array(z.object({ id: text, label: text, acceptedAnswers: strings })).optional(),
  steps: z.array(z.object({ id: text, text })).optional(),
});
const quiz = z.array(z.object({ question: text, options: strings, correctAnswer: z.number(), explanation: optionalText })).default([]);
export const readSchemas = {
  lesson: z.object({ stageId: text.default(''), order: z.number(), title: text, description: text.default(''),
    vocabulary: z.array(z.object({ word: text.default(''), meaning: text.default(''), phonetic: optionalText, audioUrl: media, imageUrl: media })).default([]),
    activities: z.array(activity).default([]), freeInStarterPlan: z.boolean().default(false), totalActivities: z.number().optional(),
  }).transform(value => ({ ...value, totalActivities: value.activities.length })),
  story: z.object({ type: z.enum(['dong_dao', 'co_tich', 'tho', 'ngu_ngon']), title: text, author: text.default(''), description: text.default(''),
    coverImage: media, lyrics: z.array(z.object({ text, timeSec: z.number() })).default([]), audioUrl: media, durationSec: z.number().default(0),
    ageGroups: z.array(text).default([]), vocab: strings.default([]), quiz,
  }),
  culture: z.object({ category: text, title: text, intro: text.default(''), coverImage: media, audioUrl: media, funFacts: strings.default([]), tags: strings.default([]), quiz }),
};
