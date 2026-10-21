import { exploreCurriculum } from './exploreCurriculum.js';

/**
 * Illustration images for the Explore curriculum (Phase 04).
 *
 * Keys come in two shapes, both using the text normalized with {@link normalizeImageKey} (NFC + trim):
 *
 * - a **lesson-scoped** key `B<order>:<text>` — the image to use for that text in that lesson only, and
 * - a **shared** key `<text>` — the image for the text in every other lesson.
 *
 * {@link imageUrlFor} prefers the lesson-scoped key, so the same word can carry a different picture per
 * lesson: `bà` is a grandmother in B1/B13/B20 but a tone-practice syllable card in B7, and `ba`/`bá`/…
 * are people vs. tone cards likewise. The map starts empty: Phase 04 generates the images, the main
 * session uploads them to Cloudinary and fills this map, and {@link buildExploreLessonPayload} reads it
 * when building the payload. A text that is in neither key keeps an empty `imageUrl`.
 */
export const exploreCurriculumImages: Record<string, string> = {};

/** Normalize an option/vocabulary text into the image-map key: NFC then trim. */
export function normalizeImageKey(text: string): string {
  return text.normalize('NFC').trim();
}

/** The lesson-scoped image-map key for a text within a given lesson order. */
export function lessonImageKey(text: string, lessonOrder: number): string {
  return `B${lessonOrder}:${normalizeImageKey(text)}`;
}

/**
 * The image URL for an option/vocabulary text, or '' when none is mapped yet. When `lessonOrder`
 * is given, a lesson-scoped entry (`B<order>:<text>`) wins over the shared `<text>` entry, so a word
 * that means something different in this lesson can show its own picture.
 */
export function imageUrlFor(text: string, lessonOrder?: number): string {
  const key = normalizeImageKey(text);
  if (lessonOrder !== undefined) {
    const scoped = exploreCurriculumImages[lessonImageKey(text, lessonOrder)];
    if (scoped !== undefined) return scoped;
  }
  return exploreCurriculumImages[key] ?? '';
}

/** Every unique image text paired with the gathered lessons it appears in (for the two functions below). */
function collectImageTexts(): Map<string, Set<number>> {
  const byText = new Map<string, Set<number>>();
  const add = (raw: string | undefined, order: number) => {
    const key = raw ? normalizeImageKey(raw) : '';
    if (!key) return;
    (byText.get(key) ?? byText.set(key, new Set<number>()).get(key)!).add(order);
  };
  for (const lesson of exploreCurriculum) {
    for (const word of lesson.vocabulary) add(word.word, lesson.order);
    for (const activity of lesson.activities) {
      for (const option of activity.options ?? []) add(option.text, lesson.order);
    }
  }
  return byText;
}

/**
 * Every unique option/vocabulary text in the Explore curriculum that can carry an image, normalized
 * and sorted. Phase 04 uses this list to know which illustrations to generate. Only lesson options
 * and vocabulary words get images (not `targetWord` display cards), matching the Phase 02 spec.
 */
export function listExploreImageTexts(): string[] {
  return [...collectImageTexts().keys()].sort((a, b) => a.localeCompare(b, 'vi'));
}

/**
 * The same texts, each paired with the sorted list of lesson orders it appears in. A text with more
 * than one lesson may mean different things per lesson (e.g. `bà` the grandmother vs. the tone card),
 * so Phase 04 can decide whether that text needs a lesson-scoped image (`B<order>:<text>` key).
 */
export function listExploreImageTextsByLesson(): { text: string; lessons: number[] }[] {
  return [...collectImageTexts().entries()]
    .map(([text, lessons]) => ({ text, lessons: [...lessons].sort((a, b) => a - b) }))
    .sort((a, b) => a.text.localeCompare(b.text, 'vi'));
}
