import React, { useState } from 'react';
import { Moon, Sparkles, HeartHandshake, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { ParentGateModal } from './ParentGateModal.js';

export interface ScreenTimeLimitModalProps {
  isOpen: boolean;
  childName: string;
  limitMinutes: number;
  onExtendSession: () => void;
  onRest: () => void;
}

export const ScreenTimeLimitModal: React.FC<ScreenTimeLimitModalProps> = ({
  isOpen,
  childName,
  limitMinutes,
  onExtendSession,
  onRest,
}) => {
  const [showGate, setShowGate] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-lg w-full p-8 text-center shadow-2xl border-4 border-indigo-200 relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-100 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-100 rounded-full blur-2xl pointer-events-none" />

          {/* Mascot / Icon Badge */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg relative">
            <Moon className="w-12 h-12" />
            <Sparkles className="w-6 h-6 absolute top-2 right-2 text-yellow-300 animate-pulse" />
          </div>

          <h2 className="text-2xl md:text-3xl font-black font-display text-indigo-950 mb-3">
            Đến giờ cho mắt nghỉ ngơi! 👀✨
          </h2>

          <p className="text-stone-600 text-base md:text-lg mb-6 leading-relaxed">
            Bé <strong className="text-indigo-900">{childName}</strong> ơi, bé đã học tập chăm chỉ suốt{' '}
            <span className="font-black text-indigo-600">{limitMinutes} phút</span> rồi đấy!
            Hãy đứng dậy, vươn vai và nhìn ra cửa sổ thật xa để bảo vệ đôi mắt sáng tinh anh nhé!
          </p>

          <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 mb-6 text-sm text-indigo-900 flex items-center justify-center space-x-2">
            <HeartHandshake className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <span>Mẹo nhỏ: Uống một ngụm nước ấm và chớp mắt 10 lần bé nha!</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowGate(true)}
              className="flex-1 border-indigo-300 text-indigo-900 hover:bg-indigo-50 py-3 rounded-2xl font-bold flex items-center justify-center space-x-1.5"
            >
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Ba mẹ mở thêm giờ</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={onRest}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-2xl font-black shadow-md"
            >
              Bé đi nghỉ ngơi thôi
            </Button>
          </div>
        </div>
      </div>

      {showGate && (
        <ParentGateModal
          isOpen={showGate}
          onClose={() => setShowGate(false)}
          onSuccess={() => {
            setShowGate(false);
            onExtendSession();
          }}
        />
      )}
    </>
  );
};
