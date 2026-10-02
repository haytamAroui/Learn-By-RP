import { describe, expect, it } from 'vitest';
import type { Passage, SkillLapse, SupportExposure } from '../../types';
import {
  classifyAttemptLearningMode,
  isRecoveryEligible,
  isTransferEligible,
  pressurePolicyForLearningMode,
} from './rpModes';

const PASSAGE: Passage = {
  id: 'p-1',
  sessionId: 's-1',
  attemptId: 'a-1',
  speaker: 'user',
  revisionKey: 'r-1',
  assemblyVersion: 1,
  status: 'final',
  text: '¿Tiene leche de almendra?',
  modality: 'spoken',
  startedAt: '2026-10-02T10:00:00.000Z',
  endedAt: '2026-10-02T10:00:05.000Z',
  fragments: [],
};

const SUPPORT: SupportExposure = {
  id: 'exp-1',
  sessionId: 's-1',
  attemptId: 'a-1',
  source: 'coach',
  kind: 'full_form',
  targetSkillId: 'skill-request-substitution',
  targetOpportunityId: 'opp-1',
  targetItemIds: [],
  exposure: 'visible',
  policyVersion: 3,
  recordedAt: '2026-10-02T09:59:55.000Z',
};

const LAPSE: SkillLapse = {
  id: 'l-1',
  skillId: 'skill-request-substitution',
  sessionId: 's-1',
  attemptId: 'a-1',
  sourcePassageId: 'p-1',
  sourceRevision: 'r-1',
  contextKey: {
    domainId: 'cafes',
    scenarioFamilyId: 'counter-ordering',
  },
  opportunityInstanceId: 'opp-1',
  demonstration: 'attempted_not_demonstrated',
  basis: 'cold_attempt_failed',
  recordedAt: '2026-10-02T10:00:05.000Z',
};

describe('RP learning modes', () => {
  it('classifies an unsupported production opportunity as cold', () => {
    expect(
      classifyAttemptLearningMode({
        requestedMode: 'cold',
        passage: PASSAGE,
        attemptId: 'a-1',
        skillId: 'skill-request-substitution',
        opportunityInstanceId: 'opp-1',
        supportExposures: [],
        rehearsal: false,
      })
    ).toBe('cold');
  });

  it('classifies exact production support as guided', () => {
    expect(
      classifyAttemptLearningMode({
        requestedMode: 'cold',
        passage: PASSAGE,
        attemptId: 'a-1',
        skillId: 'skill-request-substitution',
        opportunityInstanceId: 'opp-1',
        supportExposures: [SUPPORT],
        rehearsal: false,
      })
    ).toBe('guided');
  });

  it('does not treat same-family variants as transfer', () => {
    expect(
      isTransferEligible({
        mode: 'transfer',
        rehearsal: false,
        skillId: 'skill-request-substitution',
        sourceScenarioFamilyId: 'counter-ordering',
        scenarioFamilyId: 'counter-ordering',
      })
    ).toBe(false);
  });

  it('never credits a retry/rehearsal as transfer', () => {
    expect(
      isTransferEligible({
        mode: 'transfer',
        rehearsal: true,
        skillId: 'skill-request-substitution',
        sourceScenarioFamilyId: 'counter-ordering',
        scenarioFamilyId: 'pharmacy-consultation',
      })
    ).toBe(false);
  });

  it('permits recovery only from a matching strict lapse', () => {
    expect(
      isRecoveryEligible({
        lapse: LAPSE,
        targetSkillId: 'skill-request-substitution',
        consecutiveRecoveries: 0,
      })
    ).toEqual({
      eligible: true,
      offRampRequired: false,
      reason: 'strict_lapse',
    });

    expect(
      isRecoveryEligible({
        targetSkillId: 'skill-request-substitution',
        consecutiveRecoveries: 0,
      }).eligible
    ).toBe(false);
  });

  it('caps recovery pressure at manageable even when stretch was requested', () => {
    expect(
      pressurePolicyForLearningMode({
        mode: 'recovery',
        learnerOptedIn: true,
        requestedCeiling: 'stretch',
      })
    ).toEqual({
      enabled: true,
      allowedLevels: ['manageable'],
    });
  });

  it('keeps pressure disabled when the learner did not opt in', () => {
    expect(
      pressurePolicyForLearningMode({
        mode: 'recovery',
        learnerOptedIn: false,
        requestedCeiling: 'stretch',
      })
    ).toEqual({
      enabled: false,
      allowedLevels: [],
    });
  });

  it('caps consecutive recoveries and requires an off-ramp', () => {
    expect(
      isRecoveryEligible({
        lapse: LAPSE,
        targetSkillId: 'skill-request-substitution',
        consecutiveRecoveries: 2,
      })
    ).toEqual({
      eligible: false,
      offRampRequired: true,
      reason: 'recovery_cap_reached',
    });
  });
});
