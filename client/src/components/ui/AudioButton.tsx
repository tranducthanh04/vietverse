import React from "react";
import {
  Volume,
  Volume2,
} from './icons.js';
import { cn } from "../../lib/utils.js";
import { useNarration } from "../../hooks/useNarration.js";
import { useT } from "../../i18n/index.js";

/**
 * "Now playing" indicator: a speaker glyph beside three sound-wave bars that pulse while audio
 * plays. It replaces the old `Square` stop glyph, which rendered like a missing-font box on some
 * devices (Log Bug v2, Bug 2, 21/10/2026). The bars keep distinct resting heights, so under
 * `prefers-reduced-motion` — where the pulse is suppressed — the icon still reads as "playing" and
 * stays visibly different from the idle speaker. Decorative: the button's `aria-label` carries the
 * stop/pause meaning.
 */
const PlayingWaveIcon: React.FC = () => (
  <span
    data-testid="audio-playing-wave"
    aria-hidden="true"
    className="inline-flex items-center gap-[2px] text-primary"
  >
    <Volume className="w-5 h-5" aria-hidden="true" />
    <span className="flex items-end gap-[2px] h-4">
      <span className="w-[3px] h-1.5 origin-bottom rounded-full bg-current animate-soundwave motion-reduce:animate-none [animation-delay:-0.2s]" />
      <span className="w-[3px] h-4 origin-bottom rounded-full bg-current animate-soundwave motion-reduce:animate-none [animation-delay:-0.45s]" />
      <span className="w-[3px] h-2.5 origin-bottom rounded-full bg-current animate-soundwave motion-reduce:animate-none" />
    </span>
  </span>
);

export interface AudioButtonProps {
  audioUrl?: string;
  textToSpeak?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  lang?: string;
  contentKey?: string;
  // Auto-read this source once when it first mounts or its contentKey changes. The speaker stays
  // tappable; blocked autoplay (e.g. no prior gesture) is silent. Off by default.
  autoPlay?: boolean;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  audioUrl,
  textToSpeak,
  className,
  size = "md",
  label,
  lang = "vi-VN",
  contentKey,
  autoPlay = false,
}) => {
  const t = useT();
  const narration = useNarration({
    audioUrl,
    text: textToSpeak,
    lang,
    contentKey,
    autoPlay,
  });
  const { isPlaying } = narration;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    narration.toggle();
  };

  const sizes = {
    sm: "p-2 min-h-[44px] min-w-[44px] text-sm",
    md: "p-3 min-h-[48px] min-w-[48px] text-base",
    lg: "p-4 min-h-[58px] min-w-[58px] text-lg",
  };

  return (
    <span className="inline-flex flex-col items-center gap-1">
      {narration.audioSrc && (
        <audio
          key={narration.audioSrc}
          ref={narration.audioRef}
          src={narration.audioSrc}
          preload="none"
          {...narration.audioEvents}
        />
      )}
      <button
        type="button"
        onClick={handlePlay}
        disabled={!narration.canPlay}
        className={cn(
          "inline-flex items-center justify-center space-x-2 bg-accent/20 hover:bg-accent/40 active:scale-95 text-stone-900 border-2 border-accent rounded-full transition-[background-color,box-shadow,transform] motion-reduce:transition-none shadow-sm",
          sizes[size],
          isPlaying && "ring-4 ring-accent animate-pulse bg-accent/50",
          className,
        )}
        aria-label={
          isPlaying
            ? narration.mode === "tts"
              ? t('audio.stop')
              : t('audio.pause')
            : label || t('audio.playDefault')
        }
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          <PlayingWaveIcon />
        ) : (
          <Volume2 className="w-6 h-6 text-stone-800" />
        )}
        {label && <span className="font-bold font-display px-1">{label}</span>}
      </button>
      {narration.isPlaying && narration.mode === "tts" && (
        <span className="text-xs text-stone-500">{t('audio.deviceVoice')}</span>
      )}
      {narration.error && (
        <span role="status" className="text-xs text-stone-600 max-w-[16rem] text-center">
          {narration.error}
        </span>
      )}
      {!narration.canPlay && !narration.error && (
        <span className="text-xs text-stone-600">
          {t('audio.unavailable')}
        </span>
      )}
    </span>
  );
};
