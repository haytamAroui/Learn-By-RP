import { describe, expect, it } from 'vitest';
import { CAFE_SCENE } from '../../content/scenes';
import { OpportunityInstance } from '../../types';
import { applyResult, createInitialScene, reduceSceneAction } from './sceneReducer';
import { acceptSemanticCandidate, decideDirector } from './director';

const SESSION = 'director-session';
const ATTEMPT = 'attempt-1';

describe('deterministic director', () => {
  it('selects only the authored complication when its trigger is true', () => {
    const state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);
    const decision = decideDirector({
      scene: CAFE_SCENE,
      state,
      opportunities: [],
    });

    expect(decision).toEqual({
      kind: 'trigger_complication',
      complicationId: CAFE_SCENE.complication?.id,
      reason: 'authored_trigger_true',
    });
  });

  it('does not repeat a complication already fired', () => {
    const state = {
      ...createInitialScene(CAFE_SCENE, SESSION, ATTEMPT),
      firedComplications: [CAFE_SCENE.complication!.id],
    };

    expect(
      decideDirector({ scene: CAFE_SCENE, state, opportunities: [] }).kind
    ).toBe('none');
  });

  it('selects an authored opportunity after its scene condition becomes true', () => {
    let state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);
    state = {
      ...state,
      firedComplications: [CAFE_SCENE.complication!.id],
    };

    const result = reduceSceneAction({
      scene: CAFE_SCENE,
      state,
      proposal: {
        actionId: 'offer-1',
        sessionId: SESSION,
        attemptId: ATTEMPT,
        expectedSceneRevision: state.revision,
        action: 'offer_alternative',
        payload: { alternative: 'leche de almendra' },
        sourceTurnIds: ['assistant-1'],
      },
    });
    state = applyResult(CAFE_SCENE, state, result);

    const decision = decideDirector({
      scene: CAFE_SCENE,
      state,
      opportunities: [],
    });

    expect(decision).toMatchObject({
      kind: 'present_opportunity',
      opportunityId: 'opp.es.cafe.request-substitution.after-alternative',
      skillId: 'skill-request-substitution',
    });
  });

  it('does not re-select an opportunity already materialised for this attempt', () => {
    let state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);
    state = {
      ...state,
      firedComplications: [CAFE_SCENE.complication!.id],
      facts: {
        ...state.facts,
        alternativeOffered: true,
      },
    };

    const existing: OpportunityInstance[] = [
      {
        id: 'opportunity:attempt-1:opp.es.cafe.request-substitution.after-alternative',
        attemptId: ATTEMPT,
        opportunityId: 'opp.es.cafe.request-substitution.after-alternative',
        skillId: 'skill-request-substitution',
        status: 'presented',
        detection: 'validated',
        demonstration: 'unknown',
        recordedAt: '2026-10-02T00:00:00.000Z',
      },
    ];

    const decision = decideDirector({
      scene: CAFE_SCENE,
      state,
      opportunities: existing,
    });

    expect(decision.kind).not.toBe('present_opportunity');
  });

  it('never turns a semantic unknown into an executable mutation', () => {
    expect(
      acceptSemanticCandidate({ intentId: 'something', unknown: true })
    ).toEqual({
      accepted: false,
      reason: 'unknown_or_non_executable',
    });
  });
});
