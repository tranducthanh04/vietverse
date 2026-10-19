import React, { useRef, useState } from 'react';
import { cn } from '../../../lib/utils.js';
import { WrongAnswerFeedback, type WrongAnswerFeedbackHandle } from './WrongAnswerFeedback.js';

export interface FillBlankActivityProps {
  activity: {
    id: string;
    prompt: string;
    audioUrl?: string;
    blanks?: Array<{ sentence: string; missing: string }>;
    options?: Array<{ id: string; text: string }>;
    correctAnswer: string;
    wrongHint?: string;
    wrongHintTranslations?: Partial<Record<string, { wrongHint?: string }>>;
  };
  onComplete: (isCorrect: boolean, userAnswer?: any) => void;
}

export const FillBlankActivity: React.FC<FillBlankActivityProps> = ({
  activity,
  onComplete,
}) => {
  const blank = activity.blanks?.[0] || { sentence: '__úp bê', missing: 'B' };
  const [filledLetter, setFilledLetter] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const feedbackRef = useRef<WrongAnswerFeedbackHandle>(null);
  const canReplay = Boolean(activity.audioUrl);

  const handleSelect = (letter: string, optionId: string) => {
    setFilledLetter(letter);
    const isCorrect =
      letter.toLowerCase() === blank.missing.toLowerCase() ||
      optionId.toLowerCase() === activity.correctAnswer.toLowerCase();
    setWrong(!isCorrect);
    if (!isCorrect && canReplay) feedbackRef.current?.replay();
    onComplete(isCorrect, letter);
  };

  const sentenceParts = blank.sentence.split(/_{2,}/);

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-xl w-full mx-auto">
      <h2 className="text-kid-lg md:text-kid-xl font-display font-bold text-stone-800 mb-8">
        {activity.prompt}
      </h2>

      <WrongAnswerFeedback ref={feedbackRef} show={wrong} activity={activity} canReplay={canReplay} />

      {/* Word / Sentence display with dashed blank box */}
      <div className="w-full bg-white border-4 border-accent rounded-3xl px-5 py-6 sm:p-8 shadow-kid flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mb-8 sm:mb-10">
        <span className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-stone-800 break-words">
          {sentenceParts[0]}
        </span>

        <div className="shrink-0 min-w-[3.5rem] sm:min-w-[4rem] max-w-full min-h-16 sm:min-h-20 px-2 border-4 break-words text-center border-dashed border-primary rounded-2xl flex items-center justify-center bg-cream text-3xl sm:text-4xl md:text-5xl font-display font-black text-primary animate-pulse">
          {filledLetter || '?'}
        </div>

        <span className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-stone-800 break-words">
          {sentenceParts[1]}
        </span>
      </div>

      {/* Letter choices */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {activity.options?.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.text, opt.id)}
            className={cn(
              'min-w-[4.5rem] max-w-full min-h-16 sm:min-h-20 px-4 py-2 bg-white border-3 border-cream-border rounded-2xl text-2xl sm:text-3xl font-display font-black text-stone-800 shadow-kid hover:border-accent hover:bg-accent-light/40 active:translate-y-1 active:shadow-none transition-[background-color,border-color,box-shadow,transform] motion-reduce:transition-none flex items-center justify-center text-center whitespace-normal break-words',
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
