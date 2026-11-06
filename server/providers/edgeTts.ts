import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { pickEdgeVoice } from '../../src/providers/voice/edgeVoices';
import type {
  SpeechSynthesisRequest,
  SpeechSynthesisResponse,
  SpeechWordTiming,
} from '../../src/providers/runtime/contracts';

const TICKS_PER_MS = 10000;

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
    const voice = pickEdgeVoice(request.locale || request.language, request.voiceGender);
    const tts = await this.ensureVoice(voice.shortName);

    const { audioStream, metadataStream } = tts.toStream(request.text, {
      rate: rateFor(request.speed),
      pitch: '0%',
      volume: '0%',
    });

    const audio = await collect(audioStream);
    if (audio.length === 0) {
      throw new Error('Edge TTS returned no audio');
    }

    const words = metadataStream ? await collectWords(metadataStream) : [];

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

/** A speed multiplier becomes a percentage change in the speaking rate. */
function rateFor(speed: number | undefined): string {
  const value = speed ?? 1;
  if (!Number.isFinite(value) || value <= 0) return '+0%';
  const percent = Math.round((value - 1) * 100);
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

  return words;
}
