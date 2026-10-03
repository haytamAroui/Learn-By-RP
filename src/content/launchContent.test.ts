import { describe, expect, it } from 'vitest';
import { MISSION_CATALOG } from '../data/missions';
import { communicativeSkillFor } from './skills';
import { getScene } from './scenes';
import {
  FLEMISH_LAUNCH_CONTENT_V1,
  LAUNCH_CONTENT_SPECS,
  SPANISH_LAUNCH_CONTENT_V1,
  validateLaunchContentCoverage,
} from './launchContent';

const EXPECTED_CORE_COUNTS = {
  'skill-inquire-specifications': 8,
  'skill-propose-alternative': 4,
  'skill-request-substitution': 4,
  'skill-request-repetition': 4,
  'skill-ask-clarification': 4,
  'skill-check-understanding': 5,
} as const;

describe.each(LAUNCH_CONTENT_SPECS)(
  '$targetLocale launch content coverage',
  spec => {
    it('uses eight executable missions across reviewed scenario families', () => {
      const result = validateLaunchContentCoverage(spec);

      expect(result.valid, result.errors.join('\n')).toBe(true);
      expect(spec.missionIds).toHaveLength(8);
    });

    it('gives every launch-core skill at least three executable scenario families', () => {
      const result = validateLaunchContentCoverage(spec);

      expect(result.valid, result.errors.join('\n')).toBe(true);
      for (const item of result.coverage) {
        expect(item.scenarioFamilyIds.length).toBeGreaterThanOrEqual(
          spec.minFamiliesPerCoreSkill
        );
      }
    });

    it('derives coverage from authored opportunities rather than mission labels', () => {
      const result = validateLaunchContentCoverage(spec);
      const bySkill = new Map(
        result.coverage.map(item => [item.skillId, item.scenarioFamilyIds.length])
      );

      for (const [skillId, expected] of Object.entries(EXPECTED_CORE_COUNTS)) {
        expect(bySkill.get(skillId), `${spec.targetLocale}/${skillId}`).toBe(expected);
      }
    });

    it('keeps canonical skill provenance aligned with every launch opportunity', () => {
      for (const missionId of spec.missionIds) {
        const mission = MISSION_CATALOG.find(item => item.id === missionId)!;
        const scene = getScene(mission.sceneId!)!;

        for (const opportunity of scene.opportunityDefinitions) {
          const skill = communicativeSkillFor(opportunity.skillId)!;
          expect(
            skill.associatedMissions,
            `${spec.targetLocale}/${opportunity.skillId} missing ${mission.id}`
          ).toContain(mission.id);
        }
      }
    });
  }
);

describe('Flemish substitution opportunity semantics', () => {
  it('credits only an explicit learner request, never accepting a ready-made option', () => {
    for (const missionId of FLEMISH_LAUNCH_CONTENT_V1.missionIds) {
      const mission = MISSION_CATALOG.find(item => item.id === missionId)!;
      const scene = getScene(mission.sceneId!)!;

      for (const opportunity of scene.opportunityDefinitions.filter(
        item => item.skillId === 'skill-request-substitution'
      )) {
        expect(opportunity.relevantActionIds, opportunity.id).toContain(
          'request_substitute'
        );
        expect(
          opportunity.negativeExamples.some(example =>
            /accept|choose|select/i.test(example)
          ),
          opportunity.id
        ).toBe(true);
        expect(
          opportunity.positiveExamples.some(example =>
            /accepts|chooses|selects/i.test(example)
          ),
          opportunity.id
        ).toBe(false);
      }
    }
  });
});

describe('launch content locale identities', () => {
  it('keeps Spanish and Flemish content as independent locale packs', () => {
    expect(SPANISH_LAUNCH_CONTENT_V1.targetLocale).toBe('es-ES');
    expect(FLEMISH_LAUNCH_CONTENT_V1.targetLocale).toBe('nl-BE');
    expect(
      new Set([
        ...SPANISH_LAUNCH_CONTENT_V1.missionIds,
        ...FLEMISH_LAUNCH_CONTENT_V1.missionIds,
      ]).size
    ).toBe(16);
  });
});
