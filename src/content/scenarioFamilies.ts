import type {
  MissionDefinition,
  ScenarioFamilyDefinition,
  ScenarioFamilyId,
} from '../types';

/**
 * Reviewer-owned scenario-family taxonomy.
 *
 * A mission may vary in language, locale, pressure, character or surface details
 * without creating a new transfer context. The reviewed family boundary is the
 * content authority that decides whether two scenarios are pedagogically the same
 * kind of situation.
 */
export const RETIRED_SCENARIO_FAMILY_IDS: readonly ScenarioFamilyId[] = [];

export const SCENARIO_FAMILY_CATALOG: readonly ScenarioFamilyDefinition[] = [
  {
    id: 'counter-ordering',
    version: 1,
    reviewStatus: 'reviewed',
    domainIds: ['cafes', 'services'],
    learnerLabel: {
      en: 'Ordering at a counter',
      fr: 'Commander au comptoir',
      es: 'Pedir en un mostrador',
      nl: 'Bestellen aan een balie',
    },
    internalDescription:
      'Short counter-service exchanges where the learner orders or requests an item and may clarify availability, options or substitutions.',
    includedContexts: [
      'cafe or bakery counter ordering',
      'convenience-store counter request',
      'quick-service item request with immediate staff response',
    ],
    excludedContexts: [
      'table-service dining with an extended social exchange',
      'parcel collection or appointment rescheduling',
      'public-transit navigation',
    ],
    reviewedAt: '2026-10-02',
    reviewedBy: 'learnbyrp-content-review',
    reviewNote:
      'Keep language/locale and cosmetic venue variants in this family; do not split them into transfer contexts.',
  },
  {
    id: 'parcel-service',
    version: 1,
    reviewStatus: 'reviewed',
    domainIds: ['services'],
    learnerLabel: {
      en: 'Handling a parcel service',
      fr: 'Gérer un service de colis',
      es: 'Gestionar un servicio de paquetería',
      nl: 'Een pakketdienst regelen',
    },
    internalDescription:
      'Service-counter interactions centered on identifying a parcel, collection conditions, opening hours or changing a pickup/delivery arrangement.',
    includedContexts: [
      'parcel collection with identification or reference details',
      'pickup or delivery rescheduling',
      'confirming service-counter collection conditions',
    ],
    excludedContexts: [
      'ordinary retail ordering',
      'social plans between acquaintances',
      'restaurant table service',
    ],
    reviewedAt: '2026-10-02',
    reviewedBy: 'learnbyrp-content-review',
    reviewNote:
      'A different shopfront or carrier does not create a new family when the service problem remains parcel coordination.',
  },
  {
    id: 'neighbour-coordination',
    version: 1,
    reviewStatus: 'reviewed',
    domainIds: ['social'],
    learnerLabel: {
      en: 'Coordinating with a neighbour',
      fr: 'S’organiser avec un voisin',
      es: 'Coordinarse con un vecino',
      nl: 'Afstemmen met een buur',
    },
    internalDescription:
      'Informal peer-to-peer coordination with a neighbour or nearby acquaintance about access, timing, handover or a small practical arrangement.',
    includedContexts: [
      'agreeing when to hand over or collect something',
      'coordinating access or timing with a neighbour',
      'resolving a small local practical arrangement',
    ],
    excludedContexts: [
      'formal commercial service counters',
      'professional workplace negotiation',
      'restaurant service encounters',
    ],
    reviewedAt: '2026-10-02',
    reviewedBy: 'learnbyrp-content-review',
    reviewNote:
      'Keep the family informal and peer-to-peer; professional service interactions belong elsewhere.',
  },
  {
    id: 'public-transit',
    version: 1,
    reviewStatus: 'reviewed',
    domainIds: ['transit'],
    learnerLabel: {
      en: 'Navigating public transport',
      fr: 'S’orienter dans les transports publics',
      es: 'Orientarse en el transporte público',
      nl: 'Je weg vinden in het openbaar vervoer',
    },
    internalDescription:
      'Transit-navigation interactions where the learner asks for a route, direction, platform, validation step or other information needed to continue a journey.',
    includedContexts: [
      'asking which line or direction to take',
      'asking for a platform or track',
      'clarifying ticket or validation steps needed for the journey',
    ],
    excludedContexts: [
      'general street directions unrelated to public transport',
      'buying food or retail goods in a station',
      'lodging or check-in interactions',
    ],
    reviewedAt: '2026-10-02',
    reviewedBy: 'learnbyrp-content-review',
    reviewNote:
      'Different cities, operators and stations remain one family when the communicative situation is transit navigation.',
  },
  {
    id: 'pharmacy-consultation',
    version: 1,
    reviewStatus: 'reviewed',
    domainIds: ['problems'],
    learnerLabel: {
      en: 'Asking at a pharmacy',
      fr: 'Demander conseil en pharmacie',
      es: 'Consultar en una farmacia',
      nl: 'Iets vragen in een apotheek',
    },
    internalDescription:
      'Pharmacy-service interactions where the learner describes a bounded need or constraint and asks about an available non-diagnostic product option or practical condition.',
    includedContexts: [
      'asking for a suitable over-the-counter product option',
      'stating a practical product constraint such as drowsiness',
      'asking about product availability or a non-diagnostic specification',
    ],
    excludedContexts: [
      'medical diagnosis or treatment planning',
      'emergency or crisis advice',
      'ordinary retail substitution with no health-service context',
    ],
    reviewedAt: '2026-10-02',
    reviewedBy: 'learnbyrp-content-review',
    reviewNote:
      'Family boundaries describe the interaction type only and do not authorize diagnosis, dosage or treatment claims.',
  },
  {
    id: 'social-dining',
    version: 1,
    reviewStatus: 'reviewed',
    domainIds: ['cafes'],
    learnerLabel: {
      en: 'Dining out',
      fr: 'Manger au restaurant',
      es: 'Comer fuera',
      nl: 'Uit eten gaan',
    },
    internalDescription:
      'Table-service dining interactions that combine ordering with recommendations, preferences, seating or other extended restaurant coordination.',
    includedContexts: [
      'restaurant or bistro table service',
      'asking for a recommendation before ordering',
      'coordinating seating or meal preferences in table service',
    ],
    excludedContexts: [
      'quick counter ordering with no table-service interaction',
      'pharmacy or parcel service',
      'private meal conversation without a service interaction',
    ],
    reviewedAt: '2026-10-02',
    reviewedBy: 'learnbyrp-content-review',
    reviewNote:
      'Table-service restaurant variants stay together across languages and venues unless the interaction structure materially changes.',
  },
] as const;

const FAMILY_BY_ID = new Map<ScenarioFamilyId, ScenarioFamilyDefinition>(
  SCENARIO_FAMILY_CATALOG.map(family => [family.id, family])
);

export function scenarioFamilyFor(
  familyId: ScenarioFamilyId
): ScenarioFamilyDefinition | undefined {
  return FAMILY_BY_ID.get(familyId);
}

export function isReviewedScenarioFamily(familyId: ScenarioFamilyId): boolean {
  return scenarioFamilyFor(familyId)?.reviewStatus === 'reviewed';
}

export interface ScenarioFamilyCatalogValidation {
  valid: boolean;
  errors: string[];
}

export function validateScenarioFamilyCatalog(): ScenarioFamilyCatalogValidation {
  const errors: string[] = [];
  const seen = new Set<ScenarioFamilyId>();

  for (const family of SCENARIO_FAMILY_CATALOG) {
    const path = `scenarioFamily.${family.id}`;

    if (!family.id.trim()) errors.push(`${path}: id is empty`);
    if (seen.has(family.id)) errors.push(`${path}: duplicate stable id`);
    seen.add(family.id);

    if (!Number.isInteger(family.version) || family.version < 1) {
      errors.push(`${path}: version must be a positive integer`);
    }

    if (family.domainIds.length === 0) {
      errors.push(`${path}: at least one domain is required`);
    }
    if (new Set(family.domainIds).size !== family.domainIds.length) {
      errors.push(`${path}: duplicate domain id`);
    }

    for (const locale of ['en', 'fr', 'es', 'nl'] as const) {
      if (!family.learnerLabel[locale]?.trim()) {
        errors.push(`${path}: missing learner label for ${locale}`);
      }
    }

    if (!family.internalDescription.trim()) {
      errors.push(`${path}: internal description is empty`);
    }
    if (family.includedContexts.length === 0) {
      errors.push(`${path}: inclusion boundary is empty`);
    }
    if (family.excludedContexts.length === 0) {
      errors.push(`${path}: exclusion boundary is empty`);
    }

    if (family.reviewStatus === 'reviewed') {
      if (!family.reviewedAt) errors.push(`${path}: reviewedAt is required`);
      if (!family.reviewedBy?.trim()) errors.push(`${path}: reviewedBy is required`);
    }
  }

  const active = new Set(SCENARIO_FAMILY_CATALOG.map(family => family.id));
  for (const retiredId of RETIRED_SCENARIO_FAMILY_IDS) {
    if (active.has(retiredId)) {
      errors.push(`retiredScenarioFamily.${retiredId}: retired id is active again`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateMissionScenarioFamily(
  mission: MissionDefinition,
  catalog: readonly ScenarioFamilyDefinition[] = SCENARIO_FAMILY_CATALOG
): string[] {
  const family = catalog.find(candidate => candidate.id === mission.scenarioFamilyId);
  if (!family) {
    return [
      `${mission.id}: unknown scenarioFamilyId ${mission.scenarioFamilyId}`,
    ];
  }

  const errors: string[] = [];
  if (family.reviewStatus !== 'reviewed') {
    errors.push(
      `${mission.id}: scenario family ${family.id} is ${family.reviewStatus}, not reviewed`
    );
  }
  if (!family.domainIds.includes(mission.category)) {
    errors.push(
      `${mission.id}: domain ${mission.category} is outside scenario family ${family.id} boundary`
    );
  }

  return errors;
}
