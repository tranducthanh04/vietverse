import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { VI_LOCALES } from '../../locales/vi.js';

export interface ParentGateModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const ParentGateModal: React.FC<ParentGateModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
}) => {
  const [num1, setNum1] = useState(7);
  const [num2, setNum2] = useState(8);
  const [userAnswer, setUserAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Generate random multiplication question (between 4 and 9)
      const n1 = Math.floor(Math.random() * 6) + 4;
      const n2 = Math.floor(Math.random() * 6) + 4;
      setNum1(n1);
      setNum2(n2);
      setUserAnswer('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = num1 * num2;
    if (parseInt(userAnswer.trim(), 10) === expected) {
      // Store unlock timestamp for 15 minutes
      sessionStorage.setItem('vietverse_parent_gate_unlocked', (Date.now() + 15 * 60 * 1000).toString());
      onSuccess();
    } else {
      setErrorMsg(VI_LOCALES.parentGate.errorWrongAnswer);
      setUserAnswer('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={VI_LOCALES.parentGate.modalTitle} className="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <p className="text-stone-600 text-sm mb-6">
          {VI_LOCALES.parentGate.modalDesc}
        </p>

        {errorMsg && (
          <div className="w-full flex items-center space-x-2 bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 mb-4 text-sm font-bold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="w-full">
          {/* Math challenge */}
          <div className="bg-cream-muted border-2 border-cream-border rounded-2xl p-4 mb-6 text-center">
            <span className="text-2xl font-black font-display text-stone-800">
              {num1} × {num2} = ?
            </span>
          </div>

          <input
            type="number"
            autoFocus
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder={VI_LOCALES.parentGate.inputPlaceholder}
            className="w-full text-center text-xl font-bold p-3 rounded-2xl border-2 border-cream-border focus:border-primary focus:outline-none mb-6 min-h-[48px]"
          />

          <div className="flex space-x-3">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Đóng
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {VI_LOCALES.parentGate.btnConfirm}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
