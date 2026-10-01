import { describe, expect, it } from 'vitest';
import { projectSkill, skillContextIdentity } from './skillProjection';
import type { SkillObservation } from '../../types';

const SKILL_ID = 'skill-request-substitution';

function observation(input: {
  id: string;
  sessionId: string;
  recordedAt: string;
  domainId: string;
  scenarioFamilyId: string;
  scenarioId?: string;
}): SkillObservation {
  return {
    id: input.id,
    skillId: SKILL_ID,
    sessionId: input.sessionId,
    attemptId: 'attempt-1',
    sourcePassageId: `passage-${input.id}`,
    sourceRevision: 'rev-1',
    contextKey: {
      domainId: input.domainId,
      scenarioFamilyId: input.scenarioFamilyId,
      scenarioId: input.scenarioId,
    },
    modality: 'spoken',
    retrieval: 'unassisted',
    taskOutcome: 'achieved',
    demonstration: 'demonstrated',
    supportExposureIds: [],
    evidenceSource: 'validated_explicit',
    quote: 'Could I have another option?',
    recordedAt: input.recordedAt,
  };
}

describe('skill context identity', () => {
  it('does not treat different sessions or scenario variants in one family as transfer', () => {
    const first = observation({
      id: 'one',
      sessionId: 'session-cafe-a',
      recordedAt: '2026-09-01T09:00:00.000Z',
      domainId: 'cafes',
      scenarioFamilyId: 'counter-ordering',
      scenarioId: 'cafe-a',
    });
    const second = observation({
      id: 'two',
      sessionId: 'session-cafe-b',
      recordedAt: '2026-09-03T09:00:00.000Z',
      domainId: 'cafes',
      scenarioFamilyId: 'counter-ordering',
      scenarioId: 'cafe-b',
    });

    expect(skillContextIdentity(first)).toBe('cafes::counter-ordering');
    expect(skillContextIdentity(second)).toBe('cafes::counter-ordering');

    const projection = projectSkill(SKILL_ID, [first, second]);

    expect(projection.independentContexts).toEqual(['cafes::counter-ordering']);
    expect(projection.status).toBe('supported');
  });

  it('counts a genuinely different scenario family as a distinct transfer context', () => {
    const counter = observation({
      id: 'counter',
      sessionId: 'session-counter',
      recordedAt: '2026-09-01T09:00:00.000Z',
      domainId: 'cafes',
      scenarioFamilyId: 'counter-ordering',
    });
    const parcel = observation({
      id: 'parcel',
      sessionId: 'session-parcel',
      recordedAt: '2026-09-03T09:00:00.000Z',
      domainId: 'services',
      scenarioFamilyId: 'parcel-service',
    });

    const projection = projectSkill(SKILL_ID, [counter, parcel]);

    expect(projection.independentContexts).toEqual([
      'cafes::counter-ordering',
      'services::parcel-service',
    ]);
    expect(projection.status).toBe('growing');
  });
});
