import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { pickEdgeVoice } from '../../src/providers/voice/edgeVoices';
import type {
  SpeechSynthesisRequest,
  SpeechSynthesisResponse,
  SpeechWordTiming,
} from '../../src/providers/runtime/contracts';

const TICKS_PER_MS = 10000;

const GEMINI_TO_EDGE_VOICE_MAP: Record<string, string> = {
  Kore: 'nl-BE-DenaNeural',
  Aoede: 'nl-BE-DenaNeural',
  Despina: 'nl-BE-DenaNeural',
  Autonoe: 'nl-BE-DenaNeural',
  Leda: 'nl-BE-DenaNeural',
  Zephyr: 'nl-BE-DenaNeural',
  Puck: 'nl-BE-ArnaudNeural',
  Charon: 'nl-BE-ArnaudNeural',
  Fenrir: 'nl-BE-ArnaudNeural',
};

interface VoiceAcoustics {
  pitch: string;
  rateOffset: number;
}

const VOICE_ACOUSTIC_PROFILES: Record<string, VoiceAcoustics> = {
  // Female Belgian Dutch personalities
  Kore: { pitch: '+0%', rateOffset: 2 }, // Crisp, authoritative VRT newscaster
  Aoede: { pitch: '-3%', rateOffset: -4 }, // Warm, melodic, friendly Ghent barista
  Leda: { pitch: '+9%', rateOffset: 5 }, // Young, bright, modern
  Zephyr: { pitch: '-5%', rateOffset: -8 }, // Soft, calming, peaceful
  Autonoe: { pitch: '+5%', rateOffset: 0 }, // Friendly neighbour in Leuven
  Despina: { pitch: '-1%', rateOffset: -2 }, // Attentive pharmacist in Hasselt

  // Male Belgian Dutch personalities
  Puck: { pitch: '+6%', rateOffset: 4 }, // Energetic Antwerp courier / bike rental
  Charon: { pitch: '-14%', rateOffset: -5 }, // Deep, mature, warm Bruges waiter
  Fenrir: { pitch: '-6%', rateOffset: 2 }, // Resonant, authoritative Brussels officer
};

/**
 * The Edge read-aloud voice.
 *
 * It is the same voice the browser uses to read a page aloud. There is no
 * account and no daily limit, and it reports where every word is spoken, which
 * is what the avatar needs to move its mouth in step with the voice.
 */
export class EdgeTtsProvider {
  readonly id = 'edge';
  readonly speechModel = 'edge-read-aloud';
  /** The provider streams, so a line can be spoken one sentence at a time. */
  readonly streaming = true;

  private tts: MsEdgeTTS | null = null;
  private voice = '';

  async synthesize(request: SpeechSynthesisRequest): Promise<SpeechSynthesisResponse> {
    const rawVoice = request.voice;
    const mappedVoice = rawVoice && GEMINI_TO_EDGE_VOICE_MAP[rawVoice] ? GEMINI_TO_EDGE_VOICE_MAP[rawVoice] : rawVoice;
    const isDirectEdgeVoice = typeof mappedVoice === 'string' && mappedVoice.includes('-');
    const voice = isDirectEdgeVoice
      ? { shortName: mappedVoice, locale: request.locale || request.language, gender: (request.voiceGender === 'male' ? 'male' : 'female') as 'male' | 'female' }
      : pickEdgeVoice(request.locale || request.language, request.voiceGender);
    const tts = await this.ensureVoice(voice.shortName);

    const acoustics = (rawVoice && VOICE_ACOUSTIC_PROFILES[rawVoice]) ? VOICE_ACOUSTIC_PROFILES[rawVoice] : { pitch: '0%', rateOffset: 0 };
    const { audioStream, metadataStream } = tts.toStream(request.text, {
      rate: rateFor(request.speed, acoustics.rateOffset),
      pitch: acoustics.pitch,
      volume: '0%',
    });

    const [audio, words] = await Promise.all([
      collect(audioStream),
      metadataStream ? collectWords(metadataStream) : Promise.resolve([]),
    ]);
    if (audio.length === 0) {
      throw new Error('Edge TTS returned no audio');
    }

    return {
      audio: {
        provider: 'edge',
        model: this.speechModel,
        voice: voice.shortName,
        base64: audio.toString('base64'),
        mimeType: 'audio/mp3',
        sampleRateHz: 24000,
      },
      fallback: 'none',
      words,
    };
  }

  private async ensureVoice(voiceName: string): Promise<MsEdgeTTS> {
    if (this.tts && this.voice === voiceName) return this.tts;
    this.tts?.close();
    const tts = new MsEdgeTTS({
      enableLogger: false,
      // A blocked or slow service must not hold a turn: the chain falls back to
      // the next provider instead of waiting.
      connectionTimeoutMs: 8000,
      synthesisTimeoutMs: 15000,
    });
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {
      wordBoundaryEnabled: true,
      sentenceBoundaryEnabled: false,
    });
    this.tts = tts;
    this.voice = voiceName;
    return tts;
  }
}

/** A speed multiplier and character offset become a percentage change in speaking rate. */
function rateFor(speed: number | undefined, offsetPercent = 0): string {
  const value = speed ?? 1;
  if (!Number.isFinite(value) || value <= 0) {
    return `${offsetPercent >= 0 ? '+' : ''}${offsetPercent}%`;
  }
  const percent = Math.round((value - 1) * 100) + offsetPercent;
  const clamped = Math.max(-50, Math.min(100, percent));
  return `${clamped >= 0 ? '+' : ''}${clamped}%`;
}

async function collect(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Read the word boundaries out of the metadata stream.
 *
 * Each frame carries the word, and where it starts and how long it lasts, in
 * hundred-nanosecond ticks.
 */
async function collectWords(stream: NodeJS.ReadableStream): Promise<SpeechWordTiming[]> {
  const words: SpeechWordTiming[] = [];

  try {
    for await (const chunk of stream) {
      const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      const marker = 'X-Metadata:';
      const start = text.indexOf(marker);
      if (start === -1) continue;

      const afterMarker = text.slice(start + marker.length);
      const lineEnd = afterMarker.search(/\r\n|\n/);
      const json = lineEnd === -1 ? afterMarker : afterMarker.slice(0, lineEnd);

      try {
        const parsed = JSON.parse(json) as {
          Metadata?: Array<{ Type?: string; Data?: { Text?: string; Length?: number; Offset?: number } }>;
        };
        for (const entry of parsed.Metadata ?? []) {
          if (entry.Type !== 'WordBoundary') continue;
          const data = entry.Data;
          if (!data?.Text) continue;
          words.push({
            text: data.Text,
            offsetMs: Math.round((data.Offset ?? 0) / TICKS_PER_MS),
            durationMs: Math.round((data.Length ?? 0) / TICKS_PER_MS),
          });
        }
      } catch {
        // A frame that is not metadata is not a word.
      }
    }
  } catch {
    // Non-fatal stream closure
  }

  return words;
}
