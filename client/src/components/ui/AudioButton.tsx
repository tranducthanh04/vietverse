import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface AudioButtonProps {
  audioUrl?: string;
  textToSpeak?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  audioUrl,
  textToSpeak,
  className,
  size = 'md',
  label,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If audioUrl exists and is not a local relative missing asset, try HTML5 Audio
    if (audioUrl && !audioUrl.startsWith('/audio/')) {
      const audio = new Audio(audioUrl);
      setIsPlaying(true);
      audio.play().catch(() => {
        // Fallback to speech synthesis
        fallbackSpeech();
      });
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        fallbackSpeech();
      };
      return;
    }

    fallbackSpeech();
  };

  const fallbackSpeech = () => {
    const text = textToSpeak || label || 'Tiếng Việt';
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.85; // Slightly slower for kids
      utterance.pitch = 1.1; // Gentle friendly tone

      setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(false);
    }
  };

  const sizes = {
    sm: 'p-2 min-h-[44px] min-w-[44px] text-sm',
    md: 'p-3 min-h-[48px] min-w-[48px] text-base',
    lg: 'p-4 min-h-[58px] min-w-[58px] text-lg',
  };

  return (
    <button
      type="button"
      onClick={handlePlay}
      className={cn(
        'inline-flex items-center justify-center space-x-2 bg-accent/20 hover:bg-accent/40 active:scale-95 text-stone-900 border-2 border-accent rounded-full transition-all shadow-sm',
        sizes[size],
        isPlaying && 'ring-4 ring-accent animate-pulse bg-accent/50',
        className
      )}
      aria-label="Phát âm thanh"
    >
      {isPlaying ? (
        <Volume2 className="w-6 h-6 text-primary animate-bounce-subtle" />
      ) : (
        <Volume2 className="w-6 h-6 text-stone-800" />
      )}
      {label && <span className="font-bold font-display px-1">{label}</span>}
    </button>
  );
};
