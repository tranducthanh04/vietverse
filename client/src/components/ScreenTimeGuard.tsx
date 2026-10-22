import React, { useEffect, useRef, useState } from 'react';
import { useChildStore } from '../store/childStore.js';
import { ScreenTimeLimitModal } from '../features/parent/ScreenTimeLimitModal.js';
import { RestCountdown } from '../features/parent/RestCountdown.js';
import { useT } from '../i18n/index.js';

/** Forced eye break length once the child chooses to rest. */
const REST_DURATION_MS = 5 * 60 * 1000;

const restKey = (childId: string) => `vietverse_rest_until_${childId}`;

/** Read the break deadline for a child; returns null when absent, invalid, expired or unreadable. */
function readRestUntil(childId: string | undefined): number | null {
  if (!childId) return null;
  try {
    const raw = localStorage.getItem(restKey(childId));
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value > Date.now() ? value : null;
  } catch {
    // Storage blocked: the break simply isn't persisted; it still runs in memory.
    return null;
  }
}

function writeRestUntil(childId: string, until: number): void {
  try {
    localStorage.setItem(restKey(childId), String(until));
  } catch {
    // Storage blocked: keep counting in memory, don't crash.
  }
}

function clearRestUntil(childId: string): void {
  try {
    localStorage.removeItem(restKey(childId));
  } catch {
    // Storage blocked: in-memory state is reset by the caller regardless.
  }
}

export const ScreenTimeGuard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { activeChild } = useChildStore();
  const t = useT();
  const childId = activeChild?._id;
  const [isExceeded, setIsExceeded] = useState(() => {
    const limit = activeChild?.screenTimeLimit ?? 20;
    const start = Number(sessionStorage.getItem(`vietverse_session_start_${activeChild?._id}`));
    return limit > 0 && start > 0 && Date.now() - start >= limit * 60000;
  });
  const [restUntil, setRestUntil] = useState<number | null>(() => readRestUntil(childId));
  const sessionStartRef = useRef<number | null>(null);

  // The break deadline is per child; re-read it whenever the active child changes.
  useEffect(() => {
    setRestUntil(readRestUntil(childId));
  }, [childId]);

  useEffect(() => {
    if (!activeChild?._id) return;
    const limit = activeChild.screenTimeLimit ?? 20;
    if (limit <= 0) {
      setIsExceeded(false);
      return;
    }
    const key = `vietverse_session_start_${activeChild._id}`;
    let start = Number(sessionStorage.getItem(key));
    if (!start || Number.isNaN(start)) {
      start = Date.now();
      sessionStorage.setItem(key, String(start));
    }
    sessionStartRef.current = start;
    const check = () => setIsExceeded((Date.now() - (sessionStartRef.current ?? Date.now())) / 60000 >= limit);
    check();
    const interval = window.setInterval(check, 10000);
    return () => {
      window.clearInterval(interval);
      sessionStartRef.current = null;
    };
  }, [activeChild?._id, activeChild?.screenTimeLimit]);

  // Start a fresh continuous-screen-time session for the active child (shared reset mechanism).
  const resetSession = () => {
    if (!activeChild?._id) return;
    const now = Date.now();
    sessionStartRef.current = now;
    sessionStorage.setItem(`vietverse_session_start_${activeChild._id}`, String(now));
    setIsExceeded(false);
  };

  // Parent "add more time" at the limit prompt: just extend the current session.
  const extend = () => {
    resetSession();
  };

  // Child chose to take the break: start the 5-minute countdown, persisted per child.
  const startRest = () => {
    if (!childId) return;
    const until = Date.now() + REST_DURATION_MS;
    writeRestUntil(childId, until);
    setRestUntil(until);
  };

  // Break over (timer elapsed) or a parent unlocked early: clear the break and start a new session.
  const endRest = () => {
    if (childId) clearRestUntil(childId);
    setRestUntil(null);
    resetSession();
  };

  const isResting = restUntil !== null && restUntil > Date.now();

  return (
    <>
      {!isExceeded && !isResting && children}
      {isResting ? (
        <RestCountdown
          isOpen
          restUntil={restUntil as number}
          onComplete={endRest}
          onParentUnlock={endRest}
        />
      ) : (
        <ScreenTimeLimitModal
          isOpen={isExceeded}
          childName={activeChild?.name || t('screenTime.childFallback')}
          limitMinutes={activeChild?.screenTimeLimit ?? 20}
          onExtendSession={extend}
          onRest={startRest}
        />
      )}
    </>
  );
};
