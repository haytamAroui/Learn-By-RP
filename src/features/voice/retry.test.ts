import { describe, expect, it } from 'vitest';
import { withRetry } from './retry';

const noSleep = () => Promise.resolve();
const noDelay = () => 0;

describe('withRetry', () => {
  it('returns the first success without retrying', async () => {
    const calls: number[] = [];
    const outcome = await withRetry(
      async attempt => {
        calls.push(attempt);
        return 'ok';
      },
      { sleepFn: noSleep, delayFn: noDelay }
    );

    expect(outcome).toMatchObject({ ok: true, value: 'ok', attempts: 1 });
    expect(calls).toEqual([1]);
  });

  it('retries a retryable failure and reports the attempt', async () => {
    let calls = 0;
    const outcome = await withRetry(
      async () => {
        calls += 1;
        if (calls < 3) throw new Error('fetch failed');
        return 'recovered';
      },
      { sleepFn: noSleep, delayFn: noDelay }
    );

    expect(outcome.ok).toBe(true);
    expect(outcome.value).toBe('recovered');
    expect(outcome.attempts).toBe(3);
  });

  /*
    Retrying a 401 spends the user's time and battery to reach the same 401. The
    distinction between retryable and not is the whole point of the error categories.
  */
  it('does not retry an authentication failure', async () => {
    let calls = 0;
    const outcome = await withRetry(
      async () => {
        calls += 1;
        throw new Error('401 Unauthorized');
      },
      { sleepFn: noSleep, delayFn: noDelay }
    );

    expect(calls).toBe(1);
    expect(outcome.ok).toBe(false);
    expect(outcome.error?.category).toBe('authentication');
    expect(outcome.error?.retryable).toBe(false);
  });

  it('does not retry a refused microphone', async () => {
    let calls = 0;
    await withRetry(
      async () => {
        calls += 1;
        throw new Error('microphone permission denied');
      },
      { sleepFn: noSleep, delayFn: noDelay }
    );
    // Re-prompting for a permission the user declined is worse than failing.
    expect(calls).toBe(1);
  });

  it('retries a rate limit, since waiting helps', async () => {
    let calls = 0;
    const outcome = await withRetry(
      async () => {
        calls += 1;
        if (calls < 2) throw new Error('429 rate limit exceeded');
        return 'ok';
      },
      { sleepFn: noSleep, delayFn: noDelay }
    );

    expect(outcome.ok).toBe(true);
    expect(calls).toBe(2);
  });

  it('gives up after the attempt budget and reports the failure', async () => {
    let calls = 0;
    const outcome = await withRetry(
      async () => {
        calls += 1;
        throw new Error('fetch failed');
      },
      { maxAttempts: 3, sleepFn: noSleep, delayFn: noDelay }
    );

    expect(calls).toBe(3);
    expect(outcome.ok).toBe(false);
    expect(outcome.attempts).toBe(3);
  });

  it('announces each retry so the UI can show progress', async () => {
    const announced: number[] = [];
    await withRetry(
      async attempt => {
        if (attempt < 3) throw new Error('fetch failed');
        return 'ok';
      },
      {
        sleepFn: noSleep,
        delayFn: noDelay,
        onRetry: attempt => announced.push(attempt),
      }
    );

    expect(announced).toEqual([1, 2]);
  });

  it('waits between attempts rather than hammering', async () => {
    const waited: number[] = [];
    await withRetry(
      async attempt => {
        if (attempt < 3) throw new Error('fetch failed');
        return 'ok';
      },
      { sleepFn: async ms => void waited.push(ms), delayFn: attempt => attempt * 100 }
    );

    expect(waited).toEqual([100, 200]);
  });

  it('surfaces a timeout as retryable', async () => {
    const abort = new Error('The operation was aborted');
    abort.name = 'AbortError';

    let calls = 0;
    const outcome = await withRetry(
      async () => {
        calls += 1;
        throw abort;
      },
      { maxAttempts: 2, sleepFn: noSleep, delayFn: noDelay }
    );

    expect(calls).toBe(2);
    expect(outcome.ok).toBe(false);
    expect(outcome.error?.category).toBe('network');
  });

  it('handles a non-Error rejection', async () => {
    const outcome = await withRetry(async () => Promise.reject('something odd'), {
      sleepFn: noSleep,
      delayFn: noDelay,
    });

    expect(outcome.ok).toBe(false);
    expect(outcome.error?.typedFallbackAvailable).toBe(true);
  });
});