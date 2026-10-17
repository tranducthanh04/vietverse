import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import {
  ShieldCheck,
  CircleAlert,
  LoaderCircle,
} from '../../components/ui/icons.js';
import { useT } from '../../i18n/index.js';
import { api } from '../../lib/api.js';

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
  const t = useT();
  const [num1, setNum1] = useState(7);
  const [num2, setNum2] = useState(8);
  const [challengeToken, setChallengeToken] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchChallenge = async (preserveError = false) => {
    try {
      setLoadingChallenge(true);
      setChallengeToken('');
      if (!preserveError) setErrorMsg('');
      const res = await api.get('/parent/gate/challenge');
      if (!res.data.data.challengeToken) throw new Error('Missing signed challenge');
      setNum1(res.data.data.num1);
      setNum2(res.data.data.num2);
      setChallengeToken(res.data.data.challengeToken);
      setUserAnswer('');
    } catch {
      setErrorMsg((previous) => [preserveError ? previous : '', t('parentGate.loadError')].filter(Boolean).join(' '));
    } finally {
      setLoadingChallenge(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChallenge();
    }
  }, [isOpen]);

  // The input is disabled while a challenge loads, so autoFocus cannot land on it and Modal focuses the
  // close button instead. Move focus to the answer box once the new challenge is ready (also after a retry).
  const answerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen && challengeToken && !loadingChallenge) answerRef.current?.focus();
  }, [isOpen, challengeToken, loadingChallenge]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken || loadingChallenge || isSubmitting || !userAnswer.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const res = await api.post('/parent/gate/verify', {
        challengeToken,
        answer: parseInt(userAnswer.trim(), 10),
      });

      if (!res.data.data?.gateToken) throw new Error('Missing gate token');
      sessionStorage.setItem('vietverse_parent_gate_token', res.data.data.gateToken);
      sessionStorage.setItem('vietverse_parent_gate_unlocked', (Date.now() + 15 * 60 * 1000).toString());
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || t('parentGate.errorWrongAnswer');
      setErrorMsg(msg);
      setUserAnswer('');
      await fetchChallenge(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('parentGate.modalTitle')} className="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <p className="text-stone-600 text-sm mb-6">
          {t('parentGate.modalDesc')}
        </p>

        {errorMsg && (
          <div role="alert" className="w-full flex items-center space-x-2 bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 mb-4 text-sm font-bold">
            <CircleAlert className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {!challengeToken && !loadingChallenge && <Button type="button" onClick={() => fetchChallenge()} className="mb-4">{t('common.retry')}</Button>}

        <form onSubmit={handleVerify} className="w-full">
          {/* Math challenge */}
          <div className="bg-cream-muted border-2 border-cream-border rounded-2xl p-4 mb-6 text-center">
            <span className="text-2xl font-black font-display text-stone-800">
              {challengeToken ? `${num1} × ${num2} = ?` : loadingChallenge ? t('parentGate.loadingChallenge') : t('parentGate.notReady')}
            </span>
          </div>

          <input
            ref={answerRef}
            type="number"
            aria-label={t('parentGate.inputAriaLabel')}
            disabled={!challengeToken || loadingChallenge || isSubmitting}
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder={loadingChallenge ? t('parentGate.creatingChallenge') : t('parentGate.inputPlaceholder')}
            className="w-full text-center text-xl font-bold p-3 rounded-2xl border-2 border-cream-border placeholder:text-stone-500 focus:border-primary focus:outline-none mb-6 min-h-[48px] disabled:opacity-50"
          />

          <div className="flex space-x-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="flex-1">
              {t('common.close')}
            </Button>
            <Button type="submit" variant="primary" disabled={!challengeToken || loadingChallenge || isSubmitting} className="flex-1 flex items-center justify-center">
              {isSubmitting ? (
                <>
                  <LoaderCircle className="w-5 h-5 animate-spin mr-2" />
                  <span>{t('common.checking')}</span>
                </>
              ) : (
                t('parentGate.btnConfirm')
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
