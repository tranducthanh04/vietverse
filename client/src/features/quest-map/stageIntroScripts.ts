import data from './stageIntroScripts.json';

/**
 * Companion languages the stage-intro subtitle can be translated into. Matches the set the
 * product supports for content translations (see `SupportTranslation`). Audio always reads
 * the Vietnamese line; translations only help the child read along.
 */
export const STAGE_INTRO_SUPPORT_LANGUAGES = ['en', 'ja', 'ko', 'zh', 'fr'] as const;
export type StageIntroSupportLanguage = (typeof STAGE_INTRO_SUPPORT_LANGUAGES)[number];

export interface StageIntroScript {
  /** 1-based stage order, matching `stage.order` from the `/stages` API. */
  order: number;
  /** User-approved Vietnamese greeting (the primary text and what the audio reads). */
  vi: string;
  /** Reviewed child-friendly translations, keyed by companion language. */
  translations: Partial<Record<StageIntroSupportLanguage, string>>;
}

// `stageIntroScripts.json` is the single source of truth shared with scripts/tts/gen_stage_intro.py,
// so the wording never diverges between the UI and the generated audio.
const scripts = (data.stages as StageIntroScript[]).slice().sort((a, b) => a.order - b.order);

export const STAGE_INTRO_SCRIPTS: readonly StageIntroScript[] = scripts;

/** edge-tts voice/rate the audio was generated with; kept beside the lines for traceability. */
export const STAGE_INTRO_VOICE = data.voice as string;
export const STAGE_INTRO_RATE = data.rate as string;

/** Static MP3 path for a stage intro, served from `client/public`. */
export function stageIntroAudioSrc(order: number): string {
  return `/audio/stage-intro/stage-${order}.mp3`;
}

/** The approved script for a stage order, or `undefined` when no intro exists for it. */
export function getStageIntroScript(order: number): StageIntroScript | undefined {
  return STAGE_INTRO_SCRIPTS.find((script) => script.order === order);
}

const SEEN_KEY = 'vietverse_stage_intro_seen_v1';

/**
 * Whether this child has already watched the intro for this stage. Stored per device in
 * localStorage, keyed by child id and stage order. Any storage failure is treated as "not seen"
 * so a blocked or corrupt store never hides the intro — and never blocks entering the lesson.
 */
export function hasSeenStageIntro(childId: string, order: number): boolean {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, number[]>;
    return Array.isArray(map[childId]) && map[childId].includes(order);
  } catch {
    return false;
  }
}

/** Record that this child has watched a stage intro. Storage failures are swallowed on purpose. */
export function markStageIntroSeen(childId: string, order: number): void {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number[]>) : {};
    const list = Array.isArray(map[childId]) ? map[childId] : [];
    if (!list.includes(order)) list.push(order);
    map[childId] = list;
    localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  } catch {
    // Storage blocked or full: the intro simply shows again next time. Never block the child.
  }
}
