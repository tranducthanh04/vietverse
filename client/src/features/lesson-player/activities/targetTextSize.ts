/**
 * Tailwind type scale for a lesson's target text. Cards hold anything from one letter to a full
 * sentence, so the size steps down with length to keep the text inside its card on phones.
 */
export const targetTextSize = (text: string) =>
  text.length <= 3
    ? 'text-7xl md:text-8xl tracking-wider'
    : text.length <= 12
      ? 'text-5xl md:text-6xl'
      : text.length <= 32
        ? 'text-3xl md:text-4xl leading-tight'
        : 'text-kid-lg md:text-kid-xl leading-snug';
