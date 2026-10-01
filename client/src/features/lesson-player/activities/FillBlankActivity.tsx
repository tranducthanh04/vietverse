import React, { useState } from 'react';
import { cn } from '../../../lib/utils.js';

export interface FillBlankActivityProps {
  activity: {
    id: string;
    prompt: string;
    blanks?: Array<{ sentence: string; missing: string }>;
    options?: Array<{ id: string; text: string }>;
    correctAnswer: string;
  };
  onComplete: (isCorrect: boolean, userAnswer?: any) => void;
}

export const FillBlankActivity: React.FC<FillBlankActivityProps> = ({
  activity,
  onComplete,
}) => {
  const blank = activity.blanks?.[0] || { sentence: '__úp bê', missing: 'B' };
  const [filledLetter, setFilledLetter] = useState<string | null>(null);

  const handleSelect = (letter: string, optionId: string) => {
    setFilledLetter(letter);
    const isCorrect =
      letter.toLowerCase() === blank.missing.toLowerCase() ||
      optionId.toLowerCase() === activity.correctAnswer.toLowerCase();
    onComplete(isCorrect, letter);
  };

  const sentenceParts = blank.sentence.split('__');

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
      <h2 className="text-kid-lg md:text-kid-xl font-display font-bold text-stone-800 mb-8">
        {activity.prompt}
      </h2>

      {/* Word / Sentence display with dashed blank box */}
      <div className="bg-white border-4 border-accent rounded-3xl p-8 shadow-kid flex items-center justify-center space-x-3 mb-10">
        <span className="text-4xl md:text-5xl font-display font-black text-stone-800">
          {sentenceParts[0]}
        </span>

        <div className="w-16 h-20 border-4 border-dashed border-primary rounded-2xl flex items-center justify-center bg-cream text-4xl md:text-5xl font-display font-black text-primary animate-pulse">
          {filledLetter || '?'}
        </div>

        <span className="text-4xl md:text-5xl font-display font-black text-stone-800">
          {sentenceParts[1]}
        </span>
      </div>

      {/* Letter choices */}
      <div className="flex items-center space-x-4">
        {activity.options?.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.text, opt.id)}
            className={cn(
              'w-20 h-20 bg-white border-3 border-cream-border rounded-2xl text-3xl font-display font-black text-stone-800 shadow-kid hover:border-accent hover:bg-accent-light/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center min-h-[58px] min-w-[58px]',
              filledLetter === opt.text && 'border-primary bg-primary-light/30'
            )}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
};
