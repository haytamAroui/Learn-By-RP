/**
 * R3: the voice lifecycle as an explicit state machine.
 *
 * These types are the vocabulary the session UI, the recovery logic and the tests
 * all share. The reason they live in one file rather than beside the transport is
 * that three independent dimensions are in play - the connection, the microphone
 * and the assistant's output - and collapsing them into a single "status" is how a
 * reconnect ends up looking like a permission failure.
 */

/** Connection to the assistant. Independent of whether anyone is speaking. */
export type ConversationConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  /** The socket dropped but a retry is in flight. Not an error yet. */
  | 'reconnecting'
  | 'ending'
  | 'ended'
  | 'error';

/** The microphone. Independent of the connection: it works while offline. */
export type AudioInputState =
  | 'off'
  | 'requesting_permission'
  | 'ready'
  | 'listening'
  | 'stopped'
  | 'denied'
  | 'unavailable';

/** The assistant's voice. Independent of both of the above. */
export type AssistantOutputState =
  | 'idle'
  | 'preparing'
  | 'speaking'
  | 'paused'
  | 'finished'
  | 'failed';

/**
 * Stable error categories.
 *
 * A raw provider message is not actionable and changes between releases, so the
 * UI branches on these instead. Each carries what recovery is possible rather than
 * only what went wrong.
 */
export type ProviderErrorCategory =
  | 'none'
  /** Wrong key, revoked, quota. Retrying unchanged will not help. */
  | 'authentication'
  /** The provider is up but refused this request. Back off, then retry. */
  | 'rate_limited'
  /** Transient. Retry with backoff; the user is not at fault. */
  | 'network'
  /** No usable audio path. Fall back to typed input. */
  | 'audio_device'
  /** Microphone refused or absent. Typed input is the only route. */
  | 'permission_denied'
  /** Provider or client failed in a way we cannot classify. Typed input still works. */
  | 'unknown';

export interface ProviderError {
  category: ProviderErrorCategory;
  /** Safe to show a learner. Never the raw provider payload. */
  userMessage: string;
  /** Whether trying the same thing again could plausibly succeed. */
  retryable: boolean;
  /** Whether the session can continue in another mode. */
  typedFallbackAvailable: boolean;
}

export interface ConversationLifecycle {
  connection: ConversationConnectionState;
  input: AudioInputState;
  output: AssistantOutputState;
  error: ProviderError | null;
}

export const IDLE_LIFECYCLE: ConversationLifecycle = {
  connection: 'idle',
  input: 'off',
  output: 'idle',
  error: null,
};

/** Whether the session can still make progress in some form. */
export function canContinue(lifecycle: ConversationLifecycle): boolean {
  if (lifecycle.connection === 'ended' || lifecycle.connection === 'ending') return false;
  if (lifecycle.error) return lifecycle.error.typedFallbackAvailable;
  // A dropped connection with a retry in flight is not a dead end.
  return true;
}

export function isRecoverable(lifecycle: ConversationLifecycle): boolean {
  return lifecycle.error?.retryable === true || lifecycle.connection === 'reconnecting';
}

/**
 * Maps a provider failure onto a category.
 *
 * The strings are matched deliberately rather than parsed out of free text: this
 * runs before anything reaches the learner, and the alternative - showing a raw
 * provider message - is how learners get told to "check your API key".
 */
export function categoriseProviderError(input: {
  message?: string;
  code?: string | number;
  isNetworkFailure?: boolean;
}): ProviderError {
  const text = `${input.code ?? ''} ${input.message ?? ''}`.toLowerCase();

  const has = (...needles: string[]) => needles.some(needle => text.includes(needle));

  if (has('unauthorized', 'unauthenticated', 'invalid_api_key', 'invalid api key', '401', '403')) {
    return {
      category: 'authentication',
      userMessage: 'The assistant could not be reached with the current configuration.',
      retryable: false,
      typedFallbackAvailable: true,
    };
  }

  if (has('rate limit', 'ratelimit', 'quota', '429', 'resource_exhausted')) {
    return {
      category: 'rate_limited',
      userMessage: 'The assistant is busy right now. Try again in a moment.',
      retryable: true,
      typedFallbackAvailable: true,
    };
  }

  if (input.isNetworkFailure || has('network', 'timeout', 'timed out', 'econnreset', 'fetch failed', 'offline')) {
    return {
      category: 'network',
      userMessage: 'The connection dropped. Retrying.',
      retryable: true,
      typedFallbackAvailable: true,
    };
  }

  if (has('permission', 'denied', 'microphone', 'not authorized to record', 'audio recording')) {
    return {
      category: 'permission_denied',
      userMessage: 'Microphone access is off. You can still type your replies.',
      retryable: false,
      typedFallbackAvailable: true,
    };
  }

  if (has('audio', 'output', 'playback', 'speaker', 'no audio device')) {
    return {
      category: 'audio_device',
      userMessage: 'Audio output is unavailable. You can type instead.',
      retryable: false,
      typedFallbackAvailable: true,
    };
  }

  return {
    category: 'unknown',
    userMessage: 'Something went wrong with the assistant. You can keep going by typing.',
    retryable: true,
    typedFallbackAvailable: true,
  };
}

/**
 * Backoff for reconnects.
 *
 * Capped and jittered. Deterministic backoff means every client in the world
 * retries on the same second, which is how a provider outage turns into a sustained
 * outage.
 */
export function reconnectDelayMs(attempt: number): number {
  const base = Math.min(500 * 2 ** Math.max(0, attempt - 1), 15_000);
  return Math.round(base * (0.75 + Math.random() * 0.5));
}