import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, Award, ArrowRight, RotateCcw, Map } from 'lucide-react';
import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { Mascot } from './Mascot.js';
import { VI_LOCALES } from '../../locales/vi.js';

export interface VictoryModalProps {
  isOpen: boolean;
  stars: number;
  pointsEarned: number;
  totalPoints: number;
  onNextLesson?: () => void;
  onBackToMap: () => void;
  onPlayAgain?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  stars,
  pointsEarned,
  totalPoints,
  onNextLesson,
  onBackToMap,
  onPlayAgain,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire festive kid confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E04836', '#FBBF24', '#10B981', '#38BDF8', '#A855F7'],
        });
      } catch (err) {
        // Safe fallback in headless or non-canvas env
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onBackToMap} hideCloseBtn className="max-w-md text-center p-8">
      <div className="flex justify-center -mt-16 mb-2">
        <Mascot mood="cheering" size="lg" />
      </div>

      <h2 className="text-kid-xl font-display font-extrabold text-primary mb-2 animate-bounce-subtle">
        {VI_LOCALES.victory.congrats}
      </h2>

      {/* 3 Bouncing Stars */}
      <div className="flex justify-center items-center space-x-3 my-6">
        {[1, 2, 3].map((starIdx) => {
          const isFilled = starIdx <= stars;
          return (
            <div
              key={starIdx}
              className="transform transition-all duration-500"
              style={{
                animationDelay: `${starIdx * 150}ms`,
              }}
            >
              <Star
                className={`w-14 h-14 ${
                  isFilled
                    ? 'fill-accent text-accent animate-pop drop-shadow-md'
                    : 'text-stone-300'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Points & Badges Won */}
      <div className="bg-accent-light/50 border-2 border-accent rounded-2xl p-4 my-4">
        <div className="flex items-center justify-center space-x-2 text-stone-800 font-bold text-kid-base">
          <Award className="w-7 h-7 text-accent" />
          <span>+{pointsEarned} ViVi Points</span>
        </div>
        <p className="text-stone-600 text-sm mt-1">
          Tổng kho báu hiện tại: <span className="font-bold text-primary">{totalPoints} điểm</span>
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3 mt-6">
        {onNextLesson && (
          <Button
            variant="primary"
            size="kid"
            onClick={onNextLesson}
            className="w-full flex items-center justify-center space-x-2"
          >
            <span>{VI_LOCALES.victory.btnNextLesson}</span>
            <ArrowRight className="w-6 h-6" />
          </Button>
        )}

        <div className="flex space-x-2">
          {onPlayAgain && (
            <Button
              variant="outline"
              size="md"
              onClick={onPlayAgain}
              className="flex-1 flex items-center justify-center space-x-1"
            >
              <RotateCcw className="w-5 h-5" />
              <span>{VI_LOCALES.victory.btnPlayAgain}</span>
            </Button>
          )}

          <Button
            variant="accent"
            size="md"
            onClick={onBackToMap}
            className="flex-1 flex items-center justify-center space-x-1"
          >
            <Map className="w-5 h-5" />
            <span>{VI_LOCALES.victory.btnBackMap}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
