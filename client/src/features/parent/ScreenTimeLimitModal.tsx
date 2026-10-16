import React, { useState } from 'react';
import {
  Moon,
  Sparkles,
  HeartHandshake,
  ShieldCheck,
} from '../../components/ui/icons.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
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
      {/* Forced rest screen: no close button and Escape is a no-op so the break can't be skipped. */}
      <Modal
        isOpen={isOpen}
        onClose={() => {}}
        hideCloseBtn
        role="alertdialog"
        ariaLabel="Đến giờ cho mắt nghỉ ngơi!"
        className="bg-white border-accent rounded-3xl p-0 text-center"
      >
        {/* Inner wrapper fills the dialog and clips the decorative glows to its rounded corners. */}
        <div className="relative isolate overflow-hidden rounded-[inherit] p-8">
          {/* Decorative Background */}
          <div className="absolute -z-10 -top-16 -right-16 w-40 h-40 bg-primary-light rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -z-10 -bottom-16 -left-16 w-40 h-40 bg-accent-light rounded-full blur-2xl pointer-events-none" />

          {/* Mascot / Icon Badge */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-tr from-culture to-culture-hover text-white flex items-center justify-center shadow-lg relative">
            <Moon className="w-12 h-12" />
            <Sparkles className="w-6 h-6 absolute top-2 right-2 text-accent animate-pulse" />
          </div>

          <h2 className="text-2xl md:text-3xl font-black font-display text-primary mb-3">
            Đến giờ cho mắt nghỉ ngơi!
          </h2>

          <p className="text-stone-600 text-base md:text-lg mb-6 leading-relaxed">
            Bé <strong className="text-primary">{childName}</strong> ơi, bé đã học tập chăm chỉ suốt{' '}
            <span className="font-black text-primary">{limitMinutes} phút</span> rồi đấy!
            Hãy đứng dậy, vươn vai và nhìn ra cửa sổ thật xa để bảo vệ đôi mắt sáng tinh anh nhé!
          </p>

          <div className="bg-cream-muted border border-cream-border rounded-2xl p-4 mb-6 text-sm text-on-surface-variant flex items-center justify-center space-x-2">
            <HeartHandshake className="w-5 h-5 text-primary flex-shrink-0" />
            <span>Mẹo nhỏ: Uống một ngụm nước ấm và chớp mắt 10 lần bé nha!</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowGate(true)}
              className="flex-1 py-3 rounded-2xl font-bold flex items-center justify-center space-x-1.5"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Ba mẹ mở thêm giờ</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={onRest}
              className="flex-1 py-3 rounded-2xl font-black"
            >
              Bé đi nghỉ ngơi thôi
            </Button>
          </div>
        </div>
      </Modal>

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
