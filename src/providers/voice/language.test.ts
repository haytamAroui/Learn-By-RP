import { describe, expect, it } from 'vitest';
import { pickBestNativeVoice, resolveSpeechLocale } from './language';

describe('speech locale resolution', () => {
  it('maps target languages to concrete native locales', () => {
    expect(resolveSpeechLocale('es')).toBe('es-ES');
    expect(resolveSpeechLocale('fr')).toBe('fr-FR');
    expect(resolveSpeechLocale('de')).toBe('de-DE');
    expect(resolveSpeechLocale('it')).toBe('it-IT');
    expect(resolveSpeechLocale('ja')).toBe('ja-JP');
    expect(resolveSpeechLocale('nl')).toBe('nl-BE');
  });

  it('honours an explicit locale override', () => {
    expect(resolveSpeechLocale('fr', 'fr-BE')).toBe('fr-BE');
    expect(resolveSpeechLocale('en', 'en_us')).toBe('en-US');
  });
});

describe('native voice selection', () => {
  const voices = [
    {
      identifier: 'fr-default',
      language: 'fr-FR',
      name: 'French Default',
      quality: 'Default',
      isDefault: true,
    },
    {
      identifier: 'fr-enhanced',
      language: 'fr-FR',
      name: 'French Enhanced',
      quality: 'Enhanced',
      localService: true,
    },
    {
      identifier: 'fr-ca-enhanced',
      language: 'fr-CA',
      name: 'French Canada',
      quality: 'Enhanced',
    },
    {
      identifier: 'en-enhanced',
      language: 'en-US',
      name: 'English',
      quality: 'Enhanced',
    },
  ];

  it('prefers an exact enhanced locale voice', () => {
    expect(pickBestNativeVoice(voices, 'fr-FR')?.identifier).toBe('fr-enhanced');
  });

  it('falls back to the same base language when the exact locale is absent', () => {
    expect(
      pickBestNativeVoice(
        voices.filter(voice => voice.language !== 'fr-FR'),
        'fr-BE'
      )?.identifier
    ).toBe('fr-ca-enhanced');
  });

  it('prefers an exact Belgian Dutch voice over Netherlands Dutch', () => {
    const dutchVoices = [
      {
        identifier: 'nl-nl-enhanced',
        language: 'nl-NL',
        name: 'Dutch Netherlands',
        quality: 'Enhanced',
      },
      {
        identifier: 'nl-be-default',
        language: 'nl-BE',
        name: 'Dutch Belgium',
        quality: 'Default',
      },
    ];

    expect(pickBestNativeVoice(dutchVoices, 'nl-BE')?.identifier).toBe(
      'nl-be-default'
    );
  });

  it('does not substitute Netherlands Dutch when Belgian Dutch is requested', () => {
    expect(
      pickBestNativeVoice(
        [{
          identifier: 'nl-nl-only',
          language: 'nl-NL',
          name: 'Dutch Netherlands',
          quality: 'Enhanced',
        }],
        'nl-BE'
      )
    ).toBeNull();
  });

  it('does not select an unrelated language', () => {
    expect(
      pickBestNativeVoice(
        voices.filter(voice => voice.language.startsWith('en')),
        'ja-JP'
      )
    ).toBeNull();
  });
});
