import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

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

export function formatPoints(points: number = 0): string {
  return new Intl.NumberFormat('vi-VN').format(points);
}
