import { describe, expect, it } from 'vitest';
import {
  applyResult,
  createInitialScene,
  evaluateCompletion,
  evaluatePredicate,
  permissibleOptions,
  reduceSceneAction,
  validatePayload,
} from './sceneReducer';
import { CAFE_SCENE, PHARMACY_SCENE, getScene } from '../../content/scenes';
import { SceneActionProposal, SceneDefinition, SceneStateSnapshot } from '../../contracts/scene';

const SESSION = 'session-1';

function freshState(scene = CAFE_SCENE): SceneStateSnapshot {
  return createInitialScene(scene, SESSION, 'attempt-1');
}

function proposal(overrides: Partial<SceneActionProposal> = {}): SceneActionProposal {
  return {
    actionId: 'act-1',
    sessionId: SESSION,
    attemptId: 'attempt-1',
    expectedSceneRevision: 1,
    action: 'confirm_order_item',
    payload: { item: 'café con leche' },
    sourceTurnIds: ['p-1'],
    ...overrides,
  };
}

describe('evaluatePredicate', () => {
  const facts = {
    itemConfirmed: true,
    serviceMode: 'unset',
    count: 2,
  };

  it('supports eq, neq, in and exists', () => {
    expect(evaluatePredicate({ op: 'eq', fact: 'itemConfirmed', value: true }, facts)).toBe(true);
    expect(evaluatePredicate({ op: 'neq', fact: 'serviceMode', value: 'takeaway' }, facts)).toBe(true);
    expect(
      evaluatePredicate(
        { op: 'in', fact: 'serviceMode', values: ['takeaway', 'for_here'] },
        facts
      )
    ).toBe(false);
    expect(evaluatePredicate({ op: 'exists', fact: 'count' }, facts)).toBe(true);
    expect(evaluatePredicate({ op: 'exists', fact: 'missing' }, facts)).toBe(false);
  });

  it('supports bounded numeric comparisons', () => {
    expect(evaluatePredicate({ op: 'gte', fact: 'count', value: 2 }, facts)).toBe(true);
    expect(evaluatePredicate({ op: 'lte', fact: 'count', value: 1 }, facts)).toBe(false);
  });

  it('composes and, or and not', () => {
    expect(
      evaluatePredicate(
        {
          op: 'and',
          predicates: [
            { op: 'eq', fact: 'itemConfirmed', value: true },
            {
              op: 'or',
              predicates: [
                { op: 'eq', fact: 'serviceMode', value: 'takeaway' },
                { op: 'eq', fact: 'serviceMode', value: 'for_here' },
              ],
            },
          ],
        },
        facts
      )
    ).toBe(false);

    expect(
      evaluatePredicate(
        {
          op: 'not',
          predicate: { op: 'eq', fact: 'serviceMode', value: 'takeaway' },
        },
        facts
      )
    ).toBe(true);
  });

  it('supports deterministic action counts', () => {
    expect(
      evaluatePredicate(
        {
          op: 'countOf',
          action: 'confirm_order_item',
          comparator: 'gte',
          value: 2,
        },
        facts,
        { confirm_order_item: 2 }
      )
    ).toBe(true);
  });
});

describe('validatePayload', () => {
  const schema = CAFE_SCENE.actionSchemas.confirm_order_item;

  it('accepts a valid payload', () => {
    expect(validatePayload(schema, { item: 'café con leche' }).valid).toBe(true);
  });

  it('rejects a missing required field', () => {
    const result = validatePayload(schema, {});
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/missing required field/i);
  });

  it('rejects an unsupported field', () => {
    const result = validatePayload(schema, { item: 'x', sneaky: 'y' });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/unsupported field/i);
  });

  it('rejects a non-object payload', () => {
    expect(validatePayload(schema, 'nope').valid).toBe(false);
  });
});

describe('reduceSceneAction — acceptance', () => {
  it('applies an allowed action and advances the revision', () => {
    const result = reduceSceneAction({ scene: CAFE_SCENE, state: freshState(), proposal: proposal() });

    expect(result.accepted).toBe(true);
    expect(result.newFacts.itemConfirmed).toBe(true);
    expect(result.revision).toBe(2);
  });

  it('adds a checkpoint when its predicate starts holding', () => {
    let state = freshState();
    state = applyResult(CAFE_SCENE, state, reduceSceneAction({ scene: CAFE_SCENE, state, proposal: proposal() }));
    state = applyResult(
      CAFE_SCENE,
      state,
      reduceSceneAction({
        scene: CAFE_SCENE,
        state,
        proposal: proposal({
          actionId: 'act-2',
          expectedSceneRevision: 2,
          action: 'confirm_takeaway',
          payload: {},
        }),
      })
    );

    expect(state.checkpoints.map(cp => cp.id)).toContain('cp-item-confirmed');
    expect(state.checkpoints.map(cp => cp.id)).toContain('cp-service-settled');
  });
});

describe('reduceSceneAction — rejection (test #2)', () => {
  it('rejects an action that is not in the allowlist', () => {
    const result = reduceSceneAction({
      scene: CAFE_SCENE,
      state: freshState(),
      proposal: proposal({ action: 'give_free_coffee' }),
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/not permitted/i);
  });

  it('returns the permissible options alongside a rejection', () => {
    const result = reduceSceneAction({
      scene: CAFE_SCENE,
      state: freshState(),
      proposal: proposal({ action: 'give_free_coffee' }),
    });

    expect(result.permissibleOptions).toContain('confirm_order_item');
  });

  it('rejects an action whose preconditions do not hold', () => {
    const result = reduceSceneAction({
      scene: CAFE_SCENE,
      state: freshState(),
      proposal: proposal({ action: 'confirm_takeaway', payload: {} }),
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/precondition/i);
  });

  it('rejects a proposal for another session', () => {
    const result = reduceSceneAction({
      scene: CAFE_SCENE,
      state: freshState(),
      proposal: proposal({ sessionId: 'someone-elses-session' }),
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/does not belong/i);
  });

  it('rejects a proposal from a different attempt', () => {
    const result = reduceSceneAction({
      scene: CAFE_SCENE,
      state: freshState(),
      proposal: proposal({ attemptId: 'attempt-99' }),
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/different attempt/i);
  });

  it('leaves facts untouched when rejected', () => {
    const before = freshState();
    const result = reduceSceneAction({
      scene: CAFE_SCENE,
      state: before,
      proposal: proposal({ action: 'confirm_takeaway', payload: {} }),
    });

    expect(result.newFacts).toEqual(before.facts);
    expect(result.revision).toBe(before.revision);
  });
});

describe('finite effects', () => {
  it('sets only an authored finite fact value and keeps sibling facts', () => {
    const scene: SceneDefinition = {
      ...CAFE_SCENE,
      allowedActions: [
        {
          name: 'confirm_order_item',
          actor: 'character',
          description: 'test action',
          preconditions: [],
          effects: [{ set: 'trainDepartsSoon', value: false }],
        },
      ],
      communicationChallenges: [],
      opportunityDefinitions: [],
    };

    const result = reduceSceneAction({
      scene,
      state: freshState(scene),
      proposal: proposal(),
    });

    expect(result.accepted).toBe(true);
    expect(result.newFacts.trainDepartsSoon).toBe(false);
    expect(result.newFacts.menuVisible).toBe(true);
  });
});

describe('reduceSceneAction — idempotency (test #3)', () => {
  it('applies a duplicated actionId once and returns the prior result', () => {
    const state = freshState();
    const applied = new Map();

    const first = reduceSceneAction({ scene: CAFE_SCENE, state, proposal: proposal(), appliedResults: applied });
    applied.set(first.actionId, first);

    const second = reduceSceneAction({
      scene: CAFE_SCENE,
      state: { ...state, revision: first.revision, facts: first.newFacts },
      proposal: proposal(),
      appliedResults: applied,
    });

    expect(first.accepted).toBe(true);
    expect(first.deduplicated).toBe(false);

    expect(second.accepted).toBe(true);
    expect(second.deduplicated).toBe(true);
    expect(second.revision).toBe(first.revision);
    expect(second.newFacts).toEqual(first.newFacts);
  });

  it('does not apply the effect twice even when facts changed', () => {
    const state = freshState();
    const applied = new Map();

    const first = reduceSceneAction({ scene: CAFE_SCENE, state, proposal: proposal(), appliedResults: applied });
    applied.set(first.actionId, first);

    const second = reduceSceneAction({
      scene: CAFE_SCENE,
      state: { ...state, revision: 99, facts: { tampered: true } },
      proposal: proposal(),
      appliedResults: applied,
    });

    // The duplicate returns the original facts, not the tampered ones.
    expect(second.newFacts.itemConfirmed).toBe(true);
    expect(second.newFacts.tampered).toBeUndefined();
  });
});

describe('reduceSceneAction — stale revision (test #6)', () => {
  it('rejects a proposal built against an old revision', () => {
    const result = reduceSceneAction({
      scene: CAFE_SCENE,
      state: { ...freshState(), revision: 5 },
      proposal: proposal({ expectedSceneRevision: 2 }),
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/stale scene revision/i);
  });

  it('accepts a proposal built against the current revision', () => {
    const result = reduceSceneAction({
      scene: CAFE_SCENE,
      state: { ...freshState(), revision: 5 },
      proposal: proposal({ expectedSceneRevision: 5 }),
    });

    expect(result.accepted).toBe(true);
  });
});

describe('completion (test #1: paraphrase succeeds, wrong item does not)', () => {
  it('is not achieved by an item alone', () => {
    const facts = { ...CAFE_SCENE.initialFacts, itemConfirmed: true };
    expect(evaluateCompletion(CAFE_SCENE, facts)).toBe('partial');
  });

  it('is achieved once an item and a service mode are both settled', () => {
    const facts = {
      ...CAFE_SCENE.initialFacts,
      itemConfirmed: true,
      serviceMode: 'for_here',
    };
    expect(evaluateCompletion(CAFE_SCENE, facts)).toBe('achieved');
  });

  it('is achieved via takeaway as well as for here', () => {
    const facts = {
      ...CAFE_SCENE.initialFacts,
      itemConfirmed: true,
      serviceMode: 'takeaway',
    };
    expect(evaluateCompletion(CAFE_SCENE, facts)).toBe('achieved');
  });

  it('does not complete on a scene that was never entered', () => {
    expect(evaluateCompletion(CAFE_SCENE, CAFE_SCENE.initialFacts)).toBe('unknown');
  });

  it('never completes purely on wording, only on facts', () => {
    // The reducer never sees the learner's sentence. A beautifully formed
    // request and a clumsy one that names an item are treated identically.
    const clumsy = {
      ...CAFE_SCENE.initialFacts,
      itemConfirmed: true,
      serviceMode: 'for_here',
    };
    expect(evaluateCompletion(CAFE_SCENE, clumsy)).toBe('achieved');
  });
});

describe('complication', () => {
  it('is available because oat milk is authored as unavailable', () => {
    const state = freshState();
    expect(CAFE_SCENE.complication).toBeDefined();
    expect(evaluatePredicate(CAFE_SCENE.complication!.trigger, state.facts)).toBe(true);
  });

  it('is limited to one occurrence per scene', () => {
    expect(CAFE_SCENE.complication!.maxPerScene).toBe(1);
  });
});

describe('permissibleOptions', () => {
  it('narrows as the scene progresses', () => {
    const initial = permissibleOptions(CAFE_SCENE, CAFE_SCENE.initialFacts);
    expect(initial).toContain('confirm_order_item');
    expect(initial).not.toContain('confirm_takeaway');

    const afterItem = permissibleOptions(CAFE_SCENE, {
      ...CAFE_SCENE.initialFacts,
      itemConfirmed: true,
    });
    expect(afterItem).toContain('confirm_takeaway');
  });
});

describe('the reducer is not specialised to one scene', () => {
  it('applies to the pharmacy scene with its own completion rule', () => {
    const state = createInitialScene(PHARMACY_SCENE, SESSION, 'attempt-1');

    const result = reduceSceneAction({
      scene: PHARMACY_SCENE,
      state,
      proposal: proposal({ action: 'ask_about_ingredient', payload: { ingredient: 'somnio' } }),
    });

    expect(result.accepted).toBe(true);
    expect(result.newFacts.ingredientQuestionAsked).toBe(true);
  });

  it('rejects an action allowlisted only in the other scene', () => {
    const result = reduceSceneAction({
      scene: PHARMACY_SCENE,
      state: createInitialScene(PHARMACY_SCENE, SESSION, 'attempt-1'),
      proposal: proposal({ action: 'confirm_takeaway', payload: {} }),
    });

    expect(result.accepted).toBe(false);
  });

  it('is looked up by scene id', () => {
    expect(getScene(CAFE_SCENE.id)).toBe(CAFE_SCENE);
    expect(getScene('nope')).toBeUndefined();
  });
});
