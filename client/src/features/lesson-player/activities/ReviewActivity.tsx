import React, { useState } from 'react';
import { cn } from '../../../lib/utils.js';

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
                'min-h-[72px] rounded-2xl font-display font-black text-3xl border-3 shadow-kid transition-all active:scale-95 flex items-center justify-center p-4',
                isSelected
                  ? isCorrect
                    ? 'bg-emerald-100 border-kidSuccess text-emerald-800'
                    : 'bg-red-100 border-red-500 text-red-800'
                  : 'bg-white border-cream-border hover:border-accent text-stone-800 hover:-translate-y-1'
              )}
            >
              {option.text}
            </button>
          );
        })}
      </div>
    </div>
  );
};
