import { describe, expect, it } from 'vitest';
import { MISSION_CATALOG } from '../data/missions';
import { FLEMISH_WORK_LOGISTICS_PILOT, validateProgramAgainstCatalog } from '../data/programs';
import { modelCheckScene } from '../features/roleplay/sceneModelChecker';
import { validateProgramForActivation } from '../features/program/releaseGates';
import { resolveProgramCandidate } from '../features/program/goalResolver';
import { validateSceneDefinition } from '../features/roleplay/sceneValidation';
import { validateMissionScenarioFamily } from './scenarioFamilies';
import { NL_BE_WORK_DAMAGED_DELIVERY_SCENE } from './scenes/work.nlBE';
import { getScene } from './scenes';

describe('Taalbad Werk pilot contracts', () => {
  const mission = MISSION_CATALOG.find(
    item => item.id === 'mission-nl-be-work-damaged-delivery'
  );

  it('registers one NL-BE workplace mission without replacing daily-life missions', () => {
    expect(mission).toBeDefined();
    expect(mission?.language).toBe('nl');
    expect(mission?.scenarioFamilyId).toBe('workplace-incident-handover');
    expect(MISSION_CATALOG.some(item => item.id === 'mission-nl-be-koffiebar')).toBe(true);
    expect(validateMissionScenarioFamily(mission!)).toEqual([]);
    expect(getScene(mission!.sceneId!)).toBe(NL_BE_WORK_DAMAGED_DELIVERY_SCENE);
  });

  it('passes deterministic scene syntax and has a reachable achieved completion', () => {
    const validation = validateSceneDefinition(NL_BE_WORK_DAMAGED_DELIVERY_SCENE);
    expect(validation.errors).toEqual([]);
    const model = modelCheckScene(NL_BE_WORK_DAMAGED_DELIVERY_SCENE);
    expect(model.errors).toEqual([]);
    expect(model.achievedPath).not.toBeNull();
    expect(model.reachableOpportunityIds).toContain('opp.nl-be.work.report-damage');
  });

  it('is an authored but intentionally non-executable preview', () => {
    expect(validateProgramAgainstCatalog(FLEMISH_WORK_LOGISTICS_PILOT).errors).toEqual([]);
    expect(FLEMISH_WORK_LOGISTICS_PILOT.reviewStatus).toBe('draft');
    expect(NL_BE_WORK_DAMAGED_DELIVERY_SCENE.reviewStatus).toBe('draft');
    expect(validateProgramForActivation(FLEMISH_WORK_LOGISTICS_PILOT).ready).toBe(false);
    const candidate = resolveProgramCandidate({ learningLanguage: 'nl', primaryGoal: 'work', contextId: 'logistics-warehouse' });
    expect(candidate.match).toBe('exact');
    expect(candidate.executable).toBe(false);
  });

  it('does not invent workplace readiness or employer evaluation', () => {
    expect(FLEMISH_WORK_LOGISTICS_PILOT.finalSimulation).toBeUndefined();
    expect(NL_BE_WORK_DAMAGED_DELIVERY_SCENE.opportunityDefinitions).toHaveLength(3);
    expect(NL_BE_WORK_DAMAGED_DELIVERY_SCENE.skillIds).toContain('skill-report-workplace-problem');
  });
});
