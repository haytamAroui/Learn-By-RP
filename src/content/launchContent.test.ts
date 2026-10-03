import { describe, expect, it } from 'vitest';
import {
  SPANISH_LAUNCH_CONTENT_V1,
  validateLaunchContentCoverage,
} from './launchContent';

describe('Spanish launch content coverage', () => {
  it('uses six executable Spanish missions across reviewed scenario families', () => {
    const result = validateLaunchContentCoverage();

    expect(result.valid, result.errors.join('\n')).toBe(true);
    expect(SPANISH_LAUNCH_CONTENT_V1.missionIds).toHaveLength(6);
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

    expect(bySkill.get('skill-inquire-specifications')).toBe(6);
    expect(bySkill.get('skill-propose-alternative')).toBe(3);
    expect(bySkill.get('skill-request-substitution')).toBe(3);
    expect(bySkill.get('skill-request-repetition')).toBe(3);
    expect(bySkill.get('skill-ask-clarification')).toBe(3);
    expect(bySkill.get('skill-check-understanding')).toBe(3);
  });
});
