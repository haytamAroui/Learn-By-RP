import { describe, expect, it } from 'vitest';
import { SPANISH_DAILY_SERVICES_PILOT } from '../../data/programs';
import type {
  SkillLapse,
  SkillObservation,
  SupportExposure,
} from '../../types';
import { recommendNextRp } from './nextRp';

const NOW = Date.parse('2026-10-02T12:00:00.000Z');

function observation(
  overrides: Partial<SkillObservation> = {}
): SkillObservation {
  return {
    id: 'obs-1',
    skillId: 'skill-request-substitution',
    sessionId: 's-1',
    attemptId: 'attempt-1',
    sourcePassageId: 'p-1',
    sourceRevision: 'rev-1',
    contextKey: {
      domainId: 'cafes',
      scenarioFamilyId: 'counter-ordering',
      scenarioId: 'scene.es.cafe.breakfast',
    },
    modality: 'spoken',
    retrieval: 'unassisted',
    taskOutcome: 'achieved',
    demonstration: 'demonstrated',
    opportunityInstanceId: 'opp-1',
    supportExposureIds: [],
    evidenceSource: 'validated_explicit',
    quote: 'Entonces, leche de almendra.',
    dayKey: '2026-10-01',
    reasonCode: 'validated_demonstration',
    policyVersion: 3,
    recordedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

function lapse(
  id: string,
  recordedAt: string
): SkillLapse {
  return {
    id,
    skillId: 'skill-request-substitution',
    sessionId: `session-${id}`,
    attemptId: 'attempt-1',
    sourcePassageId: `passage-${id}`,
    sourceRevision: 'rev-1',
    contextKey: {
      domainId: 'cafes',
      scenarioFamilyId: `family-${id}`,
    },
    opportunityInstanceId: `opp-${id}`,
    demonstration: 'attempted_not_demonstrated',
    basis: 'cold_attempt_failed',
    dayKey: recordedAt.slice(0, 10),
    reasonCode: 'cold_taken_opportunity_not_demonstrated',
    policyVersion: 3,
    recordedAt,
  };
}

const BASE = {
  program: SPANISH_DAILY_SERVICES_PILOT,
  goal: {
    targetLanguage: 'es' as const,
    targetLocale: 'es-ES',
    domain: 'travel' as const,
    contextId: 'daily-services',
  },
  programPreferences: {
    programId: SPANISH_DAILY_SERVICES_PILOT.id,
    skippedMissionIds: [],
    pinnedMissionIds: [],
    mutedSkillIds: [],
  },
  supportHistory: [] as SupportExposure[],
  recentScenarioFamilyIds: ['counter-ordering'],
  completedMissionIds: ['mission-es-cafe-sol'],
  missionReadiness: [
    { missionId: 'mission-es-cafe-sol', ready: true },
    { missionId: 'mission-es-farmacia-sol', ready: true },
  ],
  now: NOW,
};

describe('deterministic next-RP policy', () => {
  it('transfers independent success to another scenario family', () => {
    const result = recommendNextRp({
      ...BASE,
      observations: [observation()],
      lapses: [],
    });

    expect(result).toMatchObject({
      kind: 'transfer',
      missionId: 'mission-es-farmacia-sol',
      targetSkillId: 'skill-request-substitution',
      reasonCode: 'INDEPENDENT_SUCCESS_TRANSFER',
      requiresLearnerConfirmation: false,
    });
  });

  it('turns supported success into a cold transfer, not independent credit', () => {
    const result = recommendNextRp({
      ...BASE,
      observations: [observation({ retrieval: 'assisted' })],
      lapses: [],
    });

    expect(result).toMatchObject({
      kind: 'transfer',
      missionId: 'mission-es-farmacia-sol',
      reasonCode: 'SUPPORTED_SUCCESS_COLD_TRANSFER',
    });
  });

  it('uses a genuine strict lapse to trigger recovery', () => {
    const result = recommendNextRp({
      ...BASE,
      observations: [],
      lapses: [lapse('1', '2026-10-01T10:00:00.000Z')],
    });

    expect(result).toMatchObject({
      kind: 'recovery',
      missionId: 'mission-es-farmacia-sol',
      reasonCode: 'STRICT_LAPSE_RECOVERY',
    });
  });

  it('does not infer weakness when no strict lapse exists', () => {
    const result = recommendNextRp({
      ...BASE,
      observations: [],
      lapses: [],
    });

    expect(result).toMatchObject({
      kind: 'continue',
      missionId: 'mission-es-farmacia-sol',
      reasonCode: 'PROGRAM_NEXT_READY',
    });
  });

  it('is deterministic for identical evidence and policy input', () => {
    const input = {
      ...BASE,
      observations: [observation()],
      lapses: [],
    };

    expect(recommendNextRp(input)).toEqual(recommendNextRp(input));
  });

  it('offers final simulation only after all reviewed program missions are complete', () => {
    const result = recommendNextRp({
      ...BASE,
      observations: [],
      lapses: [],
      completedMissionIds: SPANISH_DAILY_SERVICES_PILOT.missionPlan.map(
        item => item.missionId
      ),
    });

    expect(result).toEqual({
      policyVersion: 1,
      kind: 'final_simulation',
      reasonCode: 'PROGRAM_CORE_COMPLETE',
      requiresLearnerConfirmation: true,
    });
  });

  it('requires learner confirmation for optional challenge', () => {
    const result = recommendNextRp({
      ...BASE,
      completedMissionIds: [],
      recentScenarioFamilyIds: [
        'counter-ordering',
        'pharmacy-consultation',
      ],
      observations: [
        observation({ id: 'obs-1', recordedAt: '2026-09-30T10:00:00.000Z' }),
        observation({
          id: 'obs-2',
          sourcePassageId: 'p-2',
          recordedAt: '2026-10-01T10:00:00.000Z',
        }),
      ],
      lapses: [],
    });

    expect(result.kind).toBe('challenge');
    expect(result.requiresLearnerConfirmation).toBe(true);
    expect(result.reasonCode).toBe('REPEATED_SUCCESS_CHALLENGE');
  });
});
