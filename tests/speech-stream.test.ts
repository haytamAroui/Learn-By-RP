import { describe, expect, it } from 'vitest';
import { streamSynthesizedSpeech } from '../server/providers/speechStream';
import type {
  SpeechSynthesisRequest,
  SpeechSynthesisResponse,
} from '../src/providers/runtime/contracts';
import { wavDurationMs } from '../src/providers/voice/audioTiming';

function buildWav(sampleRateHz: number, frames: number): string {
  const bytesPerSample = 2;
  const dataSize = frames * bytesPerSample;
  const buffer = new Uint8Array(44 + dataSize);
  const writeAscii = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) buffer[offset + index] = value.charCodeAt(index);
  };
  const writeUint32 = (offset: number, value: number) => {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >> 8) & 0xff;
    buffer[offset + 2] = (value >> 16) & 0xff;
    buffer[offset + 3] = (value >> 24) & 0xff;
  };
  const writeUint16 = (offset: number, value: number) => {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >> 8) & 0xff;
  };

  writeAscii(0, 'RIFF');
  writeUint32(4, 36 + dataSize);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  writeUint32(16, 16);
  writeUint16(20, 1);
  writeUint16(22, 1);
  writeUint32(24, sampleRateHz);
  writeUint32(28, sampleRateHz * bytesPerSample);
  writeUint16(32, bytesPerSample);
  writeUint16(34, 16);
  writeAscii(36, 'data');
  writeUint32(40, dataSize);

  let binary = '';
  for (let index = 0; index < buffer.length; index += 1) binary += String.fromCharCode(buffer[index]);
  return btoa(binary);
}

function stubProvider() {
  const calls: string[] = [];
  return {
    calls,
    async synthesize(request: SpeechSynthesisRequest): Promise<SpeechSynthesisResponse> {
      calls.push(request.text);
      // One second of audio per ten characters of text.
      const frames = Math.max(2400, Math.round((request.text.length / 10) * 24000));
      return {
        audio: {
          provider: 'stub',
          base64: buildWav(24000, frames),
          mimeType: 'audio/wav',
        },
        fallback: 'none',
      };
    },
  };
}

const request: SpeechSynthesisRequest = {
  text: 'Goeiedag! Welkom bij Praktika. Ik ben Lotte, je coach.',
  language: 'nl',
  locale: 'nl-BE',
};

describe('streamed speech', () => {
  it('costs one provider request for a whole line by default', async () => {
    const provider = stubProvider();
    const chunks: any[] = [];

    await streamSynthesizedSpeech(provider, request, chunk => chunks.push(chunk));

    expect(provider.calls).toHaveLength(1);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('cuts the line into pieces that carry offsets and mouth timelines', async () => {
    const provider = stubProvider();
    const chunks: any[] = [];

    await streamSynthesizedSpeech(provider, request, chunk => chunks.push(chunk));

    expect(chunks[0].offsetMs).toBe(0);
    for (let index = 1; index < chunks.length; index += 1) {
      expect(chunks[index].offsetMs).toBeGreaterThan(chunks[index - 1].offsetMs);
    }
    for (const chunk of chunks) {
      expect(chunk.durationMs).toBeGreaterThan(0);
      expect(chunk.visemes.length).toBeGreaterThan(0);
      expect(wavDurationMs(chunk.audioBase64)).toBeGreaterThan(0);
    }
  });

  it('synthesises each sentence separately when that is asked for', async () => {
    const provider = stubProvider();
    const chunks: any[] = [];

    await streamSynthesizedSpeech(provider, request, chunk => chunks.push(chunk), {
      perSentence: true,
    });

    expect(provider.calls).toHaveLength(3);
    expect(chunks).toHaveLength(3);
    expect(chunks[0].offsetMs).toBe(0);
  });

  it('delivers the whole line as one piece when it cannot be cut', async () => {
    const provider = {
      calls: [] as string[],
      async synthesize(req: SpeechSynthesisRequest): Promise<SpeechSynthesisResponse> {
        provider.calls.push(req.text);
        return {
          audio: { provider: 'stub', base64: 'not-a-wav', mimeType: 'audio/wav' },
          fallback: 'none',
        };
      },
    };
    const chunks: any[] = [];

    await streamSynthesizedSpeech(provider, request, chunk => chunks.push(chunk));

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe(request.text);
  });

  it('does nothing for empty text', async () => {
    const provider = stubProvider();
    const chunks: any[] = [];

    await streamSynthesizedSpeech(provider, { ...request, text: '' }, chunk => chunks.push(chunk));

    expect(provider.calls).toHaveLength(0);
    expect(chunks).toHaveLength(0);
  });
});
