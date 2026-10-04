export interface GeminiCatalogVoice {
  id?: string;
  language_code?: string;
  context?: string;
  gender?: 'female' | 'male' | 'neutral' | string;
}

export function localeVoiceEnvironmentKey(locale: string, gender?: string): string {
  const localeKey = normalizeLocale(locale).replace(/[^a-z0-9]+/gi, '_').toUpperCase();
  const genderKey = gender ? `_${gender.toUpperCase()}` : '';
  return `GEMINI_TTS_VOICE_${localeKey}${genderKey}`;
}

const FALLBACK_CATALOG_LOCALE: Record<string, string> = {
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  ja: 'ja-JP',
  en: 'en-GB',
};

export function geminiCatalogLocales(locale: string): string[] {
  const normalized = normalizeLocale(locale);
  const language = normalized.split('-')[0];
  const fallback = FALLBACK_CATALOG_LOCALE[language];
  return fallback && fallback.toLowerCase() !== normalized.toLowerCase()
    ? [normalized, fallback]
    : [normalized];
}

function normalizeLocale(locale: string): string {
  const [language, region] = locale.replace('_', '-').split('-');
  if (!language) return '';
  return region
    ? `${language.toLowerCase()}-${region.toUpperCase()}`
    : language.toLowerCase();
}

/**
 * Prefer a Gemini catalog voice authored for the requested locale. If the
 * library has no exact regional entry, the caller uses a multilingual voice and
 * directs its accent through speech metadata; it never substitutes nl-NL for
 * the learner's requested nl-BE locale.
 */
export function pickGeminiVoiceForLocale(
  voices: GeminiCatalogVoice[],
  locale: string,
  voiceGender?: string
): string | undefined {
  const desired = normalizeLocale(locale);
  const language = desired.split('-')[0];
  const candidates = voices
    .filter(voice =>
      voice.id &&
      voice.language_code &&
      (!voiceGender || voice.gender?.toLowerCase() === voiceGender.toLowerCase())
    )
    .map(voice => ({ voice, locale: normalizeLocale(voice.language_code!) }));

  return (
    candidates.find(candidate => candidate.locale === desired)?.voice.id ||
    (desired !== 'nl-BE'
      ? candidates.find(candidate => candidate.locale.split('-')[0] === language)?.voice.id
      : undefined)
  );
}
