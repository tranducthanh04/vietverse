import React from "react";
import {
  Volume2,
  Square,
} from './icons.js';
import { cn } from "../../lib/utils.js";
import { useNarration } from "../../hooks/useNarration.js";
import { useT } from "../../i18n/index.js";

export interface AudioButtonProps {
  audioUrl?: string;
  textToSpeak?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  lang?: string;
  contentKey?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  audioUrl,
  textToSpeak,
  className,
  size = "md",
  label,
  lang = "vi-VN",
  contentKey,
}) => {
  const t = useT();
  const narration = useNarration({
    audioUrl,
    text: textToSpeak,
    lang,
    contentKey,
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
      {audioUrl && (
        <audio
          key={audioUrl}
          ref={narration.audioRef}
          src={audioUrl}
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
          <Square className="w-6 h-6 text-primary" />
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
