import React, { forwardRef, useImperativeHandle } from 'react';
import { Lightbulb, Volume2 } from '../../../components/ui/icons.js';
import { useNarration } from '../../../hooks/useNarration.js';
import { SupportTranslation } from '../../../components/ui/SupportTranslation.js';
import { useT } from '../../../i18n/index.js';

export interface WrongAnswerFeedbackHandle {
  /** Replay the question audio once, cancelling any in-flight playback. */
  replay: () => void;
}

export interface WrongAnswerFeedbackActivity {
  id: string;
  prompt?: string;
  audioUrl?: string;
  /** When-wrong hint in Vietnamese (e.g. the meaning of the target word). */
  wrongHint?: string;
  /** Reviewed translations of `wrongHint`, keyed by support language. */
  wrongHintTranslations?: Partial<Record<string, { wrongHint?: string }>>;
}

export interface WrongAnswerFeedbackProps {
  /** Whether the child's current answer is wrong; the hint card only shows when true. */
  show: boolean;
  activity: WrongAnswerFeedbackActivity;
  /**
   * Whether this activity has a source audio to re-listen to. When true a "Nghe lại" button is
   * offered and the parent replays the audio on each wrong answer. When false only the hint shows.
   */
  canReplay?: boolean;
  lang?: string;
}

/**
 * Friendly, accessible feedback shown under the question when a child answers wrong: a short hint
 * (content-provided `wrongHint` with its support-language translation, else a generic encouragement)
 * and, for activities with source audio, a "Nghe lại" button. Replaying reuses the shared narration
 * engine (one reader at a time); it never changes scoring or retry rules.
 */
export const WrongAnswerFeedback = forwardRef<WrongAnswerFeedbackHandle, WrongAnswerFeedbackProps>(
  function WrongAnswerFeedback({ show, activity, canReplay = false, lang = 'vi-VN' }, ref) {
    const t = useT();
    const narration = useNarration({
      audioUrl: activity.audioUrl,
      text: activity.prompt ?? '',
      lang,
      // A dedicated reader key so replaying on a wrong answer never fights the question's own
      // listen button; the single-reader rule still stops whichever one is already playing.
      contentKey: `wrong:${activity.id}`,
    });
    useImperativeHandle(ref, () => ({ replay: () => narration.replay() }), [narration]);

    const hasContentHint = Boolean(activity.wrongHint?.trim());

    return (
      <>
        {/* Keep the asset mounted even while hidden so a replay triggered inside the wrong-answer
            click (before this re-renders with show) still has an audio element to play. */}
        {activity.audioUrl && (
          <audio
            key={activity.audioUrl}
            ref={narration.audioRef}
            src={activity.audioUrl}
            preload="none"
            {...narration.audioEvents}
          />
        )}
        {show && (
          <div
            role="status"
            aria-live="polite"
            className="w-full max-w-md mx-auto my-4 rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 animate-fade-in"
          >
            <p className="flex items-center justify-center gap-2 font-bold font-display text-kid-sm">
              <Lightbulb className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{hasContentHint ? activity.wrongHint : t('lesson.wrongHintGeneric')}</span>
            </p>
            {hasContentHint && (
              <SupportTranslation
                translations={activity.wrongHintTranslations}
                select={(entry: { wrongHint?: string }) => entry.wrongHint}
                className="mt-1 block text-center text-sm text-amber-700"
              />
            )}
            {canReplay && (
              <div className="mt-2 flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => narration.replay()}
                  disabled={!narration.canPlay}
                  className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border-2 border-accent bg-accent/20 hover:bg-accent/40 active:scale-95 text-stone-900 font-bold font-display transition-[background-color,transform] motion-reduce:transition-none disabled:opacity-50"
                >
                  <Volume2 className="w-5 h-5 text-stone-800" aria-hidden="true" />
                  <span>{t('lesson.listenAgain')}</span>
                </button>
                {narration.error && (
                  <span className="text-xs text-stone-600 max-w-[16rem] text-center">
                    {narration.error}
                  </span>
                )}
                {!narration.canPlay && !narration.error && (
                  <span className="text-xs text-stone-600">{t('audio.unavailable')}</span>
                )}
              </div>
            )}
          </div>
        )}
      </>
    );
  },
);
