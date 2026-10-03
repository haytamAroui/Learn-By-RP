import { describe, expect, it } from 'vitest';
import { MISSION_CATALOG } from '../../data/missions';
import {
  characterBehaviorPromptRules,
  isRegulatedHealthMission,
  validateCharacterBehaviorPolicy,
} from './characterPolicy';

describe('character behavior policy', () => {
  it('keeps every current authored mission within the release policy', () => {
    for (const mission of MISSION_CATALOG) {
      expect(validateCharacterBehaviorPolicy(mission), mission.id).toEqual([]);
    }
  });

  it('recognises pharmacy content as regulated', () => {
    const pharmacy = MISSION_CATALOG.find(
      mission => mission.scenarioFamilyId === 'pharmacy-consultation'
    )!;
    expect(isRegulatedHealthMission(pharmacy)).toBe(true);
    expect(characterBehaviorPromptRules(true).join(' ')).toMatch(/Do not diagnose/);
  });

  it('rejects authored individualized dosing in a regulated mission', () => {
    const pharmacy = MISSION_CATALOG.find(
      mission => mission.scenarioFamilyId === 'pharmacy-consultation'
    )!;
    const unsafe = {
      ...pharmacy,
      character: {
        ...pharmacy.character,
        knowledgeBoundary: [
          ...pharmacy.character.knowledgeBoundary,
          'Knows dosage: two tablets three times a day',
        ],
      },
    };

    expect(validateCharacterBehaviorPolicy(unsafe)).toEqual([
      expect.stringMatching(/regulated-domain/),
    ]);
  });

  it('rejects authored abusive character behavior', () => {
    const mission = MISSION_CATALOG[0];
    const unsafe = {
      ...mission,
      character: {
        ...mission.character,
        personality: 'Threatens and humiliates the learner when they hesitate',
      },
    };
    expect(validateCharacterBehaviorPolicy(unsafe)).toEqual([
      expect.stringMatching(/behavior policy/),
    ]);
  });
});
