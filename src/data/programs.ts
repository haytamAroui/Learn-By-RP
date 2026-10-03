import { RoleplayProgram, validateRoleplayProgram } from '../contracts/program';
import { MISSION_CATALOG } from './missions';
import { getScene } from '../content/scenes';
import { LEARNING_POLICY_VERSION } from '../features/learning/policy';
import { validateMissionScenarioFamily } from '../content/scenarioFamilies';

/**
 * First executable consumer of the curated-program contract.
 *
 * Curated Spanish launch-content path. All pinned missions must have released,
 * model-checked scenes. The program remains draft until locale/native review and
 * final-simulation content are approved.
 */
export const SPANISH_DAILY_SERVICES_PILOT: RoleplayProgram = {
  id: 'program.es-es.daily-services.pilot',
  version: 3,
  targetLanguage: 'es',
  targetLocale: 'es-ES',
  policyVersion: LEARNING_POLICY_VERSION,
  title: 'Spanish Everyday Life',
  reviewStatus: 'draft',
  missionPlan: [
    {
      missionId: 'mission-es-cafe-sol',
      missionVersion: 2,
      sceneId: 'scene.es.cafe.breakfast',
      sceneVersion: 2,
    },
    {
      missionId: 'mission-es-parcel-counter',
      missionVersion: 2,
      sceneId: 'scene.es.parcel.reschedule',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-es-neighbors-door',
      missionVersion: 2,
      sceneId: 'scene.es.neighbor.key-handover',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-es-farmacia-sol',
      missionVersion: 1,
      sceneId: 'scene.es.pharmacy.symptom',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-es-la-terraza',
      missionVersion: 2,
      sceneId: 'scene.es.dining.terrace',
      sceneVersion: 1,
    },
  ],
};

export const SPANISH_TRAVEL_PILOT: RoleplayProgram = {
  id: 'program.es-es.travel.pilot',
  version: 1,
  targetLanguage: 'es',
  targetLocale: 'es-ES',
  policyVersion: LEARNING_POLICY_VERSION,
  title: 'Spanish Travel & Getting Around',
  reviewStatus: 'draft',
  missionPlan: [
    {
      missionId: 'mission-es-cafe-sol',
      missionVersion: 2,
      sceneId: 'scene.es.cafe.breakfast',
      sceneVersion: 2,
    },
    {
      missionId: 'mission-es-metro-station',
      missionVersion: 2,
      sceneId: 'scene.es.metro.ticket-platform',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-es-hotel-checkin',
      missionVersion: 1,
      sceneId: 'scene.es.hotel.checkin',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-es-bike-rental',
      missionVersion: 1,
      sceneId: 'scene.es.rental.bike',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-es-la-terraza',
      missionVersion: 2,
      sceneId: 'scene.es.dining.terrace',
      sceneVersion: 1,
    },
  ],
};

export const FLEMISH_EVERYDAY_PILOT: RoleplayProgram = {
  id: 'program.nl-be.everyday.pilot',
  version: 1,
  targetLanguage: 'nl',
  targetLocale: 'nl-BE',
  policyVersion: LEARNING_POLICY_VERSION,
  title: 'Nederlands in België — Dagelijks leven',
  reviewStatus: 'draft',
  missionPlan: [
    {
      missionId: 'mission-nl-be-koffiebar',
      missionVersion: 1,
      sceneId: 'scene.nl-be.cafe.breakfast',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-nl-be-pakjespunt',
      missionVersion: 1,
      sceneId: 'scene.nl-be.parcel.pickup',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-nl-be-buur-sleutel',
      missionVersion: 1,
      sceneId: 'scene.nl-be.neighbor.key',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-nl-be-apotheek',
      missionVersion: 1,
      sceneId: 'scene.nl-be.pharmacy.label',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-nl-be-terras',
      missionVersion: 1,
      sceneId: 'scene.nl-be.dining.terrace',
      sceneVersion: 1,
    },
  ],
};

export const FLEMISH_TRAVEL_PILOT: RoleplayProgram = {
  id: 'program.nl-be.travel.pilot',
  version: 1,
  targetLanguage: 'nl',
  targetLocale: 'nl-BE',
  policyVersion: LEARNING_POLICY_VERSION,
  title: 'Nederlands in België — Onderweg & op reis',
  reviewStatus: 'draft',
  missionPlan: [
    {
      missionId: 'mission-nl-be-koffiebar',
      missionVersion: 1,
      sceneId: 'scene.nl-be.cafe.breakfast',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-nl-be-metro',
      missionVersion: 1,
      sceneId: 'scene.nl-be.metro.route',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-nl-be-hotel',
      missionVersion: 1,
      sceneId: 'scene.nl-be.hotel.checkin',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-nl-be-fietsverhuur',
      missionVersion: 1,
      sceneId: 'scene.nl-be.rental.bike',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-nl-be-terras',
      missionVersion: 1,
      sceneId: 'scene.nl-be.dining.terrace',
      sceneVersion: 1,
    },
  ],
};

export const ROLEPLAY_PROGRAM_CATALOG: RoleplayProgram[] = [
  SPANISH_DAILY_SERVICES_PILOT,
  SPANISH_TRAVEL_PILOT,
  FLEMISH_EVERYDAY_PILOT,
  FLEMISH_TRAVEL_PILOT,
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

    for (const familyError of validateMissionScenarioFamily(mission)) {
      errors.push(`${path}: ${familyError}`);
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
