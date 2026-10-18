import { supportLanguages, type SupportLanguage } from "./content.types.js";

// Each new position points to its original row; null marks a newly added row.
export type SourceRowOrder = readonly (number | null)[];

export function remapTranslationRows<T extends Record<string, string | string[] | undefined>>(
  translations: Partial<Record<SupportLanguage, T>> | undefined,
  field: keyof T,
  order?: SourceRowOrder,
): Partial<Record<SupportLanguage, T>> | undefined {
  if (!translations || !order) return translations;
  const next = { ...translations };
  for (const lang of supportLanguages) {
    const entry = translations[lang];
    const rows = entry?.[field];
    if (!entry || !Array.isArray(rows)) continue;
    const mapped = order.map((index) => index === null ? "" : (rows[index] ?? ""));
    const updated = { ...entry, [field]: mapped };
    if (!mapped.some((text) => text.trim())) delete updated[field];
    if (Object.keys(updated).length) next[lang] = updated;
    else delete next[lang];
  }
  return next;
}
