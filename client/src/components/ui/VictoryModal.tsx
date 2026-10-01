import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, Award, ArrowRight, RotateCcw, MapPin, Sparkles } from 'lucide-react';
import { Modal } from './Modal.js';
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
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#b02518', '#fea619', '#00855b', '#0284c7', '#ffdad4'],
        });
      } catch (err) {
        // Safe fallback in headless or non-canvas env
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onBackToMap} hideCloseBtn className="max-w-lg text-center p-8 bg-surface-container-lowest border-4 border-secondary-container/40 rounded-3xl shadow-2xl">
      {/* Celebration Mascot Badge */}
      <div className="flex justify-center -mt-20 mb-3">
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-secondary-fixed ring-8 ring-secondary-container/30 shadow-xl flex items-center justify-center">
          <img
            alt="Sao Lí Lắc"
            className="w-full h-full object-cover animate-bounce-subtle"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuACRIKtBgTG9wCgUeSYdyWpma7WYksVA2By9zjzUZxgvQNqG-5quighNiQxXB0OJzqvLPYs54owlcewfvrgMPHqCmKQfGTls5UmT_2_wSa6MDuQLq5Qzq9BivE3mfi9KCo01y07vYxdjaA8a6K1hDT51Ijl_7_DyuP-H3k7GkCh7uJ9b1bbTcHiKa1Y-12L4zuFM7GDTy_VoL8TxCtbXPDUWzH5YKOSDPyw3Jx2BPMrrNlLEM42-wID"
          />
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold uppercase tracking-wider mb-2">
        <Sparkles className="w-3.5 h-3.5 text-secondary" />
        <span>HOÀN THÀNH XUẤT SẮC!</span>
      </div>

      <h2 className="text-3xl font-display font-black text-primary mb-2">
        {VI_LOCALES.victory.congrats}
      </h2>
      <p className="text-sm text-on-surface-variant max-w-sm mx-auto mb-4 font-medium">
        Bé đã rất nỗ lực vượt qua các hoạt động bài học hôm nay!
      </p>

      {/* 3 Bouncing Stars */}
      <div className="flex justify-center items-center gap-3 my-4">
        {[1, 2, 3].map((starIdx) => {
          const isFilled = starIdx <= stars;
          return (
            <div
              key={starIdx}
              className="transform transition-all duration-500 scale-110"
              style={{ animationDelay: `${starIdx * 150}ms` }}
            >
              <Star
                className={`w-14 h-14 ${
                  isFilled
                    ? 'fill-secondary text-secondary animate-pop drop-shadow-md'
                    : 'text-outline-variant/40'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Points & Badges Won */}
      <div className="bg-secondary-fixed/50 border-2 border-secondary-container/40 rounded-2xl p-5 my-4 shadow-inner">
        <div className="flex items-center justify-center gap-2 text-secondary font-display font-extrabold text-2xl">
          <Award className="w-8 h-8 text-secondary-container" />
          <span>+{pointsEarned} ViVi Points</span>
        </div>
        <p className="text-xs text-on-secondary-fixed font-bold mt-1">
          Tổng kho báu hiện tại: <span className="text-primary font-black text-sm">{totalPoints} điểm</span>
        </p>
      </div>

      {/* 3D Action Buttons */}
      <div className="flex flex-col gap-3 mt-6">
        {onNextLesson && (
          <button
            onClick={onNextLesson}
            className="btn-3d-primary w-full h-14 rounded-full font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>{VI_LOCALES.victory.btnNextLesson}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}

        <div className="flex gap-3">
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="flex-1 h-12 rounded-full border-2 border-outline-variant/60 bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{VI_LOCALES.victory.btnPlayAgain}</span>
            </button>
          )}

          <button
            onClick={onBackToMap}
            className="btn-3d-accent flex-1 h-12 rounded-full font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <MapPin className="w-4 h-4" />
            <span>{VI_LOCALES.victory.btnBackMap}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
