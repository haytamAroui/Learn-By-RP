/**
 * Choosing a voice for the Edge speech provider.
 *
 * The app speaks in the target language with a chosen voice gender, and the
 * provider names voices by locale. The mapping is kept here, away from the
 * provider, so the choice can be inspected and tested without a network call.
 */
export interface EdgeVoice {
  /** The provider's short name, for example `nl-BE-LotteNeural`. */
  shortName: string;
  locale: string;
  gender: 'female' | 'male';
}

const VOICES: readonly EdgeVoice[] = [
  { shortName: 'nl-BE-LotteNeural', locale: 'nl-BE', gender: 'female' },
  { shortName: 'nl-BE-GerritNeural', locale: 'nl-BE', gender: 'male' },
  { shortName: 'nl-NL-ColetteNeural', locale: 'nl-NL', gender: 'female' },
  { shortName: 'nl-NL-MaartenNeural', locale: 'nl-NL', gender: 'male' },
  { shortName: 'fr-FR-DeniseNeural', locale: 'fr-FR', gender: 'female' },
  { shortName: 'fr-FR-HenriNeural', locale: 'fr-FR', gender: 'male' },
  { shortName: 'fr-BE-CharlineNeural', locale: 'fr-BE', gender: 'female' },
  { shortName: 'fr-BE-GaspardNeural', locale: 'fr-BE', gender: 'male' },
  { shortName: 'en-GB-SoniaNeural', locale: 'en-GB', gender: 'female' },
  { shortName: 'en-GB-RyanNeural', locale: 'en-GB', gender: 'male' },
  { shortName: 'en-US-AriaNeural', locale: 'en-US', gender: 'female' },
  { shortName: 'en-US-GuyNeural', locale: 'en-US', gender: 'male' },
  { shortName: 'es-ES-ElviraNeural', locale: 'es-ES', gender: 'female' },
  { shortName: 'es-ES-AlvaroNeural', locale: 'es-ES', gender: 'male' },
  { shortName: 'de-DE-KatjaNeural', locale: 'de-DE', gender: 'female' },
  { shortName: 'de-DE-ConradNeural', locale: 'de-DE', gender: 'male' },
  { shortName: 'it-IT-ElsaNeural', locale: 'it-IT', gender: 'female' },
  { shortName: 'it-IT-DiegoNeural', locale: 'it-IT', gender: 'male' },
];

const FALLBACK_VOICES: Record<'female' | 'male', EdgeVoice> = {
  female: { shortName: 'en-US-AriaNeural', locale: 'en-US', gender: 'female' },
  male: { shortName: 'en-US-GuyNeural', locale: 'en-US', gender: 'male' },
};

function normalize(locale: string): string {
  const [language, region] = locale.replace('_', '-').split('-');
  if (!language) return '';
  return region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language.toLowerCase();
}

/**
 * The voice for a locale and a voice gender.
 *
 * The exact regional voice is preferred. A voice for the same language in
 * another region is used next, and a neutral voice is the last resort: a
 * learner who asked for Belgian Dutch is never answered in Netherlands Dutch
 * when a Belgian voice exists.
 */
export function pickEdgeVoice(locale: string, voiceGender?: string): EdgeVoice {
  const wanted = normalize(locale);
  const gender = voiceGender?.toLowerCase() === 'male' ? 'male' : 'female';
  if (!wanted) return FALLBACK_VOICES[gender];

  const language = wanted.split('-')[0];

  const exact = VOICES.find(
    voice => voice.locale === wanted && voice.gender === gender
  );
  if (exact) return exact;

  const sameLanguage = VOICES.find(
    voice => voice.locale.split('-')[0] === language && voice.gender === gender
  );
  if (sameLanguage) return sameLanguage;

  const anyGender = VOICES.find(voice => voice.locale === wanted);
  if (anyGender) return anyGender;

  return FALLBACK_VOICES[gender];
}
