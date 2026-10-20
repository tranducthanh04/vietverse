import { Schema } from 'mongoose';

/**
 * Companion languages that can carry a reviewed translation.
 * This is the `companionLanguages` set minus `other` (see docs/02-business-rules.md §2):
 * `other` is an unspecified locale, so it never keys a translation.
 */
export const SUPPORT_LANGUAGES = ['en', 'ja', 'ko', 'zh', 'fr'] as const;
export type SupportLanguage = (typeof SUPPORT_LANGUAGES)[number];

/** One reviewed translation of a culture article's child-facing text. Every field is optional. */
export interface ICultureTranslation {
  title?: string;
  intro?: string;
  /** Parallel by index to the source `funFacts`; a missing/empty entry hides that fact's translation. */
  funFacts?: string[];
}

/** One reviewed translation of a story's child-facing text. Every field is optional. */
export interface IStoryTranslation {
  title?: string;
  description?: string;
  /** Parallel by index to the source `lyrics`; a missing/empty entry hides that line's translation. */
  lyrics?: string[];
  /** Parallel by index to the source `vocab`; a missing/empty entry hides that word's translation. */
  vocab?: string[];
}

/**
 * One reviewed translation of a lesson activity's child-facing feedback. Every field is optional.
 * `wrongHint` is the when-wrong hint in a support language (e.g. "mèo = cat"), shown under the
 * Vietnamese `wrongHint` so a child reads the meaning in their chosen companion language.
 */
export interface IActivityTranslation {
  wrongHint?: string;
}

export type CultureTranslations = Partial<Record<SupportLanguage, ICultureTranslation>>;
export type StoryTranslations = Partial<Record<SupportLanguage, IStoryTranslation>>;
export type ActivityTranslations = Partial<Record<SupportLanguage, IActivityTranslation>>;

/**
 * Reviewed translations of an activity's child-facing question (`prompt`), one string per support
 * language (e.g. `{ en: "Which animal swims in the pond?" }`). A flat string map, not a nested
 * entry like the others, because only the single prompt is translated. Shown under the Vietnamese
 * question so a child reads it in their chosen companion language; audio/TTS still read Vietnamese.
 */
export type ActivityPromptTranslations = Partial<Record<SupportLanguage, string>>;

// A single reusable sub-schema per content kind, mounted under each support-language key.
const cultureTranslationEntry = new Schema<ICultureTranslation>(
  { title: String, intro: String, funFacts: { type: [String] } },
  { _id: false },
);
const storyTranslationEntry = new Schema<IStoryTranslation>(
  { title: String, description: String, lyrics: { type: [String] }, vocab: { type: [String] } },
  { _id: false },
);
const activityTranslationEntry = new Schema<IActivityTranslation>(
  { wrongHint: String },
  { _id: false },
);

// Nested object keyed by support language. Absent by default so legacy documents stay valid
// and no migration is required; a document only stores the languages an editor filled in.
function perLanguage(entry: Schema): Record<string, { type: Schema }> {
  return Object.fromEntries(SUPPORT_LANGUAGES.map((lang) => [lang, { type: entry }]));
}

export const cultureTranslationFields = perLanguage(cultureTranslationEntry);
export const storyTranslationFields = perLanguage(storyTranslationEntry);
export const activityTranslationFields = perLanguage(activityTranslationEntry);

// Flat per-language string map (the translated activity prompt). Each language key maps to a plain
// String, not a nested sub-schema. Absent by default, so legacy activities stay valid without a
// migration and a document only stores the languages an editor filled in.
export const activityPromptTranslationFields: Record<string, { type: StringConstructor }> =
  Object.fromEntries(SUPPORT_LANGUAGES.map((lang) => [lang, { type: String }]));
