import { beforeEach, describe, expect, it, vi } from 'vitest';

const gemini = vi.hoisted(() => ({
  voicesList: vi.fn(),
  interactionsCreate: vi.fn(),
  generateContent: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    voices = { list: gemini.voicesList };
    interactions = { create: gemini.interactionsCreate };
    models = { generateContent: gemini.generateContent };
  },
}));

import { createProviderRuntime } from '../server/providers/runtime';

describe('Gemini TTS locale routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gemini.voicesList.mockResolvedValue({
      voices: [{ id: 'BelgianDutchVoice', language_code: 'nl-BE' }],
    });
    gemini.interactionsCreate.mockResolvedValue({
      output_audio: { data: 'gemini-audio-base64', mime_type: 'audio/wav' },
    });
  });

  it('synthesizes Belgian Dutch through Gemini TTS with a Flemish accent instruction', async () => {
    const runtime = createProviderRuntime({
      GEMINI_API_KEY: 'test-key',
      GEMINI_TTS_MODEL: 'gemini-3.8-flash-lite-tts',
    } as NodeJS.ProcessEnv);

    const response = await runtime.speech!.synthesize({
      text: 'Goeiemorgen! Wat mag het zijn?',
      language: 'nl',
      locale: 'nl-BE',
      style: 'Warm, friendly barista',
    });

    expect(gemini.voicesList).toHaveBeenCalledWith({
      language_code: ['nl-BE'],
      type: ['prebuilt'],
      page_size: 100,
    });
    expect(gemini.interactionsCreate).toHaveBeenCalledTimes(1);
    const request = gemini.interactionsCreate.mock.calls[0][0];
    expect(request.model).toBe('gemini-3.8-flash-lite-tts');
    expect(request.input[0].content[0].text).toBe('Goeiemorgen! Wat mag het zijn?');
    expect(request.generation_config.speech_config).toEqual([
      { voice: 'BelgianDutchVoice' },
    ]);
    expect(request.input[0].content[0].annotations[0].style).toContain(
      'Belgian Dutch (Flemish as used in Flanders)'
    );
    expect(request.input[0].content[0].annotations[0].style).toContain(
      'Do not use a Netherlands Dutch accent'
    );
    expect(response).toMatchObject({
      fallback: 'none',
      audio: {
        provider: 'gemini',
        voice: 'BelgianDutchVoice',
        base64: 'gemini-audio-base64',
        mimeType: 'audio/wav',
      },
    });
  });

  it('uses Gemini’s multilingual voice if no regional catalog voice is available', async () => {
    gemini.voicesList.mockResolvedValue({ voices: [] });
    const runtime = createProviderRuntime({
      GEMINI_API_KEY: 'test-key',
    } as NodeJS.ProcessEnv);

    await runtime.speech!.synthesize({
      text: 'Goeiemorgen!',
      language: 'nl',
      locale: 'nl-BE',
    });

    expect(gemini.interactionsCreate.mock.calls[0][0].generation_config.speech_config)
      .toEqual([{ voice: 'Puck' }]);
  });

  it('uses a voice with matching gender metadata when the exact regional voice is available', async () => {
    gemini.voicesList.mockResolvedValue({
      voices: [
        { id: 'BelgianMaleVoice', language_code: 'nl-BE', gender: 'male' },
        { id: 'BelgianFemaleVoice', language_code: 'nl-BE', gender: 'female' },
      ],
    });
    const runtime = createProviderRuntime({ GEMINI_API_KEY: 'test-key' } as NodeJS.ProcessEnv);

    const response = await runtime.speech!.synthesize({
      text: 'Dag Nora.',
      language: 'nl',
      locale: 'nl-BE',
      voiceGender: 'female',
    });

    expect(gemini.voicesList).toHaveBeenCalledWith({
      language_code: ['nl-BE'],
      gender: ['female'],
      type: ['prebuilt'],
      page_size: 100,
    });
    expect(response.audio?.voice).toBe('BelgianFemaleVoice');
  });

  it('uses the verified female fallback for Nora when no nl-BE voice is catalogued', async () => {
    gemini.voicesList.mockResolvedValue({ voices: [] });
    const runtime = createProviderRuntime({ GEMINI_API_KEY: 'test-key' } as NodeJS.ProcessEnv);

    const response = await runtime.speech!.synthesize({
      text: 'Ik heb de reservesleutel.',
      language: 'nl',
      locale: 'nl-BE',
      voiceGender: 'female',
    });

    expect(gemini.interactionsCreate.mock.calls[0][0].generation_config.speech_config)
      .toEqual([{ voice: 'Aoede' }]);
    expect(response.audio?.voice).toBe('Aoede');
  });

  it('does not reuse one character gender’s catalog voice for another', async () => {
    gemini.voicesList.mockImplementation(({ gender }: { gender?: string[] }) => Promise.resolve({
      voices: [{
        id: gender?.[0] === 'female' ? 'FemaleVoice' : 'MaleVoice',
        language_code: 'nl-BE',
        gender: gender?.[0],
      }],
    }));
    const runtime = createProviderRuntime({ GEMINI_API_KEY: 'test-key' } as NodeJS.ProcessEnv);

    const female = await runtime.speech!.synthesize({
      text: 'Dag.', language: 'nl', locale: 'nl-BE', voiceGender: 'female',
    });
    const male = await runtime.speech!.synthesize({
      text: 'Dag.', language: 'nl', locale: 'nl-BE', voiceGender: 'male',
    });

    expect(female.audio?.voice).toBe('FemaleVoice');
    expect(male.audio?.voice).toBe('MaleVoice');
    expect(gemini.voicesList).toHaveBeenCalledTimes(2);
  });
});
