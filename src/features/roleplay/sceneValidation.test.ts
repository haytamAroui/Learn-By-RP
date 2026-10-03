import { describe, expect, it } from 'vitest';
import { CAFE_SCENE, PHARMACY_SCENE, SCENES } from '../../content/scenes';
import { SceneDefinition } from '../../contracts/scene';
import {
  MAX_PREDICATE_DEPTH,
  validateSceneDefinition,
} from './sceneValidation';

describe('finite scene definition validation', () => {
  it('accepts every released authored scene', () => {
    for (const scene of Object.values(SCENES)) {
      const result = validateSceneDefinition(scene);
      expect(result.errors, scene.id).toEqual([]);
      expect(result.valid, scene.id).toBe(true);
    }
  });

  it('requires a reviewed speech variety for released Dutch scenes', () => {
    const scene = Object.values(SCENES).find(
      candidate => candidate.id === 'scene.nl-be.cafe.breakfast'
    )!;

    const invalid: SceneDefinition = {
      ...scene,
      speechVariety: undefined,
    };

    expect(validateSceneDefinition(invalid).errors.join('\n')).toMatch(
      /released Dutch scenes require a reviewed variety label/i
    );
  });

  it('rejects an effect that writes an undeclared fact', () => {
    const scene: SceneDefinition = {
      ...CAFE_SCENE,
      allowedActions: CAFE_SCENE.allowedActions.map(action =>
        action.name === 'confirm_order_item'
          ? {
              ...action,
              effects: [{ set: 'inventedFact', value: true }],
            }
          : action
      ),
    };

    expect(validateSceneDefinition(scene).errors.join('\n')).toMatch(
      /writes undeclared fact inventedFact/i
    );
  });

  it('rejects a value outside a fact enum', () => {
    const scene: SceneDefinition = {
      ...CAFE_SCENE,
      allowedActions: CAFE_SCENE.allowedActions.map(action =>
        action.name === 'confirm_takeaway'
          ? {
              ...action,
              effects: [{ set: 'serviceMode', value: 'teleport' }],
            }
          : action
      ),
    };

    expect(validateSceneDefinition(scene).errors.join('\n')).toMatch(
      /outside serviceMode's domain/i
    );
  });

  it('rejects predicates that reference undeclared facts', () => {
    const scene: SceneDefinition = {
      ...PHARMACY_SCENE,
      completion: [
        {
          name: 'achieved',
          predicate: { op: 'eq', fact: 'imaginary', value: true },
        },
      ],
    };

    expect(validateSceneDefinition(scene).errors.join('\n')).toMatch(
      /references undeclared fact imaginary/i
    );
  });

  it('bounds predicate depth', () => {
    let predicate: any = { op: 'eq', fact: 'itemConfirmed', value: true };
    for (let i = 0; i < MAX_PREDICATE_DEPTH + 1; i += 1) {
      predicate = { op: 'not', predicate };
    }

    const scene: SceneDefinition = {
      ...CAFE_SCENE,
      completion: [{ name: 'achieved', predicate }],
    };

    expect(validateSceneDefinition(scene).errors.join('\n')).toMatch(
      /predicate depth exceeds/i
    );
  });

  it('rejects a pressure branch whose trigger references undeclared scene state', () => {
    const scene: SceneDefinition = {
      ...CAFE_SCENE,
      pressureBranches: [
        {
          ...CAFE_SCENE.pressureBranches[0],
          trigger: { op: 'eq', fact: 'inventedPressureFact', value: true },
        },
      ],
    };

    expect(validateSceneDefinition(scene).errors.join('\n')).toMatch(
      /pressureBranches\[0\]\.trigger: references undeclared fact inventedPressureFact/i
    );
  });

  it('rejects a pressure branch without a reviewed actor instruction', () => {
    const scene: SceneDefinition = {
      ...CAFE_SCENE,
      pressureBranches: [
        {
          ...CAFE_SCENE.pressureBranches[0],
          actorInstruction: '   ',
        },
      ],
    };

    expect(validateSceneDefinition(scene).errors.join('\n')).toMatch(
      /pressureBranches\[0\]: actorInstruction must not be empty/i
    );
  });

  it('rejects a communication challenge whose opportunity binding is broken', () => {
    const scene: SceneDefinition = {
      ...CAFE_SCENE,
      communicationChallenges: CAFE_SCENE.communicationChallenges.map(
        challenge =>
          challenge.id === 'challenge.es.cafe.mishear-service-mode'
            ? { ...challenge, opportunityId: 'opp.missing' }
            : challenge
      ),
    };

    expect(validateSceneDefinition(scene).errors.join('\n')).toMatch(
      /opportunity opp\.missing does not exist/i
    );
  });

  it('rejects opportunity skills not declared by the scene', () => {
    const scene: SceneDefinition = {
      ...CAFE_SCENE,
      opportunityDefinitions: [
        {
          ...CAFE_SCENE.opportunityDefinitions[0],
          skillId: 'skill-not-declared',
        },
      ],
    };

    expect(validateSceneDefinition(scene).errors.join('\n')).toMatch(
      /not declared by scene\.skillIds/i
    );
  });
});
