import { getScene } from './scenes';
import { MISSION_CATALOG } from '../data/missions';
import type { CommunicativeSkillId, ScenarioFamilyId } from '../types';

export interface LaunchContentSpec {
  id: string;
  targetLanguage: string;
  targetLocale: string;
  missionIds: readonly string[];
  coreSkillIds: readonly CommunicativeSkillId[];
  minFamiliesPerCoreSkill: number;
}

export const SPANISH_LAUNCH_CONTENT_V1: LaunchContentSpec = {
  id: 'launch.es-es.daily-life.v1',
  targetLanguage: 'es',
  targetLocale: 'es-ES',
  missionIds: [
    'mission-es-cafe-sol',
    'mission-es-parcel-counter',
    'mission-es-neighbors-door',
    'mission-es-metro-station',
    'mission-es-farmacia-sol',
    'mission-es-la-terraza',
    'mission-es-hotel-checkin',
    'mission-es-bike-rental',
  ],
  coreSkillIds: [
    'skill-inquire-specifications',
    'skill-propose-alternative',
    'skill-request-substitution',
    'skill-request-repetition',
    'skill-ask-clarification',
    'skill-check-understanding',
  ],
  minFamiliesPerCoreSkill: 3,
};

export interface LaunchContentCoverage {
  skillId: CommunicativeSkillId;
  scenarioFamilyIds: ScenarioFamilyId[];
}

export interface LaunchContentValidation {
  valid: boolean;
  errors: string[];
  coverage: LaunchContentCoverage[];
}

export function validateLaunchContentCoverage(
  spec: LaunchContentSpec = SPANISH_LAUNCH_CONTENT_V1
): LaunchContentValidation {
  const errors: string[] = [];
  const familiesBySkill = new Map<CommunicativeSkillId, Set<ScenarioFamilyId>>(
    spec.coreSkillIds.map(skillId => [skillId, new Set<ScenarioFamilyId>()])
  );

  for (const missionId of spec.missionIds) {
    const mission = MISSION_CATALOG.find(candidate => candidate.id === missionId);
    if (!mission) {
      errors.push(`${spec.id}: unknown mission ${missionId}`);
      continue;
    }
    if (mission.language !== spec.targetLanguage) {
      errors.push(
        `${spec.id}/${missionId}: language ${mission.language} != ${spec.targetLanguage}`
      );
    }
    if (!mission.sceneId) {
      errors.push(`${spec.id}/${missionId}: executable scene is required`);
      continue;
    }

    const scene = getScene(mission.sceneId);
    if (!scene) {
      errors.push(`${spec.id}/${missionId}: scene ${mission.sceneId} is missing`);
      continue;
    }
    if (scene.reviewStatus !== 'released') {
      errors.push(
        `${spec.id}/${missionId}: scene ${scene.id} is ${scene.reviewStatus}, not released`
      );
    }

    const opportunitySkills = new Set(
      scene.opportunityDefinitions.map(opportunity => opportunity.skillId)
    );
    for (const skillId of spec.coreSkillIds) {
      if (opportunitySkills.has(skillId)) {
        familiesBySkill.get(skillId)!.add(mission.scenarioFamilyId);
      }
    }
  }

  const coverage = spec.coreSkillIds.map(skillId => ({
    skillId,
    scenarioFamilyIds: [...(familiesBySkill.get(skillId) ?? new Set())].sort(),
  }));

  for (const item of coverage) {
    if (item.scenarioFamilyIds.length < spec.minFamiliesPerCoreSkill) {
      errors.push(
        `${spec.id}/${item.skillId}: ${item.scenarioFamilyIds.length} executable scenario families; minimum is ${spec.minFamiliesPerCoreSkill}`
      );
    }
  }

  return { valid: errors.length === 0, errors, coverage };
}
