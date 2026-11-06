import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/api', () => ({ api: { synthesizeSpeech: vi.fn(), synthesizeSpeechStream: vi.fn() } }));
import { api } from '../../lib/api';
import {
  clearSpeechAudioCache,
  speakStreamedWithBestAvailable,
  speakWithBestAvailable,
} from './speechOutput';
import type { VoiceTransport } from './types';

describe('Belgian Dutch speech output', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearSpeechAudioCache();
  });

  it('uses Gemini TTS for nl-BE and passes the generated audio to playback', async () => {
    const synthesize = vi.spyOn(api, 'synthesizeSpeech').mockResolvedValue({
      audio: { provider: 'gemini', base64: 'flemish-audio', mimeType: 'audio/wav' },
      fallback: 'none',
    } as any);
    const playSpeech = vi.fn().mockResolvedValue(undefined);
    const transport = { playSpeech } as unknown as VoiceTransport;

    await speakWithBestAvailable(transport, 'Goeiedag!', { language: 'nl', voiceGender: 'female' });

    expect(synthesize).toHaveBeenCalledWith(expect.objectContaining({
      text: 'Goeiedag!',
      language: 'nl',
      locale: 'nl-BE',
      voiceGender: 'female',
    }));
    expect(playSpeech).toHaveBeenCalledWith('Goeiedag!', {
      audioBase64: 'flemish-audio',
      mimeType: 'audio/wav',
      speed: undefined,
      lang: 'nl',
      locale: 'nl-BE',
      visemes: [],
    });
  });

  it('forwards the mouth timeline to playback so the avatar can follow the voice', async () => {
    const visemes = [
      { shape: 'open' as const, offsetMs: 0, durationMs: 120 },
      { shape: 'close' as const, offsetMs: 120, durationMs: 80 },
    ];
    vi.spyOn(api, 'synthesizeSpeech').mockResolvedValue({
      audio: { provider: 'gemini', base64: 'audio', mimeType: 'audio/wav' },
      fallback: 'none',
      durationMs: 200,
      visemes,
    } as any);
    const playSpeech = vi.fn().mockResolvedValue(undefined);

    await speakWithBestAvailable({ playSpeech } as unknown as VoiceTransport, 'Hallo', {
      language: 'nl',
    });

    expect(playSpeech).toHaveBeenCalledWith('Hallo', expect.objectContaining({ visemes }));
  });

  it('replays the cached clip with the same mouth timeline', async () => {
    const visemes = [{ shape: 'wide' as const, offsetMs: 0, durationMs: 90 }];
    const synthesize = vi.spyOn(api, 'synthesizeSpeech').mockResolvedValue({
      audio: { provider: 'gemini', base64: 'audio', mimeType: 'audio/wav' },
      fallback: 'none',
      durationMs: 90,
      visemes,
    } as any);
    const playSpeech = vi.fn().mockResolvedValue(undefined);
    const transport = { playSpeech } as unknown as VoiceTransport;

    await speakWithBestAvailable(transport, 'Hallo', { language: 'nl' });
    await speakWithBestAvailable(transport, 'Hallo', { language: 'nl' });

    expect(synthesize).toHaveBeenCalledTimes(1);
    expect(playSpeech).toHaveBeenCalledTimes(2);
    expect(playSpeech).toHaveBeenLastCalledWith('Hallo', expect.objectContaining({ visemes }));
  });

  it('discards playback when the owning attempt ends during synthesis', async () => {
    let active = true;
    const playSpeech = vi.fn();
    vi.spyOn(api, 'synthesizeSpeech').mockImplementation(async () => {
      active = false;
      return { audio: { provider: 'gemini', base64: 'audio', mimeType: 'audio/wav' }, fallback: 'none' } as any;
    });
    await speakWithBestAvailable({ playSpeech } as unknown as VoiceTransport, 'Een koffie.', {
      language: 'nl', canPlay: () => active,
    });
    expect(playSpeech).not.toHaveBeenCalled();
  });

  it('makes no synthesis request after permission or session ownership is lost', async () => {
    const synthesize = vi.spyOn(api, 'synthesizeSpeech');
    synthesize.mockClear();
    await speakWithBestAvailable({ playSpeech: vi.fn() } as unknown as VoiceTransport, 'Een koffie.', {
      language: 'nl', canPlay: () => false,
    });
    expect(synthesize).not.toHaveBeenCalled();
  });
});

describe('streamed speech output', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearSpeechAudioCache();
  });

  function streamingTransport() {
    const enqueueSpeech = vi.fn().mockResolvedValue(undefined);
    const playSpeech = vi.fn().mockResolvedValue(undefined);
    return { transport: { enqueueSpeech, playSpeech } as unknown as VoiceTransport, enqueueSpeech, playSpeech };
  }

  it('queues each piece of a line as it arrives', async () => {
    vi.spyOn(api, 'synthesizeSpeechStream').mockImplementation(async (_body, onChunk) => {
      onChunk({
        text: 'Goeiedag.',
        audioBase64: 'first',
        mimeType: 'audio/wav',
        durationMs: 700,
        offsetMs: 0,
        visemes: [{ shape: 'aa', offsetMs: 0, durationMs: 120 }],
      });
      onChunk({
        text: 'Welkom in Brussel.',
        audioBase64: 'second',
        mimeType: 'audio/wav',
        durationMs: 900,
        offsetMs: 700,
        visemes: [],
      });
    });

    const { transport, enqueueSpeech } = streamingTransport();
    await speakStreamedWithBestAvailable(transport, 'Goeiedag. Welkom in Brussel.', { language: 'nl' });

    expect(enqueueSpeech).toHaveBeenCalledTimes(2);
    expect(enqueueSpeech).toHaveBeenNthCalledWith(1, 'Goeiedag.', expect.objectContaining({
      audioBase64: 'first',
      chunkOffsetMs: 0,
    }));
    expect(enqueueSpeech).toHaveBeenNthCalledWith(2, 'Welkom in Brussel.', expect.objectContaining({
      audioBase64: 'second',
      chunkOffsetMs: 700,
    }));
  });

  it('keeps the single-clip path for a line that fits in one piece', async () => {
    const stream = vi.spyOn(api, 'synthesizeSpeechStream');
    const synthesize = vi.spyOn(api, 'synthesizeSpeech').mockResolvedValue({
      audio: { provider: 'gemini', base64: 'audio', mimeType: 'audio/wav' },
      fallback: 'none',
    } as any);
    const { transport, enqueueSpeech, playSpeech } = streamingTransport();

    await speakStreamedWithBestAvailable(transport, 'Hallo!', { language: 'nl' });

    expect(stream).not.toHaveBeenCalled();
    expect(enqueueSpeech).not.toHaveBeenCalled();
    expect(playSpeech).toHaveBeenCalled();
    expect(synthesize).toHaveBeenCalled();
  });

  it('falls back to the single-clip path when the stream fails', async () => {
    vi.spyOn(api, 'synthesizeSpeechStream').mockRejectedValue(new Error('stream unavailable'));
    const synthesize = vi.spyOn(api, 'synthesizeSpeech').mockResolvedValue({
      audio: { provider: 'gemini', base64: 'audio', mimeType: 'audio/wav' },
      fallback: 'none',
    } as any);
    const { transport, playSpeech } = streamingTransport();

    await speakStreamedWithBestAvailable(transport, 'Goeiedag. Welkom in Brussel.', { language: 'nl' });

    expect(playSpeech).toHaveBeenCalled();
    expect(synthesize).toHaveBeenCalled();
  });
});
