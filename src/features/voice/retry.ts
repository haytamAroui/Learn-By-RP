import { categoriseProviderError, reconnectDelayMs, type ProviderError } from './lifecycle';

/**
 * Request-level retry for the assistant.
 *
 * The transport is a stateless HTTP call rather than a persistent socket, so
 * "reconnecting" here means a request that failed and is being retried, not a
 * socket coming back. That distinction matters: a socket reconnect can resume
 * mid-conversation, while a retried request either produces a fresh response or
 * produces nothing at all.
 *
 * Only retryable categories are retried. Retrying an authentication failure spends
 * the user's time and battery to reach the same 401, and retrying a refused
 * microphone is worse - it re-prompts for a permission the user already declined.
 */

export interface RetryOptions {
  /** Total attempts including the first. */
  maxAttempts?: number;
  /** Called before each retry, so the UI can show that something is happening. */
  onRetry?: (attempt: number, error: ProviderError) => void;
  /** Injectable for deterministic tests. */
  delayFn?: (attempt: number) => number;
  /** Injectable for deterministic tests. */
  sleepFn?: (ms: number) => Promise<void>;
}

export interface RetryOutcome<T> {
  ok: boolean;
  value?: T;
  error?: ProviderError;
  /** How many attempts were made, including the successful one. */
  attempts: number;
}

const defaultSleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryOutcome<T>> {
  const {
    maxAttempts = 3,
    onRetry,
    delayFn = reconnectDelayMs,
    sleepFn = defaultSleep,
  } = options;

  let last: ProviderError | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const value = await operation(attempt);
      return { ok: true, value, attempts: attempt };
    } catch (raw) {
      const failure = raw instanceof Error ? raw : new Error(String(raw));
      const error = categoriseProviderError({
        message: failure.message,
        code: (failure as { status?: number }).status,
        isNetworkFailure: failure.name === 'AbortError' || /abort/i.test(failure.message),
      });

      last = error;

      // A non-retryable category, or no attempts left. Stop rather than burn time.
      if (!error.retryable || attempt === maxAttempts) {
        return { ok: false, error, attempts: attempt };
      }

      onRetry?.(attempt, error);
      await sleepFn(delayFn(attempt));
    }
  }

  // Unreachable: the loop returns on the final attempt. Kept so the return type is
  // total rather than relying on control-flow analysis of the loop above.
  return { ok: false, error: last, attempts: maxAttempts };
}