import { describe, expect, it } from 'vitest';
import { SPANISH_DAILY_SERVICES_PILOT } from '../../data/programs';
import { MISSION_CATALOG } from '../../data/missions';
import {
  validateMissionForProgramRelease,
  validateProgramForActivation,
} from './releaseGates';

describe('program release gates', () => {
  it('keeps a draft program previewable but non-executable', () => {
    const result = validateProgramForActivation(SPANISH_DAILY_SERVICES_PILOT);
    expect(result.ready).toBe(false);
    expect(result.errors.some(error => /not released/.test(error))).toBe(true);
  });

  it('accepts the currently pinned mission mechanics as content-ready', () => {
    for (const ref of SPANISH_DAILY_SERVICES_PILOT.missionPlan) {
      const mission = MISSION_CATALOG.find(item => item.id === ref.missionId)!;
      expect(validateMissionForProgramRelease(mission)).toEqual({
        ready: true,
        errors: [],
      });
    }
  });

  it('rejects a released program if a pinned mission is unknown', () => {
    const result = validateProgramForActivation({
      ...SPANISH_DAILY_SERVICES_PILOT,
      reviewStatus: 'released',
      missionPlan: [
        ...SPANISH_DAILY_SERVICES_PILOT.missionPlan,
        { missionId: 'invented-runtime-mission', missionVersion: 1 },
      ],
    });

    expect(result.ready).toBe(false);
    expect(result.errors.some(error => /unknown mission/.test(error))).toBe(true);
  });

  it('requires a real cross-family transfer path for multi-mission programs', () => {
    const cafe = SPANISH_DAILY_SERVICES_PILOT.missionPlan[0];
    const result = validateProgramForActivation({
      ...SPANISH_DAILY_SERVICES_PILOT,
      reviewStatus: 'released',
      missionPlan: [cafe, { ...cafe, missionId: cafe.missionId + '-copy' }],
    });

    expect(result.ready).toBe(false);
  });
});
