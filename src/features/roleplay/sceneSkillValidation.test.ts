import { describe, expect, it } from 'vitest';
import { CAFE_SCENE } from '../../content/scenes';
import { validateSceneDefinition } from './sceneValidation';

describe('scene opportunity skill specificity', () => {
  it('rejects a derived parent skill as an authored opportunity target', () => {
    const scene = {
      ...CAFE_SCENE,
      skillIds: [...CAFE_SCENE.skillIds, 'skill-communicative-repair'],
      opportunityDefinitions: [{
        ...CAFE_SCENE.opportunityDefinitions[0],
        id: 'opp.test.derived-repair',
        skillId: 'skill-communicative-repair',
      }],
    };

    const result = validateSceneDefinition(scene);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'opportunityDefinitions[0]: skill skill-communicative-repair is derived and cannot own an opportunity'
    );
  });

  it('rejects an unknown skill as an authored opportunity target', () => {
    const scene = {
      ...CAFE_SCENE,
      skillIds: [...CAFE_SCENE.skillIds, 'skill-invented'],
      opportunityDefinitions: [{
        ...CAFE_SCENE.opportunityDefinitions[0],
        id: 'opp.test.unknown',
        skillId: 'skill-invented',
      }],
    };

    const result = validateSceneDefinition(scene);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'opportunityDefinitions[0]: skill skill-invented is not in the canonical skill catalog'
    );
  });
});
