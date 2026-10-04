import { api } from '../../lib/api';
import type { SynthesizedAudio } from '../runtime/contracts';
import type { VoiceGender } from '../../types';
import { resolveSpeechLocale } from './language';
import type { VoiceTransport } from './types';

export interface SpeakCharacterOptions {
  language: string;
  locale?: string;
  speed?: number;
  style?: string;
  voice?: string;
  voiceGender?: VoiceGender;
}

const MAX_AUDIO_CACHE_ITEMS = 20;
const audioCache = new Map<string, SynthesizedAudio>();

function cacheKey(text: string, options: SpeakCharacterOptions, locale: string): string {
  return [
    options.language,
    locale,
    options.voice || '',
    options.voiceGender || '',
    options.style || '',
    text,
  ].join('\u241f');
}

function rememberAudio(key: string, audio: SynthesizedAudio) {
  if (audioCache.has(key)) audioCache.delete(key);
  audioCache.set(key, audio);

  while (audioCache.size > MAX_AUDIO_CACHE_ITEMS) {
    const oldest = audioCache.keys().next().value;
    if (oldest === undefined) break;
    audioCache.delete(oldest);
  }
}

/**
 * One output policy for the whole app:
 * 1. reuse provider audio already synthesized in this app session,
 * 2. ask the configured server speech provider (Gemini today),
 * 3. play provider audio when available,
 * 4. fall back to the best matching on-device voice for the target locale.
 *
 * Cloud failure is deliberately non-fatal: a TTS outage must never break a
 * roleplay turn or erase the transcript.
 */
export async function speakWithBestAvailable(
  transport: VoiceTransport,
  text: string,
  options: SpeakCharacterOptions
): Promise<void> {
  const locale = resolveSpeechLocale(options.language, options.locale);

  const key = cacheKey(text, options, locale);
  const cached = audioCache.get(key);

  if (cached) {
    await transport.playSpeech(text, {
      audioBase64: cached.base64,
      mimeType: cached.mimeType,
      speed: options.speed,
      lang: options.language,
      locale,
    });
    return;
  }

  try {
    const result = await api.synthesizeSpeech({
      text,
      language: options.language,
      locale,
      // Generate at a natural provider pace and use local playback rate for
      // repeated slow/fast listening. This lets one cached audio clip serve
      // normal playback and learner-controlled replay.
      speed: 1,
      style: options.style,
      voice: options.voice,
      voiceGender: options.voiceGender,
    });

    if (result.audio?.base64) {
      rememberAudio(key, result.audio);
      await transport.playSpeech(text, {
        audioBase64: result.audio.base64,
        mimeType: result.audio.mimeType,
        speed: options.speed,
        lang: options.language,
        locale,
      });
      return;
    }
  } catch (error) {
    // Native speech is an intentional resilience layer, not an error state.
    console.warn('Cloud speech unavailable; using native voice:', error);
  }

  await transport.playSpeech(text, {
    speed: options.speed,
    lang: options.language,
    locale,
  });
}

/** Test hook; the cache is intentionally process-local and never persisted. */
export function clearSpeechAudioCache() {
  audioCache.clear();
}
