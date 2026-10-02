import { describe, expect, it } from 'vitest';
import { CAFE_SCENE, SCENES } from '../../content/scenes';
import { SceneDefinition } from '../../contracts/scene';
import { modelCheckScene } from './sceneModelChecker';

describe('scene model checker', () => {
  it('finds an achieved path for every released scene with no structural reachability errors', () => {
    for (const scene of Object.values(SCENES)) {
      const report = modelCheckScene(scene);
      expect(report.errors, `${scene.id}: ${report.errors.join('; ')}`).toEqual([]);
      expect(report.achievedPath, scene.id).not.toBeNull();
      expect(report.reachableStateCount, scene.id).toBeGreaterThan(1);
    }
  });

  it('proves every authored opportunity in released scenes is reachable', () => {
    for (const scene of Object.values(SCENES)) {
      const report = modelCheckScene(scene);
      expect(new Set(report.reachableOpportunityIds)).toEqual(
        new Set(scene.opportunityDefinitions.map(item => item.id))
      );
    }
  });

  it('detects an authored action whose valid precondition can never hold', () => {
    const impossible: SceneDefinition = {
      ...CAFE_SCENE,
      allowedActions: CAFE_SCENE.allowedActions.map(action =>
        action.name === 'ask_about_ingredient'
          ? {
              ...action,
              preconditions: [
                {
                  op: 'and',
                  predicates: [
                    { op: 'eq', fact: 'menuVisible', value: true },
                    { op: 'eq', fact: 'menuVisible', value: false },
                  ],
                },
              ],
            }
          : action
      ),
      opportunityDefinitions: CAFE_SCENE.opportunityDefinitions.filter(
        item => !item.relevantActionIds?.includes('ask_about_ingredient')
      ),
    };

    expect(modelCheckScene(impossible).errors.join('\n')).toMatch(
      /dead action: ask_about_ingredient/i
    );
  });

  it('tracks countOf predicates without making the state space infinite', () => {
    const counted: SceneDefinition = {
      ...CAFE_SCENE,
      completion: [
        {
          name: 'achieved',
          predicate: {
            op: 'countOf',
            action: 'confirm_order_item',
            comparator: 'gte',
            value: 2,
          },
        },
      ],
    };

    const report = modelCheckScene(counted);
    expect(report.achievedPath).not.toBeNull();
    expect(
      report.achievedPath?.filter(step => step.action === 'confirm_order_item').length
    ).toBeGreaterThanOrEqual(2);
    expect(report.reachableStateCount).toBeLessThan(4096);
  });
});
