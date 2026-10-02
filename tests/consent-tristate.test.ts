import { describe, expect, it } from 'vitest';
import { consentDecisionsComplete } from '../src/features/consent/consentState';
function decision(
  scope: 'voice' | 'saved_analysis',
  granted: boolean
) {
  return {
    id: scope,
    scope,
    granted,
    version: '2026-09-30.1',
    decidedAt: '2026-10-02T10:00:00.000Z',
    ...(granted
      ? {}
      : { withdrawnAt: '2026-10-02T10:00:00.000Z' }),
  };
}

describe('consent tri-state gate', () => {
  it('treats null as undecided', () => {
    expect(consentDecisionsComplete(null, null)).toBe(false);
    expect(
      consentDecisionsComplete(decision('voice', true), null)
    ).toBe(false);
  });

  it('accepts explicit refusal as a completed decision', () => {
    expect(
      consentDecisionsComplete(
        decision('voice', false),
        decision('saved_analysis', false)
      )
    ).toBe(true);
  });

  it('keeps the two scopes independent', () => {
    expect(
      consentDecisionsComplete(
        decision('voice', false),
        decision('saved_analysis', true)
      )
    ).toBe(true);
  });
});
