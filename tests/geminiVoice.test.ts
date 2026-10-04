import { describe, expect, it } from 'vitest';
import {
  geminiCatalogLocales,
  pickGeminiVoiceForLocale,
} from '../server/providers/geminiVoice';

describe('Gemini voice selection by lesson locale', () => {
  const catalog = [
    { id: 'SpanishSpainVoice', language_code: 'es-ES' },
    { id: 'SpanishMexicoVoice', language_code: 'es-MX' },
    { id: 'FrenchVoice', language_code: 'fr-FR' },
    { id: 'DutchNetherlandsVoice', language_code: 'nl-NL' },
    { id: 'EnglishVoice', language_code: 'en-GB' },
  ];

  it('queries the requested region before a supported same-language fallback', () => {
    expect(geminiCatalogLocales('nl-BE')).toEqual(['nl-BE', 'nl-NL']);
    expect(geminiCatalogLocales('es-ES')).toEqual(['es-ES']);
  });

  it('selects the exact regional voice when the catalog has one', () => {
    expect(pickGeminiVoiceForLocale(catalog, 'es-ES')).toBe('SpanishSpainVoice');
    expect(pickGeminiVoiceForLocale(catalog, 'es-MX')).toBe('SpanishMexicoVoice');
  });

  it('falls back within the requested language for an unavailable region', () => {
    expect(pickGeminiVoiceForLocale(catalog, 'nl-BE')).toBe('DutchNetherlandsVoice');
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
