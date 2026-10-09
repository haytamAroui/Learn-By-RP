import type { LanguageCode, UiLanguage } from '../../types';

/** Active practice is Belgian Dutch; legacy language records remain readable. */
export const ACTIVE_LEARNING_LANGUAGE: LanguageCode = 'nl';

export const ACTIVE_UI_LANGUAGES = ['en', 'fr', 'nl'] as const;

export function normalizeLearningLanguage(_value: unknown): LanguageCode {
  return ACTIVE_LEARNING_LANGUAGE;
}

export function normalizeUiLanguage(value: unknown): UiLanguage {
  if (typeof value !== 'string') return 'en';
  const normalized = value.toLowerCase().slice(0, 2);
  return normalized === 'fr' || normalized === 'nl' ? normalized : 'en';
}
