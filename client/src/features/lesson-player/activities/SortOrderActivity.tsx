import React, { useState } from 'react';
import { cn } from '../../../lib/utils.js';
import { RotateCcw } from 'lucide-react';

export interface SortOrderActivityProps {
  activity: {
    id: string;
    prompt: string;
    orderedItems?: string[];
    correctAnswer?: string[];
  };
  onComplete: (isCorrect: boolean) => void;
}

export const SortOrderActivity: React.FC<SortOrderActivityProps> = ({
  activity,
  onComplete,
}) => {
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
      onComplete(isCorrect);
    }
  };

  const handleReset = () => {
    setSelectedItems([]);
    setAvailableItems([...targetOrder].reverse());
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
      <h2 className="text-kid-lg md:text-kid-xl font-display font-bold text-stone-800 mb-8">
        {activity.prompt}
      </h2>

      {/* Assembly line / Result boxes */}
      <div className="flex items-center space-x-3 bg-white border-4 border-accent-light rounded-3xl p-6 shadow-sm min-h-[100px] mb-8">
        {targetOrder.map((_, idx) => (
          <div
            key={idx}
            className="w-16 h-16 border-3 border-dashed border-stone-300 rounded-2xl flex items-center justify-center bg-cream text-3xl font-display font-black text-primary shadow-inner"
          >
            {selectedItems[idx] || ''}
          </div>
        ))}
      </div>

      {/* Available choices */}
      <div className="flex items-center space-x-4 mb-6">
        {availableItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectItem(item, idx)}
            className="w-18 h-18 bg-white border-3 border-cream-border rounded-2xl text-3xl font-display font-black text-stone-800 shadow-kid hover:border-accent hover:scale-105 active:scale-95 transition-all p-4 min-h-[58px] min-w-[58px]"
          >
            {item}
          </button>
        ))}
      </div>

      {selectedItems.length > 0 && selectedItems.length < targetOrder.length && (
        <button
          onClick={handleReset}
          className="flex items-center space-x-1 text-sm font-bold text-stone-500 hover:text-stone-800"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Xếp lại</span>
        </button>
      )}
    </div>
  );
};
