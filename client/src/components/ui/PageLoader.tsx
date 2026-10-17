import React from 'react';
import { useT } from '../../i18n/index.js';

/** Full-page fallback while a lazily loaded route chunk downloads (same look as ProtectedRoute). */
export const PageLoader: React.FC = () => {
  const t = useT();
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <span className="text-stone-600 font-bold font-display text-sm">{t('common.loading')}</span>
      </div>
    </div>
  );
};
