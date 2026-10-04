import { NativeVoiceTransport } from './nativeVoiceTransport';
import type { VoiceTransport } from './types';
import { archiveRepository } from '../../features/archive/archiveRepository';

/**
 * Voice input/output is factory-created so a future local PCM/STT transport,
 * WebRTC transport, or platform-specialized implementation can replace the
 * native Expo transport without changing the learner session component.
 */
export function createVoiceTransport(): VoiceTransport {
  return new NativeVoiceTransport(async () => {
    try {
      const consent = await archiveRepository.getConsent('voice');
      return consent?.granted === true && !consent.withdrawnAt;
    } catch {
      return false;
    }
  });
}
