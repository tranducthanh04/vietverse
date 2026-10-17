import React from 'react';
import { useT, useUiLanguage, type UiLanguage } from '../../i18n/index.js';

const OPTIONS: ReadonlyArray<{ code: UiLanguage; short: string; ariaKey: 'toVietnamese' | 'toEnglish' }> = [
  { code: 'vi', short: 'VI', ariaKey: 'toVietnamese' },
  { code: 'en', short: 'EN', ariaKey: 'toEnglish' },
];

export interface LanguageSwitcherProps {
  className?: string;
}

/**
 * VI / EN interface-language toggle. Each option is a ≥44px touch target with an
 * `aria-label`, and `aria-pressed` reflects the active language. Choosing a
 * language records an explicit preference that is remembered across sessions.
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const t = useT();
  const { language, setLanguage } = useUiLanguage();

  return (
    <div
      role="group"
      aria-label={t('language.switchAria')}
      className={`inline-flex items-center rounded-full border-2 border-cream-border bg-white p-0.5 shadow-sm ${className}`}
    >
      {OPTIONS.map((option) => {
        const isActive = language === option.code;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLanguage(option.code)}
            aria-pressed={isActive}
            aria-label={t(`language.${option.ariaKey}`)}
            className={`min-h-[44px] min-w-[44px] rounded-full px-2.5 text-xs font-black transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              isActive ? 'bg-primary text-white shadow-sm' : 'text-stone-500 hover:text-primary'
            }`}
          >
            {option.short}
          </button>
        );
      })}
    </div>
  );
};
