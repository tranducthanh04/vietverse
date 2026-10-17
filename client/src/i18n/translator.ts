import { vi, type Dictionary } from './vi.js';
import { en } from './en.js';
import type { UiLanguage } from './uiLanguageStore.js';

const dictionaries: Record<UiLanguage, Dictionary> = { vi, en };

/** Every valid `namespace.key` path, derived from the Vietnamese dictionary shape. */
export type TKey = {
  [N in keyof Dictionary]: `${N & string}.${keyof Dictionary[N] & string}`;
}[keyof Dictionary];

export type TranslateVars = Record<string, string | number>;

/** Translator function returned by {@link createTranslator}. */
export type Translate = (key: TKey, vars?: TranslateVars) => string;

function lookup(dictionary: Dictionary, key: TKey): string | undefined {
  const dot = key.indexOf('.');
  const namespace = key.slice(0, dot) as keyof Dictionary;
  const leaf = key.slice(dot + 1);
  const group = dictionary[namespace] as Record<string, string> | undefined;
  return group?.[leaf];
}

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * Build a translator bound to a language. Missing keys fall back to Vietnamese,
 * then to the raw key, so the UI never renders blank.
 */
export function createTranslator(language: UiLanguage): Translate {
  const active = dictionaries[language];
  return (key, vars) => {
    const raw = lookup(active, key) ?? lookup(vi, key) ?? key;
    return interpolate(raw, vars);
  };
}
