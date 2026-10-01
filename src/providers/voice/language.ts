export interface NativeVoiceDescriptor {
  identifier: string;
  language: string;
  name: string;
  quality?: string;
  localService?: boolean;
  isDefault?: boolean;
}

const DEFAULT_LOCALES: Record<string, string> = {
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  ja: 'ja-JP',
  nl: 'nl-BE',
  en: 'en-GB',
};

function normalizeLocale(locale: string): string {
  const [language, region] = locale.replace('_', '-').split('-');
  if (!region) return language.toLowerCase();
  return `${language.toLowerCase()}-${region.toUpperCase()}`;
}

export function resolveSpeechLocale(
  languageCode: string,
  preferredLocale?: string
): string {
  if (preferredLocale?.trim()) return normalizeLocale(preferredLocale.trim());
  const normalized = languageCode.trim().toLowerCase();
  return DEFAULT_LOCALES[normalized] ?? normalizeLocale(languageCode);
}

export function pickBestNativeVoice(
  voices: NativeVoiceDescriptor[],
  locale: string
): NativeVoiceDescriptor | null {
  if (!voices.length) return null;

  const desired = normalizeLocale(locale);
  const base = desired.split('-')[0];

  const scored = voices
    .map(voice => {
      const voiceLocale = normalizeLocale(voice.language || '');
      const voiceBase = voiceLocale.split('-')[0];
      let score = 0;

      if (voiceLocale === desired) score += 100;
      else if (voiceBase === base) score += 60;
      else return { voice, score: -1 };

      if (String(voice.quality).toLowerCase() === 'enhanced') score += 20;
      if (voice.localService) score += 5;
      if (voice.isDefault) score += 2;

      return { voice, score };
    })
    .filter(candidate => candidate.score >= 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.voice ?? null;
}
