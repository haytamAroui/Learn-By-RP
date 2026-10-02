import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addListener: vi.fn(() => ({ remove: vi.fn() })),
  requestPermissionsAsync: vi.fn(async () => ({ granted: true })),
  startRecognition: vi.fn(),
  stopRecognition: vi.fn(),
  setAudioModeAsync: vi.fn(async () => undefined),
  createAudioPlayer: vi.fn(),
  speechStop: vi.fn(),
  speechSpeak: vi.fn(),
  getAvailableVoicesAsync: vi.fn(async () => []),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

vi.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    addListener: mocks.addListener,
    requestPermissionsAsync: mocks.requestPermissionsAsync,
    start: mocks.startRecognition,
    stop: mocks.stopRecognition,
  },
}));

vi.mock('expo-audio', () => ({
  createAudioPlayer: mocks.createAudioPlayer,
  setAudioModeAsync: mocks.setAudioModeAsync,
}));

vi.mock('expo-file-system', () => ({
  File: class {},
  Paths: { cache: '/tmp' },
  EncodingType: { Base64: 'base64' },
}));

vi.mock('expo-speech', () => ({
  stop: mocks.speechStop,
  speak: mocks.speechSpeak,
  getAvailableVoicesAsync: mocks.getAvailableVoicesAsync,
}));

import { NativeVoiceTransport } from './nativeVoiceTransport';

describe('NativeVoiceTransport playback/listening lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestPermissionsAsync.mockResolvedValue({ granted: true });
  });

  it('does not manufacture playback_end when listening starts from idle', async () => {
    const transport = new NativeVoiceTransport();
    const events: string[] = [];
    const unsubscribe = transport.subscribe(event => {
      events.push(event.type);
    });

    const started = await transport.startListening();

    expect(started).toBe(true);
    expect(mocks.startRecognition).toHaveBeenCalledTimes(1);
    expect(events).not.toContain('playback_end');

    unsubscribe();
    transport.dispose();
  });

  it('cannot recurse through playback_end -> startListening while playback is idle', async () => {
    const transport = new NativeVoiceTransport();
    let playbackEnds = 0;

    const unsubscribe = transport.subscribe(event => {
      if (event.type !== 'playback_end') return;
      playbackEnds += 1;
      void transport.startListening();
    });

    await transport.startListening();

    expect(playbackEnds).toBe(0);
    expect(mocks.startRecognition).toHaveBeenCalledTimes(1);

    unsubscribe();
    transport.dispose();
  });

  it('keeps an idle stopPlayback silent even when called repeatedly', () => {
    const transport = new NativeVoiceTransport();
    const events: string[] = [];
    const unsubscribe = transport.subscribe(event => {
      events.push(event.type);
    });

    transport.stopPlayback();
    transport.stopPlayback();

    expect(events).not.toContain('playback_end');

    unsubscribe();
    transport.dispose();
  });
});
