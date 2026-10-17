import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore } from '../store/childStore.js';
import { ScreenTimeGuard } from './ScreenTimeGuard.js';
import { useT } from '../i18n/index.js';

export const ChildSessionGuard: React.FC<React.PropsWithChildren<{ screenTime?: boolean }>> = ({ children, screenTime = true }) => {
  const userId = useAuthStore((state) => state.user?.id);
  const userRole = useAuthStore((state) => state.user?.role);
  const location = useLocation();
  const { activeChild, fetchChildren } = useChildStore();
  const t = useT();
  const [error, setError] = useState<unknown>(null);
  const [loadedUser, setLoadedUser] = useState<string>();
  const [retry, setRetry] = useState(0);

  const isAdminPreview = userRole === 'admin' && location.pathname.startsWith('/hoc/') &&
    new URLSearchParams(location.search).get('preview') === 'true';

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoadedUser(undefined);
    if (userId && !isAdminPreview) {
      fetchChildren().then(() => {
        if (!cancelled) setLoadedUser(userId);
      }).catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoadedUser(userId);
        }
      });
    }
    return () => { cancelled = true; };
  }, [userId, retry, fetchChildren, isAdminPreview]);

  if (isAdminPreview) return <>{children}</>;

  if (!userId || loadedUser !== userId) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-stone-700">{t('childGuard.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <p role="alert" className="text-red-700 font-bold mb-4">{t('childGuard.loadError')}</p>
        <button onClick={() => setRetry((value) => value + 1)} className="px-5 py-3 rounded-2xl bg-primary text-white font-bold min-h-[44px]">
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (!activeChild) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-primary mb-3">{t('childGuard.createTitle')}</h1>
        <p className="text-stone-600 mb-5">{t('childGuard.createDesc')}</p>
        <Link to="/bat-dau" className="px-5 py-3 rounded-2xl bg-primary text-white font-bold min-h-[44px]">{t('childGuard.createBtn')}</Link>
      </div>
    );
  }

  return screenTime ? <ScreenTimeGuard>{children}</ScreenTimeGuard> : <>{children}</>;
};
