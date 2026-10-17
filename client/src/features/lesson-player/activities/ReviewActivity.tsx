import React, { useState } from 'react';
import { CircleCheck, CircleX } from '../../../components/ui/icons.js';
import { cn } from '../../../lib/utils.js';
import { useT } from '../../../i18n/index.js';

export interface ReviewActivityProps {
  activity: {
    id: string;
    prompt: string;
    options?: Array<{ id: string; text?: string }>;
    correctAnswer: string;
  };
  onComplete: (isCorrect: boolean, userAnswer?: any) => void;
}

export const ReviewActivity: React.FC<ReviewActivityProps> = ({
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

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
      <h2 className="text-kid-lg md:text-kid-xl font-display font-bold text-stone-800 mb-8">
        {activity.prompt}
      </h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {activity.options?.map((option) => {
          const isSelected = selectedId === option.id;
          const isCorrect = isSelected && option.id === activity.correctAnswer;
          const isWrong = isSelected && option.id !== activity.correctAnswer;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={cn(
                'relative min-h-[72px] rounded-2xl font-display font-black text-3xl border-3 shadow-kid transition-all active:scale-95 flex items-center justify-center p-4',
                isSelected
                  ? isCorrect
                    ? 'bg-emerald-100 border-kidSuccess text-emerald-800'
                    : 'bg-red-100 border-red-500 text-red-800'
                  : 'bg-white border-cream-border hover:border-accent text-stone-800 hover:-translate-y-1'
              )}
            >
              {/* Pair the colour feedback with an icon + text so it is not conveyed by colour alone. */}
              {isSelected && (
                <span className="absolute top-2 right-2">
                  {isCorrect ? (
                    <CircleCheck className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <CircleX className="w-5 h-5 text-red-600" />
                  )}
                  <span className="sr-only">{isCorrect ? t('lesson.correct') : t('lesson.incorrect')}</span>
                </span>
              )}
              {option.text}
            </button>
          );
        })}
      </div>
    </div>
  );
};
