import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import type { UiLanguage } from '../i18n/uiLanguageStore.js';

// Teach tailwind-merge the custom font sizes from tailwind.config.js. Without this it treats
// e.g. `text-kid-base` as a text colour and drops `text-white` from the same element.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-hero', 'display-hero-mobile', 'headline-lg', 'headline-md', 'headline-sm',
            'title-md', 'body-lg', 'body-md', 'body-sm', 'label-lg', 'label-md', 'label-sm',
            'kid-sm', 'kid-base', 'kid-lg', 'kid-xl', 'kid-2xl',
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Number-grouping locale for each interface language (Vietnamese uses `.`, English uses `,`). */
const POINTS_LOCALE: Record<UiLanguage, string> = { vi: 'vi-VN', en: 'en-US' };

/**
 * Format a ViVi Points amount with thousands grouping for the given interface
 * language. Defaults to Vietnamese so callers without a language handy (and
 * existing behaviour) stay unchanged.
 */
export function formatPoints(points: number = 0, language: UiLanguage = 'vi'): string {
  return new Intl.NumberFormat(POINTS_LOCALE[language] ?? POINTS_LOCALE.vi).format(points);
}
