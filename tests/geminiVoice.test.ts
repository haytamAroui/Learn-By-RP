import { describe, expect, it } from 'vitest';
import {
  geminiCatalogLocales,
  localeVoiceEnvironmentKey,
  pickGeminiVoiceForLocale,
} from '../server/providers/geminiVoice';

describe('Gemini voice selection by lesson locale', () => {
  const catalog = [
    { id: 'SpanishSpainVoice', language_code: 'es-ES', gender: 'female' },
    { id: 'SpanishSpainMaleVoice', language_code: 'es-ES', gender: 'male' },
    { id: 'SpanishMexicoVoice', language_code: 'es-MX', gender: 'male' },
    { id: 'FrenchVoice', language_code: 'fr-FR', gender: 'female' },
    { id: 'DutchNetherlandsVoice', language_code: 'nl-NL', gender: 'male' },
    { id: 'EnglishVoice', language_code: 'en-GB', gender: 'female' },
  ];

  it('does not query Netherlands Dutch as a fallback for Belgian Dutch', () => {
    expect(geminiCatalogLocales('nl-BE')).toEqual(['nl-BE']);
    expect(geminiCatalogLocales('es-ES')).toEqual(['es-ES']);
  });

  it('selects the exact regional voice when the catalog has one', () => {
    expect(pickGeminiVoiceForLocale(catalog, 'es-ES')).toBe('SpanishSpainVoice');
    expect(pickGeminiVoiceForLocale(catalog, 'es-MX')).toBe('SpanishMexicoVoice');
  });

  it('selects a locale match whose catalog gender matches the authored character', () => {
    expect(pickGeminiVoiceForLocale(catalog, 'es-ES', 'female')).toBe('SpanishSpainVoice');
    expect(pickGeminiVoiceForLocale(catalog, 'es-ES', 'male')).toBe('SpanishSpainMaleVoice');
  });

  it('refuses a Netherlands Dutch voice when the requested locale is Belgian Dutch', () => {
    expect(pickGeminiVoiceForLocale(catalog, 'nl-BE')).toBeUndefined();
  });

  it('uses locale-specific configuration keys rather than a global voice key', () => {
    expect(localeVoiceEnvironmentKey('es-ES')).toBe('GEMINI_TTS_VOICE_ES_ES');
    expect(localeVoiceEnvironmentKey('nl-BE')).toBe('GEMINI_TTS_VOICE_NL_BE');
    expect(localeVoiceEnvironmentKey('nl-BE', 'female')).toBe('GEMINI_TTS_VOICE_NL_BE_FEMALE');
  });

  it('never chooses a voice from a different language', () => {
    expect(pickGeminiVoiceForLocale(catalog, 'ja-JP')).toBeUndefined();
  });

  it('ignores catalog entries without a usable id or language', () => {
    expect(
      pickGeminiVoiceForLocale(
        [{ id: 'UnlocalizedVoice' }, { language_code: 'fr-FR' }],
        'fr-FR'
      )
    ).toBeUndefined();
  });
});
