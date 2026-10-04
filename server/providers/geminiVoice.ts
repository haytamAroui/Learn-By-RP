export interface GeminiCatalogVoice {
  id?: string;
  language_code?: string;
  context?: string;
}

const FALLBACK_CATALOG_LOCALE: Record<string, string> = {
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  ja: 'ja-JP',
  nl: 'nl-NL',
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
 * Prefer a Gemini catalog voice authored for the requested locale. When that
 * exact region is not in the catalog (for example nl-BE), keep the language
 * correct and let the speech style direct the regional accent.
 */
export function pickGeminiVoiceForLocale(
  voices: GeminiCatalogVoice[],
  locale: string
): string | undefined {
  const desired = normalizeLocale(locale);
  const language = desired.split('-')[0];
  const candidates = voices
    .filter(voice => voice.id && voice.language_code)
    .map(voice => ({ voice, locale: normalizeLocale(voice.language_code!) }));

  return (
    candidates.find(candidate => candidate.locale === desired)?.voice.id ||
    candidates.find(candidate => candidate.locale.split('-')[0] === language)?.voice.id
  );
}
