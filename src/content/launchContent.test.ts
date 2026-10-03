import { describe, expect, it } from 'vitest';
import { MISSION_CATALOG } from '../data/missions';
import { communicativeSkillFor } from './skills';
import { getScene } from './scenes';
import {
  SPANISH_LAUNCH_CONTENT_V1,
  validateLaunchContentCoverage,
} from './launchContent';

describe('Spanish launch content coverage', () => {
  it('uses eight executable Spanish missions across reviewed scenario families', () => {
    const result = validateLaunchContentCoverage();

    expect(result.valid, result.errors.join('\n')).toBe(true);
    expect(SPANISH_LAUNCH_CONTENT_V1.missionIds).toHaveLength(8);
  });

  it('gives every launch-core skill at least three executable scenario families', () => {
    const result = validateLaunchContentCoverage();

    expect(result.valid, result.errors.join('\n')).toBe(true);
    for (const item of result.coverage) {
      expect(item.scenarioFamilyIds.length).toBeGreaterThanOrEqual(
        SPANISH_LAUNCH_CONTENT_V1.minFamiliesPerCoreSkill
      );
    }
  });

  it('derives coverage from authored opportunities rather than mission labels', () => {
    const result = validateLaunchContentCoverage();
    const bySkill = new Map(
      result.coverage.map(item => [item.skillId, item.scenarioFamilyIds.length])
    );

    expect(bySkill.get('skill-inquire-specifications')).toBe(8);
    expect(bySkill.get('skill-propose-alternative')).toBe(4);
    expect(bySkill.get('skill-request-substitution')).toBe(4);
    expect(bySkill.get('skill-request-repetition')).toBe(4);
    expect(bySkill.get('skill-ask-clarification')).toBe(4);
    expect(bySkill.get('skill-check-understanding')).toBe(5);
  });
  it('keeps canonical skill provenance aligned with every launch opportunity', () => {
    for (const missionId of SPANISH_LAUNCH_CONTENT_V1.missionIds) {
      const mission = MISSION_CATALOG.find(item => item.id === missionId)!;
      const scene = getScene(mission.sceneId!)!;

      for (const opportunity of scene.opportunityDefinitions) {
        const skill = communicativeSkillFor(opportunity.skillId)!;
        expect(
          skill.associatedMissions,
          `${opportunity.skillId} missing ${mission.id}`
        ).toContain(mission.id);
      }
    }
  });

});
