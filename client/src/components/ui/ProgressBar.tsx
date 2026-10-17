import React from 'react';
import {
  Star,
} from './icons.js';
import { cn } from '../../lib/utils.js';
import { useT } from '../../i18n/index.js';

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
  const t = useT();
  const percentage = Math.min(100, Math.round(((currentStep + 1) / totalSteps) * 100));

  return (
    <div className={cn('w-full flex items-center space-x-3', className)}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-valuenow={currentStep + 1}
        aria-label={t('lesson.progressAria', { current: currentStep + 1, total: totalSteps })}
        className="flex-1 h-5 bg-stone-200 rounded-full overflow-hidden p-1 shadow-inner relative"
      >
        {/* Animate the fill with transform: scaleX (GPU-friendly) instead of width to avoid layout reflow. */}
        <div
          className="h-full w-full origin-left bg-gradient-to-r from-accent to-primary rounded-full transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${percentage / 100})` }}
        />
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
