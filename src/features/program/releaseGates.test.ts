import { describe, expect, it } from 'vitest';
import { ROLEPLAY_PROGRAM_CATALOG, SPANISH_DAILY_SERVICES_PILOT } from '../../data/programs';
import { MISSION_CATALOG } from '../../data/missions';
import { getScene } from '../../content/scenes';
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

  it('accepts released scenes while blocking unreviewed workplace pilot scenes', () => {
    const refs = ROLEPLAY_PROGRAM_CATALOG.flatMap(program => program.missionPlan);
    const seen = new Set<string>();

    for (const ref of refs) {
      const key = `${ref.missionId}@${ref.missionVersion}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const mission = MISSION_CATALOG.find(
        item => item.id === ref.missionId && item.version === ref.missionVersion
      )!;
      const outcome = validateMissionForProgramRelease(mission);
      if (mission.sceneId && getScene(mission.sceneId)?.reviewStatus !== 'released') {
        expect(outcome.ready, key).toBe(false);
        expect(outcome.errors.some(error => error.includes('not released')), key).toBe(true);
      } else {
        expect(outcome, key).toEqual({ ready: true, errors: [] });
      }
    }
  });

  it('rejects released mission content when scene phrases or skills drift from the mission catalog', () => {
    const cafe = MISSION_CATALOG.find(item => item.id === 'mission-es-cafe-sol')!;

    const phraseDrift = validateMissionForProgramRelease({
      ...cafe,
      usefulPhrases: cafe.usefulPhrases.filter(
        phrase => phrase.id !== 'phrase.es.cafe_con_leche'
      ),
    });
    expect(phraseDrift.ready).toBe(false);
    expect(phraseDrift.errors.some(error => /scene phrase/.test(error))).toBe(true);

    const skillDrift = validateMissionForProgramRelease({
      ...cafe,
      secondarySkillIds: [],
    });
    expect(skillDrift.ready).toBe(false);
    expect(skillDrift.errors.some(error => /scene skill/.test(error))).toBe(true);
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
