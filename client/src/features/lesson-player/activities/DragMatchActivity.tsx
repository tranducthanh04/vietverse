import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../../lib/utils.js';
import {
  CircleCheck,
  CircleX,
} from '../../../components/ui/icons.js';
import { PromptTranslation } from './PromptTranslation.js';
import { useT } from '../../../i18n/index.js';

export interface DragMatchActivityProps {
  activity: {
    id: string;
    prompt: string;
    promptTranslations?: Partial<Record<string, string>>;
    pairs?: Array<{ left: string; right: string }>;
  };
  onComplete: (isCorrect: boolean, userAnswer?: any) => void;
}

export const DragMatchActivity: React.FC<DragMatchActivityProps> = ({
  activity,
  onComplete,
}) => {
  const t = useT();
  const pairs = activity.pairs || [];
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  // The right cell that was just mismatched, flashed briefly so the child knows to try again.
  const [wrongRight, setWrongRight] = useState<string | null>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
  }, []);

  const handleSelectLeft = (left: string) => {
    if (matchedPairs[left]) return;
    setSelectedLeft(left);
  };

  const handleSelectRight = (right: string) => {
    if (!selectedLeft) return;

    // Check if this right matches selectedLeft
    const targetPair = pairs.find((p) => p.left === selectedLeft);
    if (targetPair && targetPair.right === right) {
      const newMatches = { ...matchedPairs, [selectedLeft]: right };
      setMatchedPairs(newMatches);
      setSelectedLeft(null);

      if (Object.keys(newMatches).length === pairs.length) {
        onComplete(true, newMatches);
      }
    } else {
      // Wrong match: flash a short, accessible "try again" hint on the chosen cell.
      setSelectedLeft(null);
      setWrongRight(right);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrongRight(null), 600);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-2xl w-full mx-auto">
      <h2 className="text-kid-lg md:text-kid-xl font-display font-bold text-stone-800 mb-6">
        {activity.prompt}
      </h2>
      <PromptTranslation translations={activity.promptTranslations} />

      <div className="grid grid-cols-2 gap-3 sm:gap-8 w-full max-w-lg">
        {/* Left Column */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <span className="font-bold text-stone-500 text-xs sm:text-sm uppercase tracking-wider">{t('lesson.dragLeftHeader')}</span>
          {pairs.map((p) => {
            const isMatched = !!matchedPairs[p.left];
            const isSelected = selectedLeft === p.left;

            return (
              <button
                key={p.left}
                onClick={() => handleSelectLeft(p.left)}
                disabled={isMatched}
                className={cn(
                  'min-h-[4rem] h-full px-3 sm:px-4 py-2 rounded-2xl font-display font-bold flex items-center justify-between gap-2 text-left leading-snug transition-[color,background-color,border-color,box-shadow,opacity] border-3 shadow-sm select-none',
                  isMatched
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800 opacity-80'
                    : isSelected
                    ? 'bg-accent border-accent-dark text-stone-900 shadow-md ring-4 ring-accent/30'
                    : 'bg-white border-cream-border hover:border-accent text-stone-800'
                )}
              >
                <span className="text-kid-base">{p.left}</span>
                {isMatched && <CircleCheck className="w-5 h-5 text-emerald-600" />}
              </button>
            );
          })}
        </div>

        {/* Right Column (shuffled order or fixed for kid ergonomics) */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <span className="font-bold text-stone-500 text-xs sm:text-sm uppercase tracking-wider">{t('lesson.dragRightHeader')}</span>
          {pairs.map((p) => {
            const isMatched = Object.values(matchedPairs).includes(p.right);
            const isWrong = wrongRight === p.right;

            return (
              <button
                key={p.right}
                onClick={() => handleSelectRight(p.right)}
                disabled={isMatched}
                className={cn(
                  'min-h-[4rem] h-full px-3 sm:px-4 py-2 rounded-2xl font-display font-bold flex items-center justify-between gap-2 text-left leading-snug transition-[color,background-color,border-color,opacity] border-3 shadow-sm select-none',
                  isMatched
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800 opacity-80'
                    : isWrong
                    ? 'bg-red-50 border-red-500 text-red-800 animate-wiggle'
                    : selectedLeft
                    ? 'bg-white border-accent hover:bg-accent-light/40 text-stone-800 cursor-pointer'
                    : 'bg-white border-cream-border text-stone-800'
                )}
              >
                <span className="text-base sm:text-kid-sm">{p.right}</span>
                {isMatched && <CircleCheck className="w-5 h-5 text-emerald-600" />}
                {isWrong && <CircleX className="w-5 h-5 text-red-600" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Polite announcement so screen-reader users hear the retry hint for a wrong match. */}
      <span className="sr-only" role="status" aria-live="polite">
        {wrongRight ? t('lesson.tryAgainShort') : ''}
      </span>
    </div>
  );
};
