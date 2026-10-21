import React, { useEffect, useRef, useState } from 'react';
import {
  Moon,
  Sparkles,
  HeartHandshake,
  ShieldCheck,
} from '../../components/ui/icons.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { ParentGateModal } from './ParentGateModal.js';
import { useT } from '../../i18n/index.js';

export interface RestCountdownProps {
  isOpen: boolean;
  /** Epoch milliseconds when the break ends. */
  restUntil: number;
  /** Called once when the break time has fully elapsed. */
  onComplete: () => void;
  /** Called when a parent clears the break early through the Parent Gate. */
  onParentUnlock: () => void;
}

/** Format remaining milliseconds as `m:ss`, never below `0:00`. */
function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Forced eye-break screen with a live `m:ss` countdown.
 *
 * The clock is read from `Date.now()` against `restUntil` on every tick, so a backgrounded tab or a
 * reload keeps the remaining time accurate instead of drifting with accumulated intervals. There is
 * no close button and Escape is a no-op (`onClose` does nothing); only a parent can end the break
 * early through the Parent Gate.
 */
export const RestCountdown: React.FC<RestCountdownProps> = ({
  isOpen,
  restUntil,
  onComplete,
  onParentUnlock,
}) => {
  const t = useT();
  const [showGate, setShowGate] = useState(false);
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, restUntil - Date.now()));
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isOpen) return;
    let fired = false;
    const tick = () => {
      const left = Math.max(0, restUntil - Date.now());
      setRemainingMs(left);
      if (left <= 0 && !fired) {
        fired = true;
        onCompleteRef.current();
      }
    };
    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [isOpen, restUntil]);

  if (!isOpen) return null;

  // The visible clock updates every second but is hidden from assistive tech; the polite live region
  // below carries a minute-granular message so screen readers announce once a minute, not each second.
  const minutesLeft = Math.ceil(remainingMs / 60000);
  const announcement = minutesLeft > 1
    ? t('screenTime.restAnnounce', { minutes: minutesLeft })
    : t('screenTime.restAnnounceFinal');

  return (
    <>
      {/* No close button; Escape is a no-op so the break cannot be skipped. */}
      <Modal
        isOpen={isOpen}
        onClose={() => {}}
        hideCloseBtn
        role="alertdialog"
        ariaLabel={t('screenTime.restDialogAria')}
        className="bg-white border-accent rounded-3xl p-0 text-center"
      >
        <div className="relative isolate overflow-hidden rounded-[inherit] p-8">
          <div className="absolute -z-10 -top-16 -right-16 w-40 h-40 bg-primary-light rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -z-10 -bottom-16 -left-16 w-40 h-40 bg-accent-light rounded-full blur-2xl pointer-events-none" />

          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-tr from-culture to-culture-hover text-white flex items-center justify-center shadow-lg relative">
            <Moon className="w-12 h-12" />
            <Sparkles className="w-6 h-6 absolute top-2 right-2 text-accent animate-pulse" />
          </div>

          <h2 className="text-2xl md:text-3xl font-black font-display text-primary mb-3">
            {t('screenTime.restTitle')}
          </h2>

          <p className="text-stone-600 text-base md:text-lg mb-6 leading-relaxed">
            {t('screenTime.restBody')}
          </p>

          {/* Big visible timer: hidden from assistive tech to avoid per-second announcements. */}
          <div aria-hidden="true" className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              {t('screenTime.restTimeLeftLabel')}
            </div>
            <div className="text-5xl md:text-6xl font-black font-display text-primary tabular-nums">
              {formatRemaining(remainingMs)}
            </div>
          </div>

          {/* Polite live region: content only changes once a minute. */}
          <div className="sr-only" aria-live="polite">
            {announcement}
          </div>

          <div className="bg-cream-muted border border-cream-border rounded-2xl p-4 mb-6 text-sm text-on-surface-variant flex items-center justify-center space-x-2">
            <HeartHandshake className="w-5 h-5 text-primary flex-shrink-0" />
            <span>{t('screenTime.tip')}</span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowGate(true)}
            className="w-full py-3 rounded-2xl font-bold flex items-center justify-center space-x-1.5"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{t('screenTime.extend')}</span>
          </Button>
        </div>
      </Modal>

      {showGate && (
        <ParentGateModal
          isOpen={showGate}
          onClose={() => setShowGate(false)}
          onSuccess={() => {
            setShowGate(false);
            onParentUnlock();
          }}
        />
      )}
    </>
  );
};
