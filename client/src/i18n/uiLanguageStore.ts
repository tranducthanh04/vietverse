import { create } from 'zustand';

/**
 * Interface languages Vietverse currently ships UI copy for.
 * Learning content (lessons, stories, culture, quizzes) always stays Vietnamese;
 * only chrome/UI strings are translated.
 */
export type UiLanguage = 'vi' | 'en';

export const UI_LANGUAGES: readonly UiLanguage[] = ['vi', 'en'];

export const DEFAULT_UI_LANGUAGE: UiLanguage = 'vi';

const STORAGE_KEY = 'vietverse_ui_language';

export function isUiLanguage(value: unknown): value is UiLanguage {
  return value === 'vi' || value === 'en';
}

/**
 * Map a child's companion (home) language to the interface language.
 *
 * [Quyết định] Chỉ `vi` và `en` có bản dịch giao diện.
 * [Giả định] Các ngôn ngữ đồng hành khác (`ja/ko/zh/fr/other`) chưa có bản dịch
 * giao diện nên tạm dùng `en`; không có lựa chọn `vi` trong ngôn ngữ đồng hành.
 */
export function companionToUiLanguage(companion?: string | null): UiLanguage | null {
  if (!companion) return null;
  // Only `en` has its own UI; every other supported companion language falls back to `en`.
  return 'en';
}

function readStoredLanguage(): UiLanguage | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isUiLanguage(stored) ? stored : null;
  } catch {
    // localStorage can throw (private mode, disabled storage); treat as no preference.
    return null;
  }
}

function writeStoredLanguage(language: UiLanguage | null): void {
  try {
    if (language) {
      localStorage.setItem(STORAGE_KEY, language);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Persisting the preference is best-effort; ignore storage failures.
  }
}

interface UiLanguageState {
  /** The user's explicit choice from the language switcher; `null` means "use the default". */
  manualLanguage: UiLanguage | null;
  /** Record an explicit user choice and remember it for next time. */
  setLanguage: (language: UiLanguage) => void;
  /** Drop the explicit choice and fall back to the computed default. */
  clearManualLanguage: () => void;
}

export const useUiLanguageStore = create<UiLanguageState>((set) => ({
  manualLanguage: readStoredLanguage(),
  setLanguage: (language) => {
    writeStoredLanguage(language);
    set({ manualLanguage: language });
  },
  clearManualLanguage: () => {
    writeStoredLanguage(null);
    set({ manualLanguage: null });
  },
}));
