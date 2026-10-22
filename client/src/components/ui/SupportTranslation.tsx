import React from "react";
import { useChildStore } from "../../store/childStore.js";

export interface SupportTranslationProps<T> {
  /**
   * The content's translations map keyed by language code (`en`, `ja`, …), as returned by the API.
   * Entries are typed loosely on purpose: `T` is inferred from `select` alone, so one map holding
   * different fields per language (e.g. `en` has fun facts, `ja` only an intro) still type-checks.
   */
  translations?: Partial<Record<string, object>> | null;
  /** Pulls the translated string for one language entry (e.g. the intro, or one fun fact by index). */
  select: (entry: T) => string | null | undefined;
  /** Layout/typography classes for the rendered line; a secondary-text default applies when omitted. */
  className?: string;
}

/**
 * Renders the reviewed translation of one piece of Vietnamese text in the first of the active
 * child's `companionLanguages` (priority order, `other` and `vi` skipped) that actually has a
 * translation.
 * When no child is selected or no companion language has one, it renders nothing — Vietnamese stays
 * the primary text. The output carries the correct `lang` attribute for assistive technology.
 */
export function SupportTranslation<T>({
  translations,
  select,
  className,
}: SupportTranslationProps<T>) {
  const activeChild = useChildStore((state) => state.activeChild);
  if (!translations) return null;
  const preferred = activeChild?.companionLanguages?.length
    ? activeChild.companionLanguages
    : activeChild?.companionLanguage
      ? [activeChild.companionLanguage]
      : [];
  for (const lang of preferred) {
    // `other` has no reviewed translation; `vi` is the source content itself, so both are skipped.
    if (lang === "other" || lang === "vi") continue;
    const entry = translations[lang];
    const text = entry ? select(entry as T)?.trim() : undefined;
    if (text) {
      return (
        <span
          lang={lang}
          className={className ?? "mt-1 block text-sm text-stone-500"}
        >
          {text}
        </span>
      );
    }
  }
  return null;
}
