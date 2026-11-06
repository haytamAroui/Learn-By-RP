import { api } from '../../lib/api';
import type { SynthesizedAudio } from '../runtime/contracts';
import type { VoiceGender } from '../../types';
import { resolveSpeechLocale } from './language';
import { splitIntoSpeechChunks } from './speechChunks';
import type { VoiceTransport } from './types';
import type { VisemeCue } from './visemes';

export interface SpeakCharacterOptions {
  language: string;
  locale?: string;
  speed?: number;
  style?: string;
  voice?: string;
  voiceGender?: VoiceGender;
  /** Session ownership guard evaluated again after asynchronous synthesis. */
  canPlay?: () => boolean;
}

interface CachedSpeech {
  audio: SynthesizedAudio;
  visemes: VisemeCue[];
}

const MAX_AUDIO_CACHE_ITEMS = 20;
const audioCache = new Map<string, CachedSpeech>();

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

function rememberAudio(key: string, cached: CachedSpeech) {
  if (audioCache.has(key)) audioCache.delete(key);
  audioCache.set(key, cached);

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
  if (options.canPlay && !options.canPlay()) return;
  const locale = resolveSpeechLocale(options.language, options.locale);

  const key = cacheKey(text, options, locale);
  const cached = audioCache.get(key);

  if (cached) {
    await transport.playSpeech(text, {
      audioBase64: cached.audio.base64,
      mimeType: cached.audio.mimeType,
      speed: options.speed,
      lang: options.language,
      locale,
      visemes: cached.visemes,
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
      const visemes = result.visemes ?? [];
      rememberAudio(key, { audio: result.audio, visemes });
      if (options.canPlay && !options.canPlay()) return;
      await transport.playSpeech(text, {
        audioBase64: result.audio.base64,
        mimeType: result.audio.mimeType,
        speed: options.speed,
        lang: options.language,
        locale,
        visemes,
      });
      return;
    }
  } catch (error) {
    // Native speech is an intentional resilience layer, not an error state.
    console.warn('Cloud speech unavailable; using native voice:', error);
  }

  if (options.canPlay && !options.canPlay()) return;
  await transport.playSpeech(text, {
    speed: options.speed,
    lang: options.language,
    locale,
  });
}

/**
 * Speak a line in pieces, so the first sound is heard early.
 *
 * The server hands over each piece as it is synthesised. Pieces are queued on
 * the transport, so they play back to back while the later ones are still
 * being prepared. The line keeps one start and one end, and the mouth clock
 * runs across the whole line.
 *
 * A stream that fails is not an error state: the line is spoken through the
 * single-clip path instead.
 */
export async function speakStreamedWithBestAvailable(
  transport: VoiceTransport,
  text: string,
  options: SpeakCharacterOptions
): Promise<void> {
  if (options.canPlay && !options.canPlay()) return;
  const locale = resolveSpeechLocale(options.language, options.locale);

  // A line that fits in one piece gains nothing from a stream, and the
  // single-clip path keeps the audio cache warm for replays.
  if (splitIntoSpeechChunks(text).length <= 1) {
    await speakWithBestAvailable(transport, text, options);
    return;
  }

  const pending: Array<Promise<void>> = [];
  let spoken = 0;

  try {
    await api.synthesizeSpeechStream(
      {
        text,
        language: options.language,
        locale,
        speed: 1,
        style: options.style,
        voice: options.voice,
        voiceGender: options.voiceGender,
      },
      chunk => {
        spoken += 1;
        pending.push(
          transport.enqueueSpeech(chunk.text, {
            audioBase64: chunk.audioBase64,
            mimeType: chunk.mimeType,
            speed: options.speed,
            lang: options.language,
            locale,
            visemes: chunk.visemes,
            chunkOffsetMs: chunk.offsetMs,
          })
        );
      }
    );
  } catch (error) {
    console.warn('Streamed speech unavailable; using the single-clip path:', error);
    if (spoken === 0) {
      await speakWithBestAvailable(transport, text, options);
      return;
    }
  }

  if (spoken === 0) {
    await speakWithBestAvailable(transport, text, options);
    return;
  }

  await Promise.all(pending);
}

/** Test hook; the cache is intentionally process-local and never persisted. */
export function clearSpeechAudioCache() {
  audioCache.clear();
}
