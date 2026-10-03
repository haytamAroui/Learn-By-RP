import type { SceneDefinition } from '../../contracts/scene';

export const PARCEL_SCENE: SceneDefinition = {
  id: 'scene.es.parcel.reschedule',
  version: 1,
  missionId: 'mission-es-parcel-counter',
  language: 'es',

  characters: [
    {
      id: 'parcel-clerk',
      name: 'Carmen',
      role: 'parcel clerk',
      voiceStyle: 'Professional, clear, warm, one practical follow-up at a time',
      knowledgeBoundary: [
        'knows parcel 409 is ready for collection',
        'knows the original evening pickup slot is unavailable today',
        'knows tomorrow morning pickup is available between 09:00 and 14:00',
      ],
      mayKnowAboutPriorScenes: [],
    },
  ],

  factSchema: {
    parcelIdentified: { type: 'boolean' },
    originalEveningAvailable: { type: 'boolean' },
    alternativeOffered: { type: 'boolean' },
    hoursAsked: { type: 'boolean' },
    pickupWindow: { type: 'enum', values: ['unset', 'tomorrow_morning'] },
    arrangementConfirmed: { type: 'boolean' },
  },

  initialFacts: {
    parcelIdentified: false,
    originalEveningAvailable: false,
    alternativeOffered: false,
    hoursAsked: false,
    pickupWindow: 'unset',
    arrangementConfirmed: false,
  },

  learnerKnows: [
    'They have tracking reference 409.',
    'They cannot collect the parcel this evening.',
  ],

  characterKnows: {
    'parcel-clerk': [
      'Parcel 409 is at the counter.',
      'The evening collection window is unavailable today.',
      'Tomorrow morning pickup is available.',
    ],
  },

  allowedActions: [
    {
      name: 'provide_reference',
      actor: 'character',
      description: 'The learner gives the parcel reference so Carmen can identify the parcel.',
      preconditions: [{ op: 'eq', fact: 'parcelIdentified', value: false }],
      effects: [{ set: 'parcelIdentified', value: true }],
    },
    {
      name: 'ask_specification',
      actor: 'character',
      description: 'The learner asks about pickup hours or another concrete collection condition.',
      preconditions: [{ op: 'eq', fact: 'parcelIdentified', value: true }],
      effects: [{ set: 'hoursAsked', value: true }],
    },
    {
      name: 'offer_alternative',
      actor: 'director',
      description: 'Carmen states that the evening slot is unavailable and offers tomorrow morning.',
      preconditions: [
        { op: 'eq', fact: 'parcelIdentified', value: true },
        { op: 'eq', fact: 'alternativeOffered', value: false },
      ],
      effects: [{ set: 'alternativeOffered', value: true }],
    },
    {
      name: 'propose_arrangement',
      actor: 'character',
      description: 'The learner proposes collecting the parcel tomorrow morning.',
      preconditions: [{ op: 'eq', fact: 'alternativeOffered', value: true }],
      effects: [{ set: 'pickupWindow', value: 'tomorrow_morning' }],
    },
    {
      name: 'confirm_arrangement',
      actor: 'character',
      description: 'Carmen confirms the agreed pickup arrangement after the learner settles the time.',
      preconditions: [{ op: 'eq', fact: 'pickupWindow', value: 'tomorrow_morning' }],
      effects: [{ set: 'arrangementConfirmed', value: true }],
    },
  ],

  actionSchemas: {
    provide_reference: {
      type: 'object',
      required: ['reference'],
      properties: { reference: { type: 'string' } },
      additionalProperties: false,
    },
    ask_specification: {
      type: 'object',
      required: ['topic'],
      properties: { topic: { type: 'string' } },
      additionalProperties: false,
    },
    offer_alternative: {
      type: 'object',
      required: ['alternative'],
      properties: { alternative: { type: 'string' } },
      additionalProperties: false,
    },
    propose_arrangement: {
      type: 'object',
      required: ['proposal'],
      properties: { proposal: { type: 'string' } },
      additionalProperties: false,
    },
    confirm_arrangement: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false,
    },
  },

  complication: {
    id: 'parcel-evening-slot-unavailable',
    description: 'The original evening collection slot is unavailable, so the learner must coordinate another time.',
    trigger: {
      op: 'and',
      predicates: [
        { op: 'eq', fact: 'parcelIdentified', value: true },
        { op: 'eq', fact: 'originalEveningAvailable', value: false },
      ],
    },
    maxPerScene: 1,
  },

  completion: [
    {
      name: 'achieved',
      predicate: {
        op: 'and',
        predicates: [
          { op: 'eq', fact: 'parcelIdentified', value: true },
          { op: 'eq', fact: 'pickupWindow', value: 'tomorrow_morning' },
          { op: 'eq', fact: 'arrangementConfirmed', value: true },
        ],
      },
    },
    {
      name: 'partial',
      predicate: { op: 'eq', fact: 'parcelIdentified', value: true },
    },
  ],

  checkpoints: [
    {
      id: 'cp-parcel-identified',
      description: 'The parcel has been identified',
      after: { op: 'eq', fact: 'parcelIdentified', value: true },
    },
    {
      id: 'cp-pickup-arranged',
      description: 'A new pickup time has been agreed',
      after: { op: 'eq', fact: 'arrangementConfirmed', value: true },
    },
  ],

  phraseIds: [
    'phrase.es.vengo_a_recoger',
    'phrase.es.cambiar_la_hora',
    'phrase.es.manana_por_la_manana',
  ],

  skillIds: [
    'skill-inquire-specifications',
    'skill-propose-alternative',
    'skill-communicative-repair',
    'skill-request-repetition',
    'skill-ask-clarification',
  ],

  communicationChallenges: [
    {
      id: 'challenge.es.parcel.repeat-hours',
      type: 'unclear_detail',
      targetSkillId: 'skill-request-repetition',
      opportunityId: 'opp.es.parcel.repair.request-repetition',
      trigger: { op: 'eq', fact: 'parcelIdentified', value: true },
      actorInstruction:
        'Opt-in repair twist: give the morning opening hours once as a short information-dense detail, then wait. Repeat naturally if the learner asks; skipping the twist has no penalty.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
    {
      id: 'challenge.es.parcel.unknown-pickup-term',
      type: 'unknown_word',
      targetSkillId: 'skill-ask-clarification',
      opportunityId: 'opp.es.parcel.repair.ask-clarification',
      trigger: { op: 'eq', fact: 'alternativeOffered', value: true },
      actorInstruction:
        'Opt-in repair twist: use one ordinary parcel-service term that is not needed for scene completion, then pause. Explain it plainly if the learner asks what it means.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
  ],

  pressureBranches: [
    {
      id: 'pressure.es.parcel.concise-service-turn',
      variantKind: 'more_concise',
      level: 'manageable',
      trigger: { op: 'eq', fact: 'parcelIdentified', value: true },
      actorInstruction:
        'Opt-in pressure branch: keep the next collection-condition question brief and practical. Do not add time pressure or withhold needed information.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
  ],

  opportunityDefinitions: [
    {
      id: 'opp.es.parcel.inquire-specifications',
      skillId: 'skill-inquire-specifications',
      sceneCondition: { op: 'eq', fact: 'parcelIdentified', value: true },
      positiveExamples: [
        'Asks a concrete question about pickup hours, identification, or collection conditions.',
      ],
      negativeExamples: [
        'Only repeats the tracking number without asking for any needed service detail.',
      ],
      relevantActionIds: ['ask_specification'],
      relevantIntentIds: ['confirm_hours'],
    },
    {
      id: 'opp.es.parcel.propose-alternative',
      skillId: 'skill-propose-alternative',
      sceneCondition: { op: 'eq', fact: 'alternativeOffered', value: true },
      positiveExamples: [
        'Proposes tomorrow morning or another workable collection arrangement after the evening slot is unavailable.',
      ],
      negativeExamples: [
        'Rejects the unavailable time without proposing another arrangement.',
      ],
      relevantActionIds: ['propose_arrangement'],
      relevantIntentIds: ['reschedule_time'],
    },
    {
      id: 'opp.es.parcel.repair.request-repetition',
      skillId: 'skill-request-repetition',
      sceneCondition: { op: 'eq', fact: 'parcelIdentified', value: true },
      positiveExamples: [
        'Asks Carmen to repeat the just-delivered opening-hours detail.',
      ],
      negativeExamples: [
        'Asks for a different pickup time without requesting repetition.',
      ],
      relevantIntentIds: ['request_repetition'],
      communicationChallengeId: 'challenge.es.parcel.repeat-hours',
    },
    {
      id: 'opp.es.parcel.repair.ask-clarification',
      skillId: 'skill-ask-clarification',
      sceneCondition: { op: 'eq', fact: 'alternativeOffered', value: true },
      positiveExamples: [
        'Asks what the unfamiliar parcel-service term means instead of guessing.',
      ],
      negativeExamples: [
        'Requests repetition without asking about meaning.',
      ],
      relevantIntentIds: ['ask_clarification'],
      communicationChallengeId: 'challenge.es.parcel.unknown-pickup-term',
    },
  ],

  reviewStatus: 'released',
};
