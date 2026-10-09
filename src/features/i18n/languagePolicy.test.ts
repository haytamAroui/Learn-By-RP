import { describe, expect, it } from 'vitest';
import {
  ACTIVE_UI_LANGUAGES,
  normalizeLearningLanguage,
  normalizeUiLanguage,
} from './languagePolicy';

describe('active language policy', () => {
  it('offers only English, French, and Dutch UI languages', () => {
    expect(ACTIVE_UI_LANGUAGES).toEqual(['en', 'fr', 'nl']);
  });

  it('keeps Belgian Dutch as the only active practice language', () => {
    expect(normalizeLearningLanguage('es')).toBe('nl');
    expect(normalizeLearningLanguage('nl')).toBe('nl');
  });

  it('maps old or unsupported UI preferences to English safely', () => {
    expect(normalizeUiLanguage('es')).toBe('en');
    expect(normalizeUiLanguage('de')).toBe('en');
    expect(normalizeUiLanguage('fr-FR')).toBe('fr');
    expect(normalizeUiLanguage('nl-BE')).toBe('nl');
  });
});
