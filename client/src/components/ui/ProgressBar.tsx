import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  className,
}) => {
  const percentage = Math.min(100, Math.round(((currentStep + 1) / totalSteps) * 100));

  return (
    <div className={cn('w-full flex items-center space-x-3', className)}>
      <div className="flex-1 h-5 bg-stone-200 rounded-full overflow-hidden p-1 shadow-inner relative">
        <div
          className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-1"
          style={{ width: `${percentage}%` }}
        >
          <div className="w-2.5 h-2.5 bg-white/70 rounded-full animate-ping" />
        </div>
      </div>

      <div className="flex items-center space-x-1 font-display font-bold text-primary text-base">
        <Star className="w-5 h-5 fill-accent text-accent animate-bounce-subtle" />
        <span>
          {currentStep + 1}/{totalSteps}
        </span>
      </div>
    </div>
  );
};
