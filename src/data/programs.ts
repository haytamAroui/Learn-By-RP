import { RoleplayProgram, validateRoleplayProgram } from '../contracts/program';
import { MISSION_CATALOG } from './missions';
import { getScene } from '../content/scenes';
import { LEARNING_POLICY_VERSION } from '../features/learning/policy';

/**
 * First executable consumer of the curated-program contract.
 *
 * Deliberately a pilot/draft: only missions with released, model-checked scenes
 * are pinned here. Expanding to a launch program remains a content-review task.
 */
export const SPANISH_DAILY_SERVICES_PILOT: RoleplayProgram = {
  id: 'program.es-es.daily-services.pilot',
  version: 1,
  targetLanguage: 'es',
  targetLocale: 'es-ES',
  policyVersion: LEARNING_POLICY_VERSION,
  title: 'Spanish Daily Services Pilot',
  reviewStatus: 'draft',
  missionPlan: [
    {
      missionId: 'mission-es-cafe-sol',
      missionVersion: 1,
      sceneId: 'scene.es.cafe.breakfast',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-es-farmacia-sol',
      missionVersion: 1,
      sceneId: 'scene.es.pharmacy.symptom',
      sceneVersion: 1,
    },
  ],
};

export const ROLEPLAY_PROGRAM_CATALOG: RoleplayProgram[] = [
  SPANISH_DAILY_SERVICES_PILOT,
];

export interface ProgramCatalogValidation {
  valid: boolean;
  errors: string[];
}

export function validateProgramAgainstCatalog(
  program: RoleplayProgram
): ProgramCatalogValidation {
  const base = validateRoleplayProgram(program);
  const errors = [...base.errors];

  for (const [index, entry] of program.missionPlan.entries()) {
    const path = `missionPlan[${index}]`;
    const mission = MISSION_CATALOG.find(candidate => candidate.id === entry.missionId);

    if (!mission) {
      errors.push(`${path}: unknown mission ${entry.missionId}`);
      continue;
    }
    if (mission.version !== entry.missionVersion) {
      errors.push(
        `${path}: mission version pin ${entry.missionVersion} != catalog ${mission.version}`
      );
    }
    if (mission.language !== program.targetLanguage) {
      errors.push(
        `${path}: mission language ${mission.language} != program ${program.targetLanguage}`
      );
    }

    if (entry.sceneId) {
      if (mission.sceneId !== entry.sceneId) {
        errors.push(`${path}: scene pin does not match mission.sceneId`);
        continue;
      }
      const scene = getScene(entry.sceneId);
      if (!scene) {
        errors.push(`${path}: unknown scene ${entry.sceneId}`);
        continue;
      }
      if (scene.version !== entry.sceneVersion) {
        errors.push(
          `${path}: scene version pin ${entry.sceneVersion} != catalog ${scene.version}`
        );
      }
      if (scene.reviewStatus !== 'released') {
        errors.push(`${path}: scene ${scene.id} is not released`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
