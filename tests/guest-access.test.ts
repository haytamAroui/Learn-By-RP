import { describe, expect, it } from 'vitest';
import { createGuestAccessRegistry } from '../server/security/guestAccess';

function fakeRequest(token?: string): any {
  return {
    header(name: string) {
      if (name.toLowerCase() !== 'authorization' || !token) return undefined;
      return `Bearer ${token}`;
    },
  };
}

function fakeResponse() {
  const state = { status: 200, body: undefined as any };
  return {
    state,
    response: {
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

describe('bounded guest access', () => {
  it('stores consent independently per scope and fails closed', () => {
    const registry = createGuestAccessRegistry();
    const guest = registry.createGuest();

    registry.recordConsent(guest.token, {
      scope: 'voice',
      granted: false,
      version: 'v1',
    });

    let nextCalls = 0;
    const denied = fakeResponse();
    registry.requireConsent('voice')(
      fakeRequest(guest.token),
      denied.response,
      () => {
        nextCalls += 1;
      }
    );

    expect(nextCalls).toBe(0);
    expect(denied.state.status).toBe(403);
    expect(denied.state.body).toMatchObject({
      error: 'consent_required',
      scope: 'voice',
      decided: true,
    });

    registry.recordConsent(guest.token, {
      scope: 'voice',
      granted: true,
      version: 'v1',
    });

    const allowed = fakeResponse();
    registry.requireConsent('voice')(
      fakeRequest(guest.token),
      allowed.response,
      () => {
        nextCalls += 1;
      }
    );
    expect(nextCalls).toBe(1);

    const analysis = fakeResponse();
    registry.requireConsent('saved_analysis')(
      fakeRequest(guest.token),
      analysis.response,
      () => {
        nextCalls += 1;
      }
    );
    expect(analysis.state.status).toBe(403);
    expect(analysis.state.body).toMatchObject({
      scope: 'saved_analysis',
      decided: false,
    });
  });

  it('rejects missing, invalid, and expired guest credentials', () => {
    let now = Date.parse('2026-10-02T10:00:00.000Z');
    const registry = createGuestAccessRegistry({
      ttlMs: 1000,
      now: () => now,
    });
    const guest = registry.createGuest();

    for (const token of [undefined, 'wrong-token']) {
      const result = fakeResponse();
      let nextCalls = 0;
      registry.requireGuest(fakeRequest(token), result.response, () => {
        nextCalls += 1;
      });
      expect(nextCalls).toBe(0);
      expect(result.state.status).toBe(401);
    }

    expect(registry.getGuest(guest.token)).not.toBeNull();
    now += 1001;
    expect(registry.getGuest(guest.token)).toBeNull();

    const expired = fakeResponse();
    registry.requireGuest(fakeRequest(guest.token), expired.response, () => {
      throw new Error('expired guest must not pass');
    });
    expect(expired.state.status).toBe(401);
  });

  it('never treats a false decision as missing consent metadata', () => {
    const registry = createGuestAccessRegistry();
    const guest = registry.createGuest();
    const decision = registry.recordConsent(guest.token, {
      scope: 'saved_analysis',
      granted: false,
      version: '2026-09-30.1',
    });

    expect(decision).toMatchObject({
      scope: 'saved_analysis',
      granted: false,
      version: '2026-09-30.1',
    });
  });
});
