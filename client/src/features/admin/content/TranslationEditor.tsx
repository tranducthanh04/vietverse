import React from "react";
import {
  supportLanguages,
  supportLanguageLabels,
  type SupportLanguage,
} from "./content.types.js";

type TranslationEntry = Record<string, string | string[] | undefined>;
export type Translations = Partial<Record<SupportLanguage, TranslationEntry>>;
export type TranslationSection =
  | { kind: "text"; key: string; label: string; multiline?: boolean }
  | { kind: "list"; key: string; label: string; source: string[] };

// Per-language, collapsible inputs for reviewed translations. Fields are optional; arrays are kept
// index-parallel to the Vietnamese source (padded with empty strings) so the child view can line
// each translated fact/line/word up with its original.
export function TranslationEditor({
  translations,
  onChange,
  sections,
}: {
  translations: Translations;
  onChange: (next: Translations) => void;
  sections: TranslationSection[];
}) {
  const setEntry = (lang: SupportLanguage, entry: TranslationEntry) =>
    onChange({ ...translations, [lang]: entry });
  const setText = (lang: SupportLanguage, key: string, text: string) =>
    setEntry(lang, { ...translations[lang], [key]: text });
  const setListItem = (
    lang: SupportLanguage,
    key: string,
    index: number,
    text: string,
  ) => {
    const current = (translations[lang]?.[key] as string[] | undefined) ?? [];
    const next = [...current];
    while (next.length <= index) next.push("");
    next[index] = text;
    setEntry(lang, { ...translations[lang], [key]: next });
  };
  return (
    <fieldset>
      <legend>Bản dịch theo ngôn ngữ hỗ trợ</legend>
      <p className="cms-meta">
        Tùy chọn. Hiển thị dưới tiếng Việt cho bé theo ngôn ngữ hỗ trợ đã chọn;
        tiếng Việt vẫn là nội dung chính. Để trống nếu chưa có bản dịch được
        duyệt.
      </p>
      {supportLanguages.map((lang) => {
        const entry = translations[lang] ?? {};
        return (
          <details key={lang} className="cms-translation">
            <summary>{supportLanguageLabels[lang]}</summary>
            {sections.map((section) => {
              const base = `translations.${lang}.${section.key}`;
              if (section.kind === "text") {
                const value = (entry[section.key] as string | undefined) ?? "";
                const label = `${supportLanguageLabels[lang]} · ${section.label}`;
                return (
                  <div className="cms-field" key={section.key}>
                    <label className="cms-field-label">
                      <span>{label}</span>
                      {section.multiline ? (
                        <textarea
                          name={base}
                          rows={3}
                          value={value}
                          onChange={(e) =>
                            setText(lang, section.key, e.target.value)
                          }
                        />
                      ) : (
                        <input
                          name={base}
                          value={value}
                          onChange={(e) =>
                            setText(lang, section.key, e.target.value)
                          }
                        />
                      )}
                    </label>
                  </div>
                );
              }
              const values =
                (entry[section.key] as string[] | undefined) ?? [];
              return (
                <fieldset key={section.key}>
                  <legend>{`${supportLanguageLabels[lang]} · ${section.label}`}</legend>
                  {section.source.length === 0 && (
                    <p className="cms-meta">
                      Chưa có nội dung tiếng Việt để dịch.
                    </p>
                  )}
                  {section.source.map((sourceText, index) => (
                    <div className="cms-field" key={index}>
                      <label className="cms-field-label">
                        <span>{`${supportLanguageLabels[lang]} · ${section.label} ${index + 1}`}</span>
                        <input
                          name={`${base}.${index}`}
                          placeholder={sourceText}
                          value={values[index] ?? ""}
                          onChange={(e) =>
                            setListItem(lang, section.key, index, e.target.value)
                          }
                        />
                      </label>
                    </div>
                  ))}
                </fieldset>
              );
            })}
          </details>
        );
      })}
    </fieldset>
  );
}

const hasValue = (value: string | string[] | undefined) =>
  Array.isArray(value)
    ? value.some((item) => item?.trim())
    : typeof value === "string" && Boolean(value.trim());

// Read-only rendering of every filled translation, for the admin preview page.
export function TranslationPreview({
  translations,
  sections,
}: {
  translations?: Translations;
  sections: { key: string; label: string; list?: boolean }[];
}) {
  const languages = supportLanguages.filter((lang) => {
    const entry = translations?.[lang];
    return Boolean(entry) && sections.some((s) => hasValue(entry![s.key]));
  });
  if (!languages.length) return null;
  return (
    <section>
      <h2>Bản dịch theo ngôn ngữ hỗ trợ</h2>
      {languages.map((lang) => {
        const entry = translations![lang]!;
        return (
          <div key={lang} lang={lang}>
            <h3>{supportLanguageLabels[lang]}</h3>
            {sections.map((section) => {
              const value = entry[section.key];
              if (section.list && Array.isArray(value)) {
                return value
                  .filter((item) => item?.trim())
                  .map((item, index) => (
                    <p key={`${section.key}-${index}`} className="whitespace-pre-wrap">
                      {item}
                    </p>
                  ));
              }
              if (!section.list && typeof value === "string" && value.trim()) {
                return (
                  <p key={section.key} className="whitespace-pre-wrap">
                    {value}
                  </p>
                );
              }
              return null;
            })}
          </div>
        );
      })}
    </section>
  );
}
