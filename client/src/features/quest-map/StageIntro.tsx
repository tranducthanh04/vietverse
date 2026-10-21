import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Mascot } from '../../components/ui/Mascot.js';
import { SupportTranslation } from '../../components/ui/SupportTranslation.js';
import { Play } from '../../components/ui/icons.js';
import { claimPlayback, releasePlayback } from '../../hooks/useNarration.js';
import { useT } from '../../i18n/index.js';
import { cn } from '../../lib/utils.js';
import { getStageIntroScript, stageIntroAudioSrc } from './stageIntroScripts.js';

// Per-stage backdrop. Literal class strings so Tailwind keeps them at build time.
const STAGE_BACKGROUNDS: Record<number, string> = {
  1: 'bg-gradient-to-b from-sky-100 to-emerald-100',
  2: 'bg-gradient-to-b from-amber-50 to-orange-100',
  3: 'bg-gradient-to-b from-violet-100 to-fuchsia-100',
  4: 'bg-gradient-to-b from-teal-50 to-cyan-100',
  5: 'bg-gradient-to-b from-rose-100 to-amber-100',
};

// Rough speaking time used only when the audio can't play, so the mascot stops "talking" and the
// greeting settles. ~0.45s per word, clamped to the 8–16s window the clips target.
const estimateSpeakMs = (text: string) =>
  Math.min(16000, Math.max(8000, text.trim().split(/\s+/).length * 450));

export interface StageIntroProps {
  stageOrder: number;
  /** 'start' when the intro gates entry to a lesson, 'replay' when re-watched from the map. */
  ctaMode: 'start' | 'replay';
  /** Called when the child skips, finishes, or presses Esc. The parent decides whether to navigate. */
  onClose: () => void;
}

/**
 * Full-screen greeting from the mascot Sao Lí Lắc shown at the start of a stage. It plays a short
 * pre-generated Vietnamese clip, shows the subtitle (plus the child's support-language translation),
 * and lets the child skip or continue. It owns the single-reader playback slot while open.
 */
export const StageIntro: React.FC<StageIntroProps> = ({ stageOrder, ctaMode, onClose }) => {
  const t = useT();
  const script = getStageIntroScript(stageOrder);
  const audioRef = useRef<HTMLAudioElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stopRef = useRef<() => void>(() => {});
  const [speaking, setSpeaking] = useState(true);

  // Stop everything this intro drives: pause the clip, drop the settle timer, and give up the
  // single-reader playback slot. Stable identity ([] deps) so claim/release always pair up.
  const stop = useCallback(() => {
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = undefined;
    }
    audioRef.current?.pause();
    releasePlayback(stopRef.current);
    setSpeaking(false);
  }, []);
  stopRef.current = stop;

  // When the clip can't play, keep the subtitle and let the mascot "talk" for an estimated time.
  const settle = useCallback(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(
      () => setSpeaking(false),
      script ? estimateSpeakMs(script.vi) : 8000,
    );
  }, [script]);

  useEffect(() => {
    if (!script) return;
    claimPlayback(stop);
    setSpeaking(true);
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.currentTime = 0;
        const result = audio.play();
        if (result && typeof result.catch === 'function') result.catch(() => settle());
      } catch {
        settle();
      }
    } else {
      settle();
    }
    return () => stop();
  }, [script, stop, settle]);

  if (!script) return null;

  const handleClose = () => {
    stop();
    onClose();
  };

  // Wrap the flat translation map so the object-valued SupportTranslation contract holds.
  const wrappedTranslations = Object.fromEntries(
    Object.entries(script.translations).map(([lang, text]) => [lang, { text }]),
  );

  return (
    <Modal
      isOpen
      onClose={handleClose}
      hideCloseBtn
      role="dialog"
      ariaLabel={t('stageIntro.dialogLabel')}
      className={cn('max-w-xl text-center', STAGE_BACKGROUNDS[stageOrder] ?? STAGE_BACKGROUNDS[1])}
    >
      {/* Vietnamese narration. The subtitle below is the on-screen transcript, so no <track>. */}
      <audio
        ref={audioRef}
        src={stageIntroAudioSrc(stageOrder)}
        preload="auto"
        onEnded={() => setSpeaking(false)}
        onError={() => settle()}
        className="sr-only"
      />

      <div className="flex flex-col items-center gap-4">
        <Mascot size="xl" mood={speaking ? 'talking' : 'happy'} label={t('stageIntro.mascotLabel')} />

        <div className="relative w-full rounded-kid-lg bg-white/90 border-2 border-accent/40 px-4 py-3 shadow-md">
          <p lang="vi" className="text-kid-base sm:text-kid-lg font-semibold text-stone-800 leading-relaxed">
            {script.vi}
          </p>
          <SupportTranslation
            translations={wrappedTranslations}
            select={(entry: { text?: string }) => entry.text}
            className="mt-2 block text-sm text-stone-500"
          />
        </div>

        {/* Primary CTA is first in the DOM so the dialog focuses it on open; flex ordering keeps
            Skip on the left (desktop) / below (mobile) for a familiar secondary-then-primary layout. */}
        <div className="flex flex-col sm:flex-row-reverse items-center justify-center gap-3 w-full pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="btn-3d-primary inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-full font-bold text-sm w-full sm:w-auto"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            <span>{ctaMode === 'start' ? t('stageIntro.start') : t('stageIntro.continue')}</span>
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full font-bold text-sm text-stone-600 bg-white/80 border border-outline-variant/50 hover:bg-white w-full sm:w-auto"
          >
            <span>{t('stageIntro.skip')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
