import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { categoriseProviderError } from '../src/features/voice/lifecycle';
import {
  beginGeneration,
  commitIfCurrent,
  invalidate,
} from '../src/features/voice/generation';

describe('voice/session G0 regressions', () => {
  const live = readFileSync('src/components/LiveSessionView.tsx', 'utf8');
  const speechOutput = readFileSync('src/providers/voice/speechOutput.ts', 'utf8');
  const nativeVoice = readFileSync('src/providers/voice/nativeVoiceTransport.ts', 'utf8');

  it('keeps the cloud-to-native fallback non-recursive', () => {
    expect(speechOutput).toContain('await transport.playSpeech(text');
    const fallbackStart = nativeVoice.indexOf('private async fallbackSpeech');
    const fallbackEnd = nativeVoice.indexOf('\n  public dispose()', fallbackStart);
    const fallbackBody = nativeVoice.slice(fallbackStart, fallbackEnd);

    expect(fallbackBody).toContain('Speech.speak(text');
    expect(fallbackBody).not.toContain('this.playSpeech(');
    expect(fallbackBody).not.toContain('speakWithBestAvailable(');
  });

  it('rejects stale async work after a newer generation or session end', () => {
    const stale = beginGeneration();
    beginGeneration();
    expect(commitIfCurrent(stale, () => 'stale')).toEqual({
      committed: false,
      value: undefined,
    });

    const inFlight = beginGeneration();
    invalidate();
    expect(commitIfCurrent(inFlight, () => 'late')).toEqual({
      committed: false,
      value: undefined,
    });

    expect(live).toContain('if (!isGenerationCurrent(generation) || isEndingRef.current) return;');
    expect(live).toContain('invalidateGeneration();');
  });

  it('reads mute and freeze decisions from current refs rather than stale callbacks', () => {
    expect(live).toContain('isMutedRef.current = isMuted');
    expect(live).toContain('isSceneFrozenRef.current = isSceneFrozen');
    expect(live).toContain('if (audioPlaybackEnabled && consentRef.current.voice && !isSceneFrozenRef.current)');
  });

  it('keeps reconnect, sustained failure and microphone denial explicit', () => {
    expect(live).toContain("| 'reconnecting'");
    expect(live).toContain("| 'error'");
    expect(live).toContain("event.payload === 'mic_denied'");
    expect(categoriseProviderError({ message: 'microphone permission denied' })).toMatchObject({
      category: 'permission_denied',
      retryable: false,
      typedFallbackAvailable: true,
    });
  });

  it('restores typed input when an assistant/provider turn fails', () => {
    expect(live).toContain("if (modality === 'typed')");
    expect(live).toContain('setTypedMessage(text)');
    expect(live).toContain('setShowTypedInput(true)');
  });

  it('closes recording, playback, providers and scene resources on lifecycle cleanup', () => {
    expect(live).toContain('transport.dispose()');
    expect(live).toContain('conversationProvider.dispose()');
    expect(live).toContain('sceneMirrorRef.current?.close()');
    expect(live).toContain('voiceTransportRef.current?.stopPlayback()');
    expect(live).toContain('voiceTransportRef.current?.stopListening()');

    expect(nativeVoice).toContain('this.stopListening()');
    expect(nativeVoice).toContain('this.stopPlayback()');
    expect(nativeVoice).toContain('sub.remove()');
    expect(nativeVoice).toContain('this.cleanupTempAudio()');
  });
});
