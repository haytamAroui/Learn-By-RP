import { describe, expect, it } from 'vitest';
import { SupportExposure } from '../../types';
import { inheritSupportForRetry } from './retrySupport';

const EXPOSURE: SupportExposure = {
  id: 'exp-1',
  sessionId: 's-1',
  attemptId: 'attempt-1',
  source: 'coach',
  kind: 'full_form',
  targetSkillId: 'skill-request-substitution',
  targetPhraseId: 'phrase-1',
  targetItemIds: ['phrase-1'],
  exposure: 'visible',
  policyVersion: 3,
  recordedAt: '2026-10-02T10:00:00.000Z',
};

describe('inheritSupportForRetry', () => {
  it('copies prior support into the retry without changing the original', () => {
    const result = inheritSupportForRetry({
      exposures: [EXPOSURE],
      fromAttemptId: 'attempt-1',
      toAttemptId: 'attempt-2',
      recordedAt: '2026-10-02T10:01:00.000Z',
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(EXPOSURE);
    expect(result[1]).toMatchObject({
      attemptId: 'attempt-2',
      source: 'retry',
      kind: 'full_form',
      targetSkillId: 'skill-request-substitution',
      targetPhraseId: 'phrase-1',
    });
  });

  it('does not duplicate inherited support on replay', () => {
    const first = inheritSupportForRetry({
      exposures: [EXPOSURE],
      fromAttemptId: 'attempt-1',
      toAttemptId: 'attempt-2',
      recordedAt: '2026-10-02T10:01:00.000Z',
    });
    const second = inheritSupportForRetry({
      exposures: first,
      fromAttemptId: 'attempt-1',
      toAttemptId: 'attempt-2',
      recordedAt: '2026-10-02T10:02:00.000Z',
    });

    expect(second.filter(item => item.attemptId === 'attempt-2')).toHaveLength(1);
  });
});
