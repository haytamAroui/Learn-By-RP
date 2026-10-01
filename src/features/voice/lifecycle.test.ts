import { describe, expect, it } from 'vitest';
import {
  IDLE_LIFECYCLE,
  canContinue,
  categoriseProviderError,
  isRecoverable,
  reconnectDelayMs,
  type ConversationLifecycle,
} from './lifecycle';

const lifecycle = (over: Partial<ConversationLifecycle> = {}): ConversationLifecycle => ({
  ...IDLE_LIFECYCLE,
  ...over,
});

describe('categoriseProviderError', () => {
  it('treats an auth failure as non-retryable but survivable by typing', () => {
    const error = categoriseProviderError({ message: '401 Unauthorized' });
    expect(error.category).toBe('authentication');
    expect(error.retryable).toBe(false);
    expect(error.typedFallbackAvailable).toBe(true);
  });

  it('treats a quota failure as retryable', () => {
    expect(categoriseProviderError({ message: '429 rate limit exceeded' }).retryable).toBe(true);
  });

  it('classifies a transport failure as network', () => {
    const error = categoriseProviderError({ isNetworkFailure: true });
    expect(error.category).toBe('network');
    expect(error.retryable).toBe(true);
  });

  it('separates a refused microphone from an audio-output failure', () => {
    expect(categoriseProviderError({ message: 'microphone permission denied' }).category).toBe(
      'permission_denied'
    );
    expect(categoriseProviderError({ message: 'no audio device for playback' }).category).toBe(
      'audio_device'
    );
  });

  /*
    The fallback to the unknown category matters more than the categories above it.
    A raw provider string reaches the learner as something like "check your API
    key", which is not something a learner can act on, so the message must always be
    something they can.
  */
  it('never surfaces a raw provider message', () => {
    for (const message of [
      'sk-abc123 invalid',
      '500 Internal Server Error at /v1/chat',
      'undefined is not a function',
    ]) {
      const error = categoriseProviderError({ message });
      expect(error.userMessage).not.toContain(message);
      expect(error.userMessage.length).toBeGreaterThan(0);
      expect(error.typedFallbackAvailable).toBe(true);
    }
  });

  it('keeps an unclassified failure usable', () => {
    const error = categoriseProviderError({ message: 'wat' });
    expect(error.category).toBe('unknown');
    expect(error.typedFallbackAvailable).toBe(true);
  });
});

describe('canContinue', () => {
  it('allows a session with no error', () => {
    expect(canContinue(lifecycle())).toBe(true);
  });

  it('allows a dropped connection mid-retry', () => {
    // This is the distinction the whole state model exists for: a retry in flight
    // is not a dead end.
    expect(canContinue(lifecycle({ connection: 'reconnecting' }))).toBe(true);
    expect(isRecoverable(lifecycle({ connection: 'reconnecting' }))).toBe(true);
  });

  it('stops once ended', () => {
    expect(canContinue(lifecycle({ connection: 'ended' }))).toBe(false);
    expect(canContinue(lifecycle({ connection: 'ending' }))).toBe(false);
  });

  it('keeps the session alive by typing when the voice path fails', () => {
    const error = categoriseProviderError({ message: '401 Unauthorized' });
    expect(canContinue(lifecycle({ connection: 'error', error }))).toBe(true);
    expect(isRecoverable(lifecycle({ connection: 'error', error }))).toBe(false);
  });
});

describe('reconnectDelayMs', () => {
  it('grows with the attempt number', () => {
    expect(reconnectDelayMs(1)).toBeLessThan(reconnectDelayMs(4));
  });

  it('caps so a client cannot back off for minutes', () => {
    // The jitter is applied after the cap, so the ceiling has to allow for it.
    const ceiling = 15_000 * 1.25;
    for (let attempt = 1; attempt <= 40; attempt += 1) {
      expect(reconnectDelayMs(attempt)).toBeLessThanOrEqual(Math.ceil(ceiling));
    }
  });

  it('jitters, so every client does not retry on the same second', () => {
    const samples = new Set(
      Array.from({ length: 12 }, () => reconnectDelayMs(4))
    );
    // Deterministic backoff means a provider outage becomes a sustained outage.
    expect(samples.size).toBeGreaterThan(1);
  });

  it('tolerates a nonsensical attempt number', () => {
    expect(reconnectDelayMs(0)).toBeGreaterThan(0);
    expect(reconnectDelayMs(-3)).toBeGreaterThan(0);
  });
});