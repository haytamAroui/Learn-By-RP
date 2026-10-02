import { describe, expect, it } from 'vitest';
import { MISSION_CATALOG } from '../data/missions';
import {
  RETIRED_SCENARIO_FAMILY_IDS,
  SCENARIO_FAMILY_CATALOG,
  isReviewedScenarioFamily,
  scenarioFamilyFor,
  validateMissionScenarioFamily,
  validateScenarioFamilyCatalog,
} from './scenarioFamilies';
import type { ScenarioFamilyDefinition } from '../types';

describe('canonical scenario family catalog', () => {
  it('is structurally valid and uses unique stable ids', () => {
    const result = validateScenarioFamilyCatalog();
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);

    const ids = SCENARIO_FAMILY_CATALOG.map(family => family.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(RETIRED_SCENARIO_FAMILY_IDS.filter(id => ids.includes(id))).toEqual([]);
  });

  it('defines the current reviewed family set', () => {
    expect(SCENARIO_FAMILY_CATALOG.map(family => family.id).sort()).toEqual([
      'counter-ordering',
      'neighbour-coordination',
      'parcel-service',
      'pharmacy-consultation',
      'public-transit',
      'social-dining',
    ]);

    for (const family of SCENARIO_FAMILY_CATALOG) {
      expect(isReviewedScenarioFamily(family.id), family.id).toBe(true);
      expect(family.version, family.id).toBeGreaterThan(0);
      expect(family.reviewedAt, family.id).toBeTruthy();
      expect(family.reviewedBy, family.id).toBeTruthy();
      expect(family.includedContexts.length, family.id).toBeGreaterThan(0);
      expect(family.excludedContexts.length, family.id).toBeGreaterThan(0);
    }
  });

  it('allows one reviewed family to span more than one domain when explicitly authored', () => {
    const counter = scenarioFamilyFor('counter-ordering');
    expect(counter?.domainIds).toEqual(expect.arrayContaining(['cafes', 'services']));

    const cafe = MISSION_CATALOG.find(mission => mission.id === 'mission-es-cafe-sol')!;
    const convenience = MISSION_CATALOG.find(mission => mission.id === 'mission-ja-konbini')!;

    expect(cafe.scenarioFamilyId).toBe('counter-ordering');
    expect(convenience.scenarioFamilyId).toBe('counter-ordering');
    expect(cafe.category).not.toBe(convenience.category);
    expect(validateMissionScenarioFamily(cafe)).toEqual([]);
    expect(validateMissionScenarioFamily(convenience)).toEqual([]);
  });

  it('requires every mission to reference a known reviewed family inside its domain boundary', () => {
    for (const mission of MISSION_CATALOG) {
      expect(validateMissionScenarioFamily(mission), mission.id).toEqual([]);
    }
  });

  it('rejects an unknown family reference', () => {
    const mission = {
      ...MISSION_CATALOG[0],
      id: 'mission-test-unknown-family',
      scenarioFamilyId: 'family-not-in-catalog',
    };

    expect(validateMissionScenarioFamily(mission)).toEqual([
      'mission-test-unknown-family: unknown scenarioFamilyId family-not-in-catalog',
    ]);
  });

  it('rejects a draft family even when the id and domain otherwise match', () => {
    const mission = MISSION_CATALOG[0];
    const original = scenarioFamilyFor(mission.scenarioFamilyId)!;
    const draft: ScenarioFamilyDefinition = {
      ...original,
      reviewStatus: 'draft',
    };

    expect(validateMissionScenarioFamily(mission, [draft])).toEqual([
      `${mission.id}: scenario family ${draft.id} is draft, not reviewed`,
    ]);
  });

  it('rejects a mission whose domain falls outside the reviewed family boundary', () => {
    const mission = {
      ...MISSION_CATALOG[0],
      id: 'mission-test-wrong-domain',
      category: 'transit' as const,
    };

    expect(validateMissionScenarioFamily(mission)).toEqual([
      'mission-test-wrong-domain: domain transit is outside scenario family counter-ordering boundary',
    ]);
  });
});
