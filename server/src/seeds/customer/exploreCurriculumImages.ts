import { exploreCurriculum } from './exploreCurriculum.js';

/**
 * Illustration images for the Explore curriculum (Phase 04).
 *
 * Keys are the option / vocabulary texts, normalized with {@link normalizeImageKey}
 * (NFC + trim). Values are Cloudinary (or same-origin) image URLs. The map starts
 * empty: Phase 04 generates the images, the main session uploads them to Cloudinary
 * and fills this map, and {@link buildExploreLessonPayload} reads it when building the
 * payload. A text that is not in the map keeps an empty `imageUrl`.
 */
export const exploreCurriculumImages: Record<string, string> = {};

/** Normalize an option/vocabulary text into the image-map key: NFC then trim. */
export function normalizeImageKey(text: string): string {
  return text.normalize('NFC').trim();
}

/** The image URL for an option/vocabulary text, or '' when none is mapped yet. */
export function imageUrlFor(text: string): string {
  return exploreCurriculumImages[normalizeImageKey(text)] ?? '';
}

/**
 * Every unique option/vocabulary text in the Explore curriculum that can carry an
 * image, normalized and sorted. Phase 04 uses this list to know which illustrations
 * to generate. Only lesson options and vocabulary words get images (not `targetWord`
 * display cards), matching the Phase 02 spec.
 */
export function listExploreImageTexts(): string[] {
  const texts = new Set<string>();
  for (const lesson of exploreCurriculum) {
    for (const word of lesson.vocabulary) {
      const key = normalizeImageKey(word.word);
      if (key) texts.add(key);
    }
    for (const activity of lesson.activities) {
      for (const option of activity.options ?? []) {
        const key = normalizeImageKey(option.text);
        if (key) texts.add(key);
      }
    }
  }
  return [...texts].sort((a, b) => a.localeCompare(b, 'vi'));
}
