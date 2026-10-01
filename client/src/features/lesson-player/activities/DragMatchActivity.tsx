import React, { useState } from 'react';
import { cn } from '../../../lib/utils.js';
import { CheckCircle2 } from 'lucide-react';

export interface DragMatchActivityProps {
  activity: {
    id: string;
    prompt: string;
    pairs?: Array<{ left: string; right: string }>;
  };
  onComplete: (isCorrect: boolean, userAnswer?: any) => void;
}

export const DragMatchActivity: React.FC<DragMatchActivityProps> = ({
  activity,
  onComplete,
}) => {
  const pairs = activity.pairs || [];
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});

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
      // Wrong match: brief shake or reset
      setSelectedLeft(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
      <h2 className="text-kid-lg md:text-kid-xl font-display font-bold text-stone-800 mb-6">
        {activity.prompt}
      </h2>

      <div className="grid grid-cols-2 gap-8 w-full max-w-lg">
        {/* Left Column */}
        <div className="flex flex-col space-y-4">
          <span className="font-bold text-stone-500 text-sm uppercase tracking-wider">Cột từ</span>
          {pairs.map((p) => {
            const isMatched = !!matchedPairs[p.left];
            const isSelected = selectedLeft === p.left;

            return (
              <button
                key={p.left}
                onClick={() => handleSelectLeft(p.left)}
                disabled={isMatched}
                className={cn(
                  'h-16 px-4 rounded-2xl font-display font-bold text-kid-base flex items-center justify-between transition-all border-3 shadow-sm select-none',
                  isMatched
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800 opacity-80'
                    : isSelected
                    ? 'bg-accent border-accent-dark text-stone-900 scale-105 shadow-md ring-4 ring-accent/30'
                    : 'bg-white border-cream-border hover:border-accent text-stone-800'
                )}
              >
                <span>{p.left}</span>
                {isMatched && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </button>
            );
          })}
        </div>

        {/* Right Column (shuffled order or fixed for kid ergonomics) */}
        <div className="flex flex-col space-y-4">
          <span className="font-bold text-stone-500 text-sm uppercase tracking-wider">Ý nghĩa / Hình ảnh</span>
          {pairs.map((p) => {
            const isMatched = Object.values(matchedPairs).includes(p.right);

            return (
              <button
                key={p.right}
                onClick={() => handleSelectRight(p.right)}
                disabled={isMatched}
                className={cn(
                  'h-16 px-4 rounded-2xl font-display font-bold text-kid-base flex items-center justify-between transition-all border-3 shadow-sm select-none',
                  isMatched
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800 opacity-80'
                    : selectedLeft
                    ? 'bg-white border-accent hover:bg-accent-light/40 text-stone-800 scale-102 cursor-pointer'
                    : 'bg-white border-cream-border text-stone-800'
                )}
              >
                <span>{p.right}</span>
                {isMatched && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
