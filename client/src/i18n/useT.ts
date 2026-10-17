import { useMemo } from 'react';
import { useChildStore } from '../store/childStore.js';
import {
  companionToUiLanguage,
  useUiLanguageStore,
  type UiLanguage,
} from './uiLanguageStore.js';
import { createTranslator, type Translate } from './translator.js';

export interface UiLanguageController {
  /** The language currently in effect. */
  language: UiLanguage;
  /** Whether the current language comes from an explicit user choice. */
  isManual: boolean;
  /** The language derived from the active child, if any (before the manual override). */
  defaultLanguage: UiLanguage;
  /** Record an explicit user choice (remembered across sessions). */
  setLanguage: (language: UiLanguage) => void;
  /** Drop the explicit choice and return to the computed default. */
  clearManualLanguage: () => void;
}

/**
 * Resolve the effective interface language.
 *
 * Priority: explicit user choice → active child's first companion language → `vi`.
 */
export function useUiLanguage(): UiLanguageController {
  const manualLanguage = useUiLanguageStore((state) => state.manualLanguage);
  const setLanguage = useUiLanguageStore((state) => state.setLanguage);
  const clearManualLanguage = useUiLanguageStore((state) => state.clearManualLanguage);
  const activeChild = useChildStore((state) => state.activeChild);

  const companion = activeChild?.companionLanguages?.[0] ?? activeChild?.companionLanguage;
  const defaultLanguage = companionToUiLanguage(companion) ?? 'vi';
  const language = manualLanguage ?? defaultLanguage;

  return {
    language,
    isManual: manualLanguage !== null,
    defaultLanguage,
    setLanguage,
    clearManualLanguage,
  };
}

/** Return a translator bound to the effective interface language. */
export function useT(): Translate {
  const { language } = useUiLanguage();
  return useMemo(() => createTranslator(language), [language]);
}
