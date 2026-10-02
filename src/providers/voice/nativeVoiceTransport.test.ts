import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const subscriptionRemove = vi.fn();
  return {
    subscriptionRemove,
    addListener: vi.fn(() => ({ remove: subscriptionRemove })),
    requestPermissionsAsync: vi.fn(async () => ({ granted: true })),
    startRecognition: vi.fn(),
    stopRecognition: vi.fn(),
    setAudioModeAsync: vi.fn(async () => undefined),
    createAudioPlayer: vi.fn(),
    playerPause: vi.fn(),
    playerRemove: vi.fn(),
    playerPlay: vi.fn(),
    playerListenerRemove: vi.fn(),
    playerStatusCallback: null as null | ((status: { didJustFinish?: boolean }) => void),
    fileCreate: vi.fn(),
    fileWrite: vi.fn(),
    fileDelete: vi.fn(),
    speechStop: vi.fn(),
    speechSpeak: vi.fn(),
    getAvailableVoicesAsync: vi.fn(async () => []),
  };
});

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
  File: class {
    uri = 'file:///tmp/learnbyrp-test.wav';
    create = mocks.fileCreate;
    write = mocks.fileWrite;
    delete = mocks.fileDelete;
  },
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
    mocks.playerStatusCallback = null;
    mocks.requestPermissionsAsync.mockResolvedValue({ granted: true });
    mocks.createAudioPlayer.mockImplementation(() => ({
      volume: 1,
      playbackRate: 1,
      pause: mocks.playerPause,
      remove: mocks.playerRemove,
      play: mocks.playerPlay,
      addListener: vi.fn(
        (_event: string, callback: (status: { didJustFinish?: boolean }) => void) => {
          mocks.playerStatusCallback = callback;
          return { remove: mocks.playerListenerRemove };
        }
      ),
    }));
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

  it('stops a requested microphone capture even before a native start event arrives', async () => {
    const transport = new NativeVoiceTransport();

    await transport.startListening();
    expect(mocks.startRecognition).toHaveBeenCalledTimes(1);

    transport.dispose();

    expect(mocks.stopRecognition).toHaveBeenCalledTimes(1);
    expect(mocks.subscriptionRemove).toHaveBeenCalled();
  });

  it('settles native fallback speech when the session is disposed mid-playback', async () => {
    const transport = new NativeVoiceTransport();
    const playback = transport.playSpeech('Hola');

    await vi.waitFor(() => {
      expect(mocks.speechSpeak).toHaveBeenCalledTimes(1);
    });

    transport.dispose();

    await expect(playback).resolves.toBeUndefined();
    expect(mocks.speechStop).toHaveBeenCalled();
  });

  it('releases player, listener and temp file when base64 playback is interrupted', async () => {
    const transport = new NativeVoiceTransport();
    const playback = transport.playSpeech('Hola', {
      audioBase64: 'ZmFrZS1hdWRpbw==',
      mimeType: 'audio/wav',
    });

    await vi.waitFor(() => {
      expect(mocks.playerPlay).toHaveBeenCalledTimes(1);
    });

    transport.dispose();

    await expect(playback).resolves.toBeUndefined();
    expect(mocks.playerPause).toHaveBeenCalledTimes(1);
    expect(mocks.playerRemove).toHaveBeenCalledTimes(1);
    expect(mocks.playerListenerRemove).toHaveBeenCalledTimes(1);
    expect(mocks.fileDelete).toHaveBeenCalledTimes(1);
  });
});
