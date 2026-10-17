export { vi, type Dictionary } from './vi.js';
export { en } from './en.js';
export {
  createTranslator,
  type Translate,
  type TKey,
  type TranslateVars,
} from './translator.js';
export { useT, useUiLanguage, type UiLanguageController } from './useT.js';
export {
  useUiLanguageStore,
  companionToUiLanguage,
  isUiLanguage,
  UI_LANGUAGES,
  DEFAULT_UI_LANGUAGE,
  type UiLanguage,
} from './uiLanguageStore.js';
