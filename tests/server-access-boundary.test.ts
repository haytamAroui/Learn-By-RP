import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('server AI access boundary', () => {
  const server = readFileSync('server/index.ts', 'utf8');
  const client = readFileSync('src/lib/api.ts', 'utf8');

  it('keeps guest bootstrap public and protects AI routes', () => {
    expect(server).toContain("app.post('/api/access/guest'");
    expect(server).toContain("app.post('/api/realtime/session', guestAccess.requireConsent('voice')");
    expect(server).toContain("app.post('/api/assessment', guestAccess.requireConsent('saved_analysis')");
    expect(server).toContain("app.post('/api/actor/respond', guestAccess.requireGuest");
    expect(server).toContain("app.post('/api/coach/hint', guestAccess.requireGuest");
    expect(server).toContain("app.post('/api/speech/synthesize', guestAccess.requireGuest");
  });

  it('fails closed locally before sending consent-scoped data', () => {
    expect(client).toContain("if (path === '/api/realtime/session') return 'voice'");
    expect(client).toContain("if (path === '/api/assessment') return 'saved_analysis'");
    expect(client).toContain("throw new ApiError('consent_required', 403");
  });

  it('uses bearer guest credentials rather than self-declared consent headers', () => {
    expect(client).toContain('Authorization:');
    expect(client).toContain('Bearer ${await guestToken(forceRefresh)}');
    expect(client).not.toMatch(/x-consent|x-voice-consent|x-analysis-consent/i);
  });
});
