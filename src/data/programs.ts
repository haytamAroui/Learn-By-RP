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

export const FLEMISH_WORK_PILOT: RoleplayProgram = {
  id: 'program.nl-be.work.pilot',
  version: 1,
  targetLanguage: 'nl',
  targetLocale: 'nl-BE',
  policyVersion: LEARNING_POLICY_VERSION,
  title: 'Nederlands op de Werkvloer — Werkdutch',
  reviewStatus: 'draft',
  missionPlan: [
    {
      missionId: 'mission-nl-be-eerste-werkdag',
      missionVersion: 1,
    },
    {
      missionId: 'mission-nl-be-werkinstructie',
      missionVersion: 1,
    },
    {
      missionId: 'mission-nl-be-probleem-melden',
      missionVersion: 1,
    },
    {
      missionId: 'mission-nl-be-ziekte-melden',
      missionVersion: 1,
    },
    {
      missionId: 'mission-nl-be-werf-controle',
      missionVersion: 1,
    },
  ],
};

export const FLEMISH_TUSSENTAAL_PILOT: RoleplayProgram = {
  id: 'program.nl-be.tussentaal.pilot',
  version: 1,
  targetLanguage: 'nl',
  targetLocale: 'nl-BE',
  policyVersion: LEARNING_POLICY_VERSION,
  title: 'Vlaamse Tussentaal — Vlot & Informeel',
  reviewStatus: 'draft',
  missionPlan: [
    {
      missionId: 'mission-nl-be-buur-sleutel',
      missionVersion: 1,
      sceneId: 'scene.nl-be.neighbor.key',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-nl-be-tussentaal-buur',
      missionVersion: 1,
    },
    {
      missionId: 'mission-nl-be-tussentaal-weekend',
      missionVersion: 1,
    },
    {
      missionId: 'mission-nl-be-terras',
      missionVersion: 1,
      sceneId: 'scene.nl-be.dining.terrace',
      sceneVersion: 1,
    },
    {
      missionId: 'mission-nl-be-tussentaal-uitdrukkingen',
      missionVersion: 1,
    },
  ],
};


export const FLEMISH_A1_FOUNDATION_PROGRAM: RoleplayProgram = {
  id: 'program.nl-be.a1.foundation',
  version: 1,
  targetLanguage: 'nl',
  targetLocale: 'nl-BE',
  policyVersion: LEARNING_POLICY_VERSION,
  title: 'Nederlands A1 — Basis & Eerste Contact',
  reviewStatus: 'draft',
  missionPlan: [
    { missionId: 'mission-nl-be-koffiebar', missionVersion: 1, sceneId: 'scene.nl-be.cafe.breakfast', sceneVersion: 1 },
    { missionId: 'mission-nl-be-eerste-werkdag', missionVersion: 1 },
    { missionId: 'mission-nl-be-werkinstructie', missionVersion: 1 },
    { missionId: 'mission-nl-be-u01-begroeten', missionVersion: 1 },
    { missionId: 'mission-nl-be-u02-voorstellen', missionVersion: 1 },
    { missionId: 'mission-nl-be-u03-wonen', missionVersion: 1 },
    { missionId: 'mission-nl-be-u04-herkomst', missionVersion: 1 },
    { missionId: 'mission-nl-be-u05-beleefdheid', missionVersion: 1 },
    { missionId: 'mission-nl-be-u06-fout-corrigeren', missionVersion: 1 },
    { missionId: 'mission-nl-be-u09-telefoon-adres', missionVersion: 1 },
    { missionId: 'mission-nl-be-u10-mensen', missionVersion: 1 },
    { missionId: 'mission-nl-be-u11-spullen', missionVersion: 1 },
    { missionId: 'mission-nl-be-u12-huis', missionVersion: 1 },
    { missionId: 'mission-nl-be-u13-routine', missionVersion: 1 },
    { missionId: 'mission-nl-be-u14-vrije-tijd', missionVersion: 1 },
    { missionId: 'mission-nl-be-u15-prijzen', missionVersion: 1 },
    { missionId: 'mission-nl-be-u18-bakker', missionVersion: 1 },
    { missionId: 'mission-nl-be-u22-markt', missionVersion: 1 },
    { missionId: 'mission-nl-be-u26-loket', missionVersion: 1 },
    { missionId: 'mission-nl-be-u31-wensen', missionVersion: 1 },
  ],
};

export const FLEMISH_A2_WORK_EVERYDAY_PROGRAM: RoleplayProgram = {
  id: 'program.nl-be.a2.everyday-work',
  version: 1,
  targetLanguage: 'nl',
  targetLocale: 'nl-BE',
  policyVersion: LEARNING_POLICY_VERSION,
  title: 'Nederlands A2 — Zelfstandigheid & Werkvloer',
  reviewStatus: 'draft',
  missionPlan: [
    { missionId: 'mission-nl-be-pakjespunt', missionVersion: 1, sceneId: 'scene.nl-be.parcel.pickup', sceneVersion: 1 },
    { missionId: 'mission-nl-be-buur-sleutel', missionVersion: 1, sceneId: 'scene.nl-be.neighbor.key', sceneVersion: 1 },
    { missionId: 'mission-nl-be-metro', missionVersion: 1, sceneId: 'scene.nl-be.metro.route', sceneVersion: 1 },
    { missionId: 'mission-nl-be-apotheek', missionVersion: 1, sceneId: 'scene.nl-be.pharmacy.label', sceneVersion: 1 },
    { missionId: 'mission-nl-be-hotel', missionVersion: 1, sceneId: 'scene.nl-be.hotel.checkin', sceneVersion: 1 },
    { missionId: 'mission-nl-be-fietsverhuur', missionVersion: 1, sceneId: 'scene.nl-be.rental.bike', sceneVersion: 1 },
    { missionId: 'mission-nl-be-probleem-melden', missionVersion: 1 },
    { missionId: 'mission-nl-be-ziekte-melden', missionVersion: 1 },
    { missionId: 'mission-nl-be-tussentaal-buur', missionVersion: 1 },
    { missionId: 'mission-nl-be-tussentaal-weekend', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg03-taken', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg05-werktijden', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg06-kantine', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg08-overdracht', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg09-storing', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg10-leverancier', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg11-school', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg12-administratie', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg13-logistiek', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg14-schoonmaak', missionVersion: 1 },
  ],
};

export const FLEMISH_B1_PROFESSIONAL_PROGRAM: RoleplayProgram = {
  id: 'program.nl-be.b1.professional',
  version: 1,
  targetLanguage: 'nl',
  targetLocale: 'nl-BE',
  policyVersion: LEARNING_POLICY_VERSION,
  title: 'Nederlands B1 — Beroepsuitoefening & Nuances',
  reviewStatus: 'draft',
  missionPlan: [
    { missionId: 'mission-nl-be-terras', missionVersion: 1, sceneId: 'scene.nl-be.dining.terrace', sceneVersion: 1 },
    { missionId: 'mission-nl-be-werf-controle', missionVersion: 1 },
    { missionId: 'mission-nl-be-tussentaal-uitdrukkingen', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg15-zorg', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg16-productie', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg17-transport', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg19-horeca', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg20-opvang', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg21-retail', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg22-kantoor', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg23-techniek', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg24-beveiliging', missionVersion: 1 },
    { missionId: 'mission-nl-be-t05-appartement', missionVersion: 1 },
    { missionId: 'mission-nl-be-t08-onderweg', missionVersion: 1 },
    { missionId: 'mission-nl-be-t09-frans-vlaams', missionVersion: 1 },
    { missionId: 'mission-nl-be-t11-complimenten', missionVersion: 1 },
    { missionId: 'mission-nl-be-t15-verhalen', missionVersion: 1 },
    { missionId: 'mission-nl-be-t16-grenzen', missionVersion: 1 },
    { missionId: 'mission-nl-be-t19-plannen', missionVersion: 1 },
    { missionId: 'mission-nl-be-t27-digitaal', missionVersion: 1 },
  ],
};

export const FLEMISH_WORK_COMPREHENSIVE_PROGRAM: RoleplayProgram = {
  id: 'program.nl-be.work.all',
  version: 1,
  targetLanguage: 'nl',
  targetLocale: 'nl-BE',
  policyVersion: LEARNING_POLICY_VERSION,
  title: 'Nederlands op de Werkvloer — Alle 24 Beroepssituaties',
  reviewStatus: 'draft',
  missionPlan: [
    { missionId: 'mission-nl-be-eerste-werkdag', missionVersion: 1 },
    { missionId: 'mission-nl-be-werkinstructie', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg03-taken', missionVersion: 1 },
    { missionId: 'mission-nl-be-probleem-melden', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg05-werktijden', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg06-kantine', missionVersion: 1 },
    { missionId: 'mission-nl-be-ziekte-melden', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg08-overdracht', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg09-storing', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg10-leverancier', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg11-school', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg12-administratie', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg13-logistiek', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg14-schoonmaak', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg15-zorg', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg16-productie', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg17-transport', missionVersion: 1 },
    { missionId: 'mission-nl-be-werf-controle', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg19-horeca', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg20-opvang', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg21-retail', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg22-kantoor', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg23-techniek', missionVersion: 1 },
    { missionId: 'mission-nl-be-wg24-beveiliging', missionVersion: 1 },
  ],
};

export const FLEMISH_TUSSENTAAL_COMPREHENSIVE_PROGRAM: RoleplayProgram = {
  id: 'program.nl-be.tussentaal.all',
  version: 1,
  targetLanguage: 'nl',
  targetLocale: 'nl-BE',
  policyVersion: LEARNING_POLICY_VERSION,
  title: 'Vlaamse Tussentaal — Vlot & Informeel Meepraten',
  reviewStatus: 'draft',
  missionPlan: [
    { missionId: 'mission-nl-be-buur-sleutel', missionVersion: 1, sceneId: 'scene.nl-be.neighbor.key', sceneVersion: 1 },
    { missionId: 'mission-nl-be-tussentaal-buur', missionVersion: 1 },
    { missionId: 'mission-nl-be-tussentaal-weekend', missionVersion: 1 },
    { missionId: 'mission-nl-be-t05-appartement', missionVersion: 1 },
    { missionId: 'mission-nl-be-t08-onderweg', missionVersion: 1 },
    { missionId: 'mission-nl-be-t09-frans-vlaams', missionVersion: 1 },
    { missionId: 'mission-nl-be-t11-complimenten', missionVersion: 1 },
    { missionId: 'mission-nl-be-t15-verhalen', missionVersion: 1 },
    { missionId: 'mission-nl-be-t16-grenzen', missionVersion: 1 },
    { missionId: 'mission-nl-be-t19-plannen', missionVersion: 1 },
    { missionId: 'mission-nl-be-tussentaal-uitdrukkingen', missionVersion: 1 },
    { missionId: 'mission-nl-be-t27-digitaal', missionVersion: 1 },
  ],
};

export const TAALBAD_PROGRAMS: RoleplayProgram[] = [
  FLEMISH_A1_FOUNDATION_PROGRAM,
  FLEMISH_A2_WORK_EVERYDAY_PROGRAM,
  FLEMISH_B1_PROFESSIONAL_PROGRAM,
  FLEMISH_WORK_COMPREHENSIVE_PROGRAM,
  FLEMISH_TUSSENTAAL_COMPREHENSIVE_PROGRAM,
  FLEMISH_WORK_PILOT,
  FLEMISH_TUSSENTAAL_PILOT,
];

export const ROLEPLAY_PROGRAM_CATALOG: RoleplayProgram[] = [
  SPANISH_DAILY_SERVICES_PILOT,
  SPANISH_TRAVEL_PILOT,
  FLEMISH_EVERYDAY_PILOT,
  FLEMISH_TRAVEL_PILOT,
];

export const ALL_ROLEPLAY_PROGRAMS: RoleplayProgram[] = [
  ...ROLEPLAY_PROGRAM_CATALOG,
  ...TAALBAD_PROGRAMS,
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
