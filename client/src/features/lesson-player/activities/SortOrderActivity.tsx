import React, { useState } from 'react';
import {
  RotateCcw,
} from '../../../components/ui/icons.js';
import { useT } from '../../../i18n/index.js';

export interface SortOrderActivityProps {
  activity: {
    id: string;
    prompt: string;
    orderedItems?: string[];
    correctAnswer?: string[];
  };
  onComplete: (isCorrect: boolean, userAnswer?: any) => void;
}

export const SortOrderActivity: React.FC<SortOrderActivityProps> = ({
  activity,
  onComplete,
}) => {
  const t = useT();
  const targetOrder = activity.correctAnswer || activity.orderedItems || ['C', 'Á'];
  // Shuffle items for kid challenge
  const [availableItems, setAvailableItems] = useState<string[]>(() => {
    return [...targetOrder].reverse();
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSelectItem = (item: string, index: number) => {
    const newSelected = [...selectedItems, item];
    const newAvailable = availableItems.filter((_, i) => i !== index);

    setSelectedItems(newSelected);
    setAvailableItems(newAvailable);

    if (newSelected.length === targetOrder.length) {
      const isCorrect = newSelected.every((val, i) => val === targetOrder[i]);
      onComplete(isCorrect, newSelected);
    }
  };

  const handleReset = () => {
    setSelectedItems([]);
    setAvailableItems([...targetOrder].reverse());
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-xl w-full mx-auto">
      <h2 className="text-kid-lg md:text-kid-xl font-display font-bold text-stone-800 mb-8">
        {activity.prompt}
      </h2>

      {/* Assembly line / Result boxes. Tiles grow with the word and wrap long text so nothing is clipped. */}
      <div className="w-full flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-white border-4 border-accent-light rounded-3xl p-4 sm:p-6 shadow-sm min-h-[100px] mb-8">
        {targetOrder.map((_, idx) => (
          <div
            key={idx}
            className="min-w-[4.5rem] max-w-full min-h-14 sm:min-h-16 px-3 py-2 border-3 border-dashed border-stone-300 rounded-2xl inline-flex items-center justify-center bg-cream text-xl sm:text-2xl font-display font-black text-primary shadow-inner text-center whitespace-normal break-words"
          >
            {selectedItems[idx] || ''}
          </div>
        ))}
      </div>

      {/* Available choices. min-h keeps a ≥44px touch target; the tile widens/wraps to fit the word. */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        {availableItems.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectItem(item, idx)}
            className="min-w-[4.5rem] max-w-full min-h-14 sm:min-h-16 px-4 py-2 inline-flex items-center justify-center text-center whitespace-normal break-words bg-white border-3 border-cream-border rounded-2xl text-xl sm:text-2xl font-display font-black text-stone-800 shadow-kid hover:border-accent active:translate-y-1 active:shadow-none transition-[border-color,box-shadow,transform] motion-reduce:transition-none"
          >
            {item}
          </button>
        ))}
      </div>

      {selectedItems.length > 0 && selectedItems.length < targetOrder.length && (
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-sm font-bold text-stone-500 hover:text-stone-800 min-h-[44px] px-3"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t('lesson.reorder')}</span>
        </button>
      )}
    </div>
  );
};
