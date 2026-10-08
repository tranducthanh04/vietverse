import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChildStore } from '../store/childStore.js';
import { ScreenTimeLimitModal } from '../features/parent/ScreenTimeLimitModal.js';

export const ScreenTimeGuard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const { activeChild } = useChildStore();
  const [isExceeded, setIsExceeded] = useState(() => {
    const limit = activeChild?.screenTimeLimit ?? 20;
    const start = Number(sessionStorage.getItem(`vietverse_session_start_${activeChild?._id}`));
    return limit > 0 && start > 0 && Date.now() - start >= limit * 60000;
  });
  const sessionStartRef = useRef<number | null>(null);

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

  const extend = () => {
    if (!activeChild?._id) return;
    const now = Date.now();
    sessionStartRef.current = now;
    sessionStorage.setItem(`vietverse_session_start_${activeChild._id}`, String(now));
    setIsExceeded(false);
  };

  return (
    <>
      {!isExceeded && children}
      <ScreenTimeLimitModal
        isOpen={isExceeded}
        childName={activeChild?.name || 'Bé'}
        limitMinutes={activeChild?.screenTimeLimit ?? 20}
        onExtendSession={extend}
        onRest={() => navigate('/kham-pha')}
      />
    </>
  );
};
