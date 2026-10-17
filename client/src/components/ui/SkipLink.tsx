import React from 'react';
import { useT } from '../../i18n/index.js';

/** Keyboard users jump past the header/nav straight to `<main id="main-content">`. Hidden until focused. */
export const SkipLink: React.FC = () => {
  const t = useT();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:inline-flex focus:items-center focus:min-h-[44px] focus:px-5 focus:py-2.5 focus:rounded-full focus:bg-primary focus:text-white focus:font-bold focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
    >
      {t('common.skipToContent')}
    </a>
  );
};
