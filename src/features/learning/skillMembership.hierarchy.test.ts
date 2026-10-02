import { describe, expect, it } from 'vitest';
import {
  allowedSkillIds,
  evidentiarySkillIds,
  evidentiarySkillsForMission,
  missionFor,
} from './skillMembership';

describe('mission skill evidence allowlist', () => {
  it('keeps derived families for pedagogy but removes them from assessment', () => {
    const mission = missionFor('mission-es-cafe-sol')!;
    expect(allowedSkillIds(mission)).toContain('skill-communicative-repair');
    expect(evidentiarySkillIds(mission)).not.toContain('skill-communicative-repair');
    expect(evidentiarySkillsForMission(mission.id).map(skill => skill.id))
      .not.toContain('skill-communicative-repair');
  });

  it('keeps direct mission skills eligible for assessment', () => {
    const mission = missionFor('mission-es-cafe-sol')!;
    expect(evidentiarySkillIds(mission)).toEqual(expect.arrayContaining([
      'skill-request-substitution',
      'skill-inquire-specifications',
      'skill-propose-alternative',
    ]));
  });
});
