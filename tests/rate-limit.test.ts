import { describe, expect, it } from 'vitest';
import { createFixedWindowRateLimiter } from '../server/security/rateLimit';

function responseHarness() {
  const state = {
    status: 200,
    body: undefined as any,
    headers: {} as Record<string, string>,
  };
  return {
    state,
    response: {
      setHeader(name: string, value: string) {
        state.headers[name] = value;
      },
      status(code: number) {
        state.status = code;
        return this;
      },
      json(body: any) {
        state.body = body;
        return this;
      },
    } as any,
  };
}

describe('AI fixed-window rate limiter', () => {
  it('limits by authenticated guest identity and resets after the window', () => {
    let now = 1_000;
    const limiter = createFixedWindowRateLimiter({
      name: 'actor',
      windowMs: 1_000,
      maxRequests: 2,
      now: () => now,
    });
    const request = {
      guestAccess: { guestId: 'guest-1', expiresAt: 999999 },
      ip: '127.0.0.1',
      socket: {},
    } as any;

    let accepted = 0;
    for (let i = 0; i < 2; i += 1) {
      const harness = responseHarness();
      limiter(request, harness.response, () => {
        accepted += 1;
      });
      expect(harness.state.status).toBe(200);
    }
    expect(accepted).toBe(2);

    const denied = responseHarness();
    limiter(request, denied.response, () => {
      accepted += 1;
    });
    expect(accepted).toBe(2);
    expect(denied.state.status).toBe(429);
    expect(denied.state.body).toMatchObject({
      error: 'rate_limit_exceeded',
      limit: 2,
    });
    expect(denied.state.headers['Retry-After']).toBeTruthy();

    now += 1_001;
    const reset = responseHarness();
    limiter(request, reset.response, () => {
      accepted += 1;
    });
    expect(accepted).toBe(3);
  });

  it('keeps guests in independent buckets', () => {
    const limiter = createFixedWindowRateLimiter({
      name: 'assessment',
      windowMs: 60_000,
      maxRequests: 1,
      now: () => 1_000,
    });

    for (const guestId of ['a', 'b']) {
      const harness = responseHarness();
      limiter(
        {
          guestAccess: { guestId, expiresAt: 999999 },
          ip: 'same-ip',
          socket: {},
        } as any,
        harness.response,
        () => undefined
      );
      expect(harness.state.status).toBe(200);
    }
  });
});
