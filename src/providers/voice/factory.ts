import { NativeVoiceTransport } from './nativeVoiceTransport';
import type { VoiceTransport } from './types';

/**
 * Voice input/output is factory-created so a future local PCM/STT transport,
 * WebRTC transport, or platform-specialized implementation can replace the
 * native Expo transport without changing the learner session component.
 */
export function createVoiceTransport(): VoiceTransport {
  return new NativeVoiceTransport();
}
