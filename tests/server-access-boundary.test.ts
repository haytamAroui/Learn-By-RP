import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('server AI access boundary', () => {
  const server = readFileSync('server/index.ts', 'utf8');
  const client = readFileSync('src/lib/api.ts', 'utf8');

  function routeWindow(path: string): string {
    const index = server.indexOf(`'${path}'`);
    expect(index).toBeGreaterThanOrEqual(0);
    return server.slice(index, index + 700);
  }

  it('keeps guest bootstrap public and protects AI routes', () => {
    expect(server).toContain("app.post('/api/access/guest'");

    expect(routeWindow('/api/realtime/session')).toContain(
      "guestAccess.requireConsent('voice')"
    );
    expect(routeWindow('/api/assessment')).toContain(
      "guestAccess.requireConsent('saved_analysis')"
    );
    expect(routeWindow('/api/actor/respond')).toContain(
      'guestAccess.requireGuest'
    );
    expect(routeWindow('/api/coach/hint')).toContain(
      'guestAccess.requireGuest'
    );
    expect(routeWindow('/api/speech/synthesize')).toContain(
      'guestAccess.requireGuest'
    );
  });

  it('puts rate limits and schema validation before every AI handler', () => {
    expect(routeWindow('/api/realtime/session')).toContain('aiRateLimits.realtime');
    expect(routeWindow('/api/realtime/session')).toContain(
      'validateBody(validateRealtimeSessionRequest)'
    );
    expect(routeWindow('/api/actor/respond')).toContain('aiRateLimits.actor');
    expect(routeWindow('/api/actor/respond')).toContain(
      'validateBody(validateActorRequest)'
    );
    expect(routeWindow('/api/coach/hint')).toContain('aiRateLimits.coach');
    expect(routeWindow('/api/assessment')).toContain('aiRateLimits.assessment');
    expect(routeWindow('/api/speech/synthesize')).toContain('aiRateLimits.speech');
  });

  it('fails closed locally before sending consent-scoped data', () => {
    expect(client).toContain(
      "if (path === '/api/realtime/session') return 'voice'"
    );
    expect(client).toContain(
      "if (path === '/api/assessment') return 'saved_analysis'"
    );
    expect(client).toContain("throw new ApiError('consent_required', 403");
  });

  it('uses bearer guest credentials rather than self-declared consent headers', () => {
    expect(client).toContain('Authorization:');
    expect(client).toContain('Bearer ${await guestToken(forceRefresh)}');
    expect(client).not.toMatch(/x-consent|x-voice-consent|x-analysis-consent/i);
  });
});
