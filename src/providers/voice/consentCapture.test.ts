import { beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({
  handlers: new Map<string, (event: any) => void>(),
  permissions: vi.fn(), start: vi.fn(), stop: vi.fn(),
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
vi.mock('expo-speech', () => ({ stop: vi.fn(), speak: vi.fn() }));
import { NativeVoiceTransport } from './nativeVoiceTransport';

beforeEach(() => {
  vi.clearAllMocks();
  native.handlers.clear();
  native.permissions.mockResolvedValue({ granted: true });
});

describe('consent at microphone capture', () => {
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
