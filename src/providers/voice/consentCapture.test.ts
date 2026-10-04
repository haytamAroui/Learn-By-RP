import { beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({
  handlers: new Map<string, (event: any) => void>(),
  permissions: vi.fn(), start: vi.fn(), stop: vi.fn(),
  speak: vi.fn(), availableVoices: vi.fn(),
}));
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('expo-speech-recognition', () => ({ ExpoSpeechRecognitionModule: {
  addListener: (name: string, handler: (event: any) => void) => {
    native.handlers.set(name, handler);
    return { remove: () => native.handlers.delete(name) };
  },
  requestPermissionsAsync: native.permissions, start: native.start, stop: native.stop,
} }));
vi.mock('expo-audio', () => ({ setAudioModeAsync: vi.fn(), createAudioPlayer: vi.fn() }));
vi.mock('expo-file-system', () => ({ File: class {}, Paths: {}, EncodingType: {} }));
vi.mock('expo-speech', () => ({
  stop: vi.fn(),
  speak: native.speak,
  getAvailableVoicesAsync: native.availableVoices,
}));
import { NativeVoiceTransport } from './nativeVoiceTransport';

beforeEach(() => {
  vi.clearAllMocks();
  native.handlers.clear();
  native.permissions.mockResolvedValue({ granted: true });
  native.availableVoices.mockResolvedValue([]);
  native.speak.mockImplementation((_text: string, options: any) => options.onDone?.());
});

describe('consent at microphone capture', () => {
  it('uses the exact Belgian Dutch system voice when Gemini audio is unavailable', async () => {
    native.availableVoices.mockResolvedValue([
      { identifier: 'fr-FR', language: 'fr-FR', name: 'French voice' },
      { identifier: 'nl-NL', language: 'nl-NL', name: 'Netherlands Dutch' },
      { identifier: 'nl-BE', language: 'nl-BE', name: 'Belgian Dutch' },
    ]);
    const transport = new NativeVoiceTransport(() => true);

    await transport.playSpeech('Goeiedag!', {
      lang: 'nl',
      mimeType: 'audio/wav',
    });

    expect(native.speak).toHaveBeenCalledWith(
      'Goeiedag!',
      expect.objectContaining({ language: 'nl-BE', voice: 'nl-BE' })
    );
    transport.dispose();
  });

  it('does not let the OS default voice speak Dutch when Gemini audio and an exact voice are unavailable', async () => {
    native.availableVoices.mockResolvedValue([
      { identifier: 'fr-FR', language: 'fr-FR', name: 'French voice' },
      { identifier: 'nl-NL', language: 'nl-NL', name: 'Netherlands Dutch' },
    ]);
    const transport = new NativeVoiceTransport(() => true);
    const events = vi.fn();
    transport.subscribe(events);

    await transport.playSpeech('Goeiedag!', { lang: 'nl' });

    expect(native.speak).not.toHaveBeenCalled();
    expect(events).toHaveBeenCalledWith({ type: 'error', payload: 'voice_locale_unavailable' });
    expect(events).toHaveBeenCalledWith({ type: 'playback_end' });
    transport.dispose();
  });

  it('plays Gemini TTS audio in the browser even when Web Speech is unavailable', async () => {
    native.availableVoices.mockResolvedValue([]);
    const playedSources: string[] = [];
    const previousAudio = (globalThis as any).Audio;
    (globalThis as any).Audio = class {
      playbackRate = 1;
      onended?: () => void;
      onerror?: () => void;
      constructor(source: string) { playedSources.push(source); }
      play() { this.onended?.(); return Promise.resolve(); }
      pause() {}
    };
    const transport = new NativeVoiceTransport(() => true);
    const events = vi.fn();
    transport.subscribe(events);

    try {
      await transport.playSpeech('Goeiedag!', {
        lang: 'nl',
        locale: 'nl-BE',
        audioBase64: 'gemini-nl-be-audio',
        mimeType: 'audio/wav',
      });

      expect(playedSources).toEqual(['data:audio/wav;base64,gemini-nl-be-audio']);
      expect(native.speak).not.toHaveBeenCalled();
      expect(events).not.toHaveBeenCalledWith({ type: 'error', payload: 'voice_locale_unavailable' });
    } finally {
      transport.dispose();
      if (previousAudio === undefined) delete (globalThis as any).Audio;
      else (globalThis as any).Audio = previousAudio;
    }
  });

  it('fails closed without a supplied consent authority', async () => {
    const transport = new NativeVoiceTransport();
    expect(await transport.startListening()).toBe(false);
    expect(native.permissions).not.toHaveBeenCalled();
    expect(native.start).not.toHaveBeenCalled();
    transport.dispose();
  });

  it('does not request OS permission when consent is denied', async () => {
    const transport = new NativeVoiceTransport(() => false);
    expect(await transport.startListening()).toBe(false);
    expect(native.permissions).not.toHaveBeenCalled();
    transport.dispose();
  });

  it('starts only once when capture is requested concurrently', async () => {
    const transport = new NativeVoiceTransport(() => true);
    expect(await Promise.all([transport.startListening(), transport.startListening()])).toEqual([true, true]);
    expect(native.start).toHaveBeenCalledTimes(1);
    transport.dispose();
  });

  it.each(['withdrawal', 'stop', 'dispose'] as const)('does not start after %s during the permission dialog', async action => {
    let granted = true;
    let resolvePermission!: (result: { granted: boolean }) => void;
    native.permissions.mockImplementation(() => new Promise(resolve => { resolvePermission = resolve; }));
    const transport = new NativeVoiceTransport(() => granted);
    const pending = transport.startListening();
    await vi.waitFor(() => expect(native.permissions).toHaveBeenCalled());
    if (action === 'withdrawal') granted = false;
    if (action === 'stop') transport.stopListening();
    if (action === 'dispose') transport.dispose();
    resolvePermission({ granted: true });
    expect(await pending).toBe(false);
    expect(native.start).not.toHaveBeenCalled();
    transport.dispose();
  });

  it('drops recognition results after withdrawal', async () => {
    let granted = true;
    const transport = new NativeVoiceTransport(() => granted);
    const events = vi.fn();
    transport.subscribe(events);
    await transport.startListening();
    events.mockClear();
    granted = false;
    native.handlers.get('result')?.({ results: [{ transcript: 'Een koffie' }], isFinal: true });
    await Promise.resolve();
    expect(events).not.toHaveBeenCalled();
    transport.dispose();
  });

  it('delivers a final result while consent is granted', async () => {
    const transport = new NativeVoiceTransport(() => true);
    const events = vi.fn();
    transport.subscribe(events);
    await transport.startListening();
    native.handlers.get('result')?.({ results: [{ transcript: 'Een koffie' }], isFinal: true });
    await Promise.resolve();
    expect(events).toHaveBeenCalledWith({ type: 'speech_result', payload: { transcript: 'Een koffie', isFinal: true } });
    transport.dispose();
  });

  it('stops capture even before the asynchronous native start event arrives', async () => {
    const transport = new NativeVoiceTransport(() => true);
    await transport.startListening();
    transport.stopListening();
    expect(native.stop).toHaveBeenCalledTimes(1);
    transport.dispose();
  });
});
