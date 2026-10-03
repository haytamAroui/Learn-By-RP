import { describe, expect, it } from 'vitest';
import {
  ProviderRateLimiter,
  checkProviderAccess,
  validateProviderBody,
} from '../server/security/requestGuard';

function req(headers: Record<string, string>) {
  return {
    header(name: string) {
      return headers[name.toLowerCase()] ?? headers[name] ?? undefined;
    },
  } as any;
}

describe('provider request guard', () => {
  it('requires a bounded guest or bearer identity', () => {
    expect(checkProviderAccess(req({}), 'actor')).toMatchObject({
      ok: false,
      status: 401,
    });
    expect(
      checkProviderAccess(
        req({ 'x-learnbyrp-client-id': 'guest-12345678' }),
        'actor'
      ).ok
    ).toBe(true);
  });

  it('enforces voice and saved-analysis consent independently', () => {
    const base = { 'x-learnbyrp-client-id': 'guest-12345678' };

    expect(checkProviderAccess(req(base), 'realtime').status).toBe(403);
    expect(
      checkProviderAccess(
        req({ ...base, 'x-learnbyrp-consent-voice': 'granted' }),
        'realtime'
      ).ok
    ).toBe(true);

    expect(
      checkProviderAccess(
        req({ ...base, 'x-learnbyrp-consent-voice': 'granted' }),
        'assessment'
      ).status
    ).toBe(403);
    expect(
      checkProviderAccess(
        req({ ...base, 'x-learnbyrp-consent-saved-analysis': 'granted' }),
        'assessment'
      ).ok
    ).toBe(true);
  });

  it('bounds provider request shapes before they reach a model', () => {
    expect(validateProviderBody('actor', { userMessage: '' })).toMatch(/required/);
    expect(
      validateProviderBody('actor', {
        userMessage: 'hola',
        allowedActions: Array.from({ length: 33 }, (_, i) => String(i)),
      })
    ).toMatch(/allowedActions/);
    expect(
      validateProviderBody('speech', { text: 'x'.repeat(2001) })
    ).toMatch(/2000/);
  });

  it('rate-limits each client and endpoint independently', () => {
    let now = 0;
    const limiter = new ProviderRateLimiter(() => now);

    for (let i = 0; i < 12; i += 1) {
      expect(limiter.take('guest:a', 'assessment')).toBe(true);
    }
    expect(limiter.take('guest:a', 'assessment')).toBe(false);
    expect(limiter.take('guest:a', 'actor')).toBe(true);
    expect(limiter.take('guest:b', 'assessment')).toBe(true);

    now = 60_001;
    expect(limiter.take('guest:a', 'assessment')).toBe(true);
  });
});
