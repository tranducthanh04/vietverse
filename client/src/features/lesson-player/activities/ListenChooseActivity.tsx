import React, { useState } from 'react';
import { AudioButton } from '../../../components/ui/AudioButton.js';
import { CircleCheck, CircleX, Star } from '../../../components/ui/icons.js';
import { cn } from '../../../lib/utils.js';
import { MissingSourceAudioNotice } from './NewActivityFrame.js';
import { useT } from '../../../i18n/index.js';

export interface ListenChooseActivityProps {
  activity: {
    id: string;
    prompt: string;
    audioUrl?: string;
    options?: Array<{
      id: string;
      text?: string;
      imageUrl?: string;
      audioUrl?: string;
    }>;
    correctAnswer: string;
    hints?: string[];
  };
  onComplete: (isCorrect: boolean, userAnswer?: any) => void;
}

export const ListenChooseActivity: React.FC<ListenChooseActivityProps> = ({
  activity,
  onComplete,
}) => {
  const t = useT();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const isCorrect = id === activity.correctAnswer;
    onComplete(isCorrect, id);
  };
  const hasImages = activity.options?.some((option) => option.imageUrl) ?? false;

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
      <h2 className="text-kid-lg md:text-kid-xl font-display font-bold text-stone-800 mb-4">
        {activity.prompt}
      </h2>

      {/* Audio speaker prompt */}
      <div className="mb-6">
        <AudioButton
          contentKey={activity.id}
          audioUrl={activity.audioUrl}
          textToSpeak={activity.prompt}
          size="lg"
          label={activity.audioUrl ? t('lesson.listenAudio') : t('lesson.listenQuestion')}
        />
        {/* Without source audio, device speech can only read the prompt; do not imply a listening clip exists. */}
        {!activity.audioUrl && <MissingSourceAudioNotice hint={t('lesson.hintReadAbove')} />}
      </div>

      {/* Options: picture cards when the lesson has images, compact lettered rows otherwise */}
      <div
        className={cn(
          'grid gap-4 w-full',
          hasImages ? 'grid-cols-2 md:grid-cols-3 max-w-lg' : 'grid-cols-1 sm:grid-cols-2 max-w-xl'
        )}
      >
        {activity.options?.map((option, index) => {
          const isSelected = selectedId === option.id;
          const isCorrect = isSelected && option.id === activity.correctAnswer;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={cn(
                'group relative bg-white border-4 rounded-3xl transition-all shadow-kid active:scale-95',
                hasImages
                  ? 'p-4 flex flex-col items-center justify-center min-h-[160px]'
                  : 'px-4 py-3 flex items-center gap-4 text-left min-h-[72px]',
                isSelected
                  ? isCorrect
                    ? 'border-kidSuccess bg-emerald-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-cream-border hover:border-accent hover:-translate-y-1'
              )}
            >
              {/* Pair the colour feedback with an icon + text so it is not conveyed by colour alone. */}
              {isSelected && (
                <span className="absolute top-2 right-2">
                  {isCorrect ? (
                    <CircleCheck className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <CircleX className="w-6 h-6 text-red-600" />
                  )}
                  <span className="sr-only">{isCorrect ? t('lesson.correct') : t('lesson.incorrect')}</span>
                </span>
              )}
              {hasImages ? (
                option.imageUrl ? (
                  <img
                    src={option.imageUrl}
                    alt={option.text || ''}
                    className="w-28 h-28 object-cover rounded-2xl mb-3 shadow-inner pointer-events-none"
                    onError={(e) => {
                      // Fallback to text box if external image is unavailable
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-amber-100 flex items-center justify-center mb-3">
                    <Star className="w-9 h-9 text-primary" />
                  </div>
                )
              ) : (
                <span
                  aria-hidden="true"
                  className="shrink-0 w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 font-display font-black text-kid-base flex items-center justify-center"
                >
                  {String.fromCharCode(65 + index)}
                </span>
              )}

              <span className="text-kid-lg font-bold font-display text-stone-800 group-hover:text-primary">
                {option.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
