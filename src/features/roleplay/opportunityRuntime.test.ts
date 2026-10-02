import { describe, expect, it } from 'vitest';
import { CAFE_SCENE } from '../../content/scenes';
import { Passage } from '../../types';
import { applyResult, createInitialScene, reduceSceneAction } from './sceneReducer';
import {
  classifyOpportunity,
  declineOpportunity,
  finalizeNotPresentedOpportunities,
  syncAuthoredOpportunities,
  takeOpportunity,
} from './opportunityRuntime';

const SESSION = 'session-opportunity';
const ATTEMPT = 'attempt-opportunity';
const NOW = '2026-10-02T00:00:00.000Z';

function learnerPassage(overrides: Partial<Passage> = {}): Passage {
  return {
    id: 'passage-1',
    sessionId: SESSION,
    attemptId: ATTEMPT,
    speaker: 'user',
    revisionKey: 'rev-1',
    assemblyVersion: 1,
    status: 'final',
    text: 'Entonces, leche de almendra por favor.',
    modality: 'spoken',
    startedAt: NOW,
    endedAt: '2026-10-02T00:00:02.000Z',
    fragments: [],
    ...overrides,
  };
}

describe('authored opportunity runtime', () => {
  it('does not materialise an unavailable opportunity or infer weakness', () => {
    const state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);
    const instances = syncAuthoredOpportunities({
      scene: CAFE_SCENE,
      state,
      existing: [],
      recordedAt: NOW,
    });

    expect(
      instances.some(instance =>
        instance.opportunityId.includes('request-substitution')
      )
    ).toBe(false);
  });

  it('presents a validated opportunity when its authored scene predicate becomes true', () => {
    let state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);

    const result = reduceSceneAction({
      scene: CAFE_SCENE,
      state,
      proposal: {
        actionId: 'director-alternative-1',
        sessionId: SESSION,
        attemptId: ATTEMPT,
        expectedSceneRevision: 1,
        action: 'offer_alternative',
        payload: { alternative: 'leche de almendra' },
        sourceTurnIds: ['assistant-1'],
      },
    });
    state = applyResult(CAFE_SCENE, state, result);

    const instances = syncAuthoredOpportunities({
      scene: CAFE_SCENE,
      state,
      existing: [],
      recordedAt: NOW,
    });

    const substitution = instances.find(instance =>
      instance.opportunityId.includes('request-substitution')
    );
    expect(substitution).toMatchObject({
      status: 'presented',
      detection: 'validated',
      demonstration: 'unknown',
      skillId: 'skill-request-substitution',
    });
  });

  it('moves presented -> taken only with a final learner passage, then classifies demonstration', () => {
    const presented = {
      id: 'opportunity:test',
      attemptId: ATTEMPT,
      opportunityId: 'opp.test',
      skillId: 'skill-request-substitution',
      status: 'presented' as const,
      detection: 'validated' as const,
      demonstration: 'unknown' as const,
      recordedAt: NOW,
    };

    const taken = takeOpportunity(presented, learnerPassage());
    expect(taken).toMatchObject({
      status: 'taken',
      learnerAttemptPassageId: 'passage-1',
      learnerAttemptRevision: 'rev-1',
    });

    expect(classifyOpportunity(taken, 'demonstrated').demonstration).toBe('demonstrated');
  });

  it('rejects taking an opportunity with assistant or partial speech', () => {
    const presented = {
      id: 'opportunity:test',
      attemptId: ATTEMPT,
      opportunityId: 'opp.test',
      skillId: 'skill-request-substitution',
      status: 'presented' as const,
      detection: 'validated' as const,
      demonstration: 'unknown' as const,
      recordedAt: NOW,
    };

    expect(() =>
      takeOpportunity(presented, learnerPassage({ speaker: 'assistant' }))
    ).toThrow(/final learner passage/i);
    expect(() =>
      takeOpportunity(presented, learnerPassage({ status: 'partial' }))
    ).toThrow(/final learner passage/i);
  });

  it('supports explicit decline without producing a failed demonstration', () => {
    const presented = {
      id: 'opportunity:test',
      attemptId: ATTEMPT,
      opportunityId: 'opp.test',
      skillId: 'skill-request-substitution',
      status: 'presented' as const,
      detection: 'validated' as const,
      demonstration: 'unknown' as const,
      recordedAt: NOW,
    };

    expect(declineOpportunity(presented)).toMatchObject({
      status: 'declined',
      demonstration: 'unknown',
    });
  });

  it('finalises unreachable authored definitions as not_presented audit records', () => {
    const state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);
    const finalised = finalizeNotPresentedOpportunities({
      scene: CAFE_SCENE,
      state,
      existing: [],
      recordedAt: NOW,
    });

    expect(finalised).toHaveLength(CAFE_SCENE.opportunityDefinitions.length);
    expect(finalised.every(instance => instance.status === 'not_presented')).toBe(true);
    expect(finalised.every(instance => instance.demonstration === 'unknown')).toBe(true);
  });
});
