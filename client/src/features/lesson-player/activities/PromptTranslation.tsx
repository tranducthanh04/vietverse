import React from 'react';
import { SupportTranslation } from '../../../components/ui/SupportTranslation.js';

/**
 * Renders the reviewed translation of an activity's Vietnamese question, right under it, in the
 * first of the active child's chosen support languages that actually has one. Renders nothing when
 * no child is selected or no chosen language has a translation — Vietnamese stays the only text,
 * and audio/TTS keep reading the Vietnamese question. It reuses the shared `SupportTranslation`
 * language-selection logic (same priority as every other content translation); the flat
 * `{ lang: string }` map is wrapped per entry so that component's object-valued contract holds.
 */
export function PromptTranslation({
  translations,
  className,
}: {
  translations?: Partial<Record<string, string>>;
  className?: string;
}) {
  if (!translations) return null;
  const wrapped = Object.fromEntries(
    Object.entries(translations).map(([lang, text]) => [lang, { text }]),
  );
  return (
    <SupportTranslation
      translations={wrapped}
      select={(entry: { text?: string }) => entry.text}
      className={className ?? '-mt-2 mb-3 block text-kid-sm font-medium text-stone-500'}
    />
  );
}
