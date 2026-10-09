import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/api', () => ({ api: { synthesizeSpeech: vi.fn() } }));
import { api } from '../../lib/api';
import { clearSpeechAudioCache, speakWithBestAvailable } from './speechOutput';
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
    });
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
