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

  it('does not count an authored pressure variant as a new transfer context', () => {
    const base = observation({
      id: 'base-pressure',
      sessionId: 'session-base-pressure',
      recordedAt: '2026-09-01T09:00:00.000Z',
      domainId: 'cafes',
      scenarioFamilyId: 'counter-ordering',
      scenarioId: 'scene.es.cafe.breakfast',
    });
    const pressured = observation({
      id: 'pressure-variant',
      sessionId: 'session-pressure-variant',
      recordedAt: '2026-09-03T09:00:00.000Z',
      domainId: 'cafes',
      scenarioFamilyId: 'counter-ordering',
      scenarioId: 'scene.es.cafe.breakfast#pressure.es.cafe.concise-followup',
    });

    const projection = projectSkill(SKILL_ID, [base, pressured]);

    expect(skillContextIdentity(base)).toBe('cafes::counter-ordering');
    expect(skillContextIdentity(pressured)).toBe('cafes::counter-ordering');
    expect(projection.independentContexts).toEqual(['cafes::counter-ordering']);
  });

  it('does not count a speech-variety variant as a new transfer context', () => {
    const standard = observation({
      id: 'standard-variety',
      sessionId: 'session-standard-variety',
      recordedAt: '2026-09-01T09:00:00.000Z',
      domainId: 'cafes',
      scenarioFamilyId: 'counter-ordering',
      scenarioId: 'scene.nl-be.cafe.breakfast#standard',
    });
    const colloquial = observation({
      id: 'colloquial-variety',
      sessionId: 'session-colloquial-variety',
      recordedAt: '2026-09-03T09:00:00.000Z',
      domainId: 'cafes',
      scenarioFamilyId: 'counter-ordering',
      scenarioId: 'scene.nl-be.cafe.breakfast#light-colloquial',
    });

    const projection = projectSkill(SKILL_ID, [standard, colloquial]);

    expect(skillContextIdentity(standard)).toBe('cafes::counter-ordering');
    expect(skillContextIdentity(colloquial)).toBe('cafes::counter-ordering');
    expect(projection.independentContexts).toEqual(['cafes::counter-ordering']);
  });

  it('does not let a retry create a new transfer context', () => {
    const firstAttempt = observation({
      id: 'retry-parent',
      sessionId: 'session-retry-parent',
      recordedAt: '2026-09-01T09:00:00.000Z',
      domainId: 'cafes',
      scenarioFamilyId: 'counter-ordering',
      scenarioId: 'scene.es.cafe.breakfast',
    });
    const retryAttempt = {
      ...observation({
        id: 'retry-child',
        sessionId: 'session-retry-child',
        recordedAt: '2026-09-01T09:05:00.000Z',
        domainId: 'cafes',
        scenarioFamilyId: 'counter-ordering',
        scenarioId: 'scene.es.cafe.breakfast',
      }),
      attemptId: 'attempt-retry-2',
    };

    const projection = projectSkill(SKILL_ID, [firstAttempt, retryAttempt]);

    expect(skillContextIdentity(firstAttempt)).toBe(skillContextIdentity(retryAttempt));
    expect(projection.independentContexts).toEqual(['cafes::counter-ordering']);
  });

  it('counts the same reviewed family in a different domain as a distinct context', () => {
    const cafe = observation({
      id: 'cafe-domain',
      sessionId: 'session-cafe-domain',
      recordedAt: '2026-09-01T09:00:00.000Z',
      domainId: 'cafes',
      scenarioFamilyId: 'counter-ordering',
    });
    const convenience = observation({
      id: 'service-domain',
      sessionId: 'session-service-domain',
      recordedAt: '2026-09-03T09:00:00.000Z',
      domainId: 'services',
      scenarioFamilyId: 'counter-ordering',
    });

    const projection = projectSkill(SKILL_ID, [cafe, convenience]);

    expect(projection.independentContexts).toEqual([
      'cafes::counter-ordering',
      'services::counter-ordering',
    ]);
    expect(projection.status).toBe('growing');
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
