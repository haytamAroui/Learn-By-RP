import {
  OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
  type SceneDefinition,
} from '../../contracts/scene';

export const HOTEL_SCENE: SceneDefinition = {
  id: 'scene.es.hotel.checkin',
  version: 1,
  missionId: 'mission-es-hotel-checkin',
  language: 'es',

  characters: [
    {
      id: 'receptionist',
      name: 'Lucía',
      role: 'hotel receptionist',
      voiceStyle: 'Professional, welcoming, clear',
      knowledgeBoundary: [
        'knows the booking reference and room status',
        'knows the room is not ready yet',
        'knows luggage storage is available until check-in time',
      ],
      mayKnowAboutPriorScenes: [],
    },
  ],

  factSchema: {
    bookingIdentified: { type: 'boolean' },
    roomReady: { type: 'boolean' },
    luggageStorageAvailable: { type: 'boolean' },
    arrivalInfoAsked: { type: 'boolean' },
    alternativeOffered: { type: 'boolean' },
    arrivalPlan: { type: 'enum', values: ['unset', 'store_luggage'] },
    arrangementConfirmed: { type: 'boolean' },
  },

  initialFacts: {
    bookingIdentified: false,
    roomReady: false,
    luggageStorageAvailable: true,
    arrivalInfoAsked: false,
    alternativeOffered: false,
    arrivalPlan: 'unset',
    arrangementConfirmed: false,
  },

  learnerKnows: [
    'They have a booking reference.',
    'They arrived before the normal room-ready time.',
  ],

  characterKnows: {
    receptionist: [
      'The booking is valid.',
      'The room is not ready yet.',
      'The hotel can store luggage until the room is ready.',
    ],
  },

  allowedActions: [
    {
      name: 'provide_reference',
      actor: 'character',
      description: 'The learner provides the booking reference.',
      preconditions: [{ op: 'eq', fact: 'bookingIdentified', value: false }],
      effects: [{ set: 'bookingIdentified', value: true }],
    },
    {
      name: 'ask_specification',
      actor: 'character',
      description: 'The learner asks when the room will be ready or another check-in condition.',
      preconditions: [{ op: 'eq', fact: 'bookingIdentified', value: true }],
      effects: [{ set: 'arrivalInfoAsked', value: true }],
    },
    {
      name: 'offer_alternative',
      actor: 'director',
      description: 'Lucía explains the room is not ready and offers luggage storage.',
      preconditions: [
        { op: 'eq', fact: 'bookingIdentified', value: true },
        { op: 'eq', fact: 'roomReady', value: false },
        { op: 'eq', fact: 'alternativeOffered', value: false },
      ],
      effects: [{ set: 'alternativeOffered', value: true }],
    },
    {
      name: 'propose_arrangement',
      actor: 'character',
      description: 'The learner proposes leaving the luggage and returning later.',
      preconditions: [{ op: 'eq', fact: 'alternativeOffered', value: true }],
      effects: [{ set: 'arrivalPlan', value: 'store_luggage' }],
    },
    {
      name: 'confirm_arrangement',
      actor: 'character',
      description: 'Lucía confirms the luggage-storage and later check-in plan.',
      preconditions: [{ op: 'eq', fact: 'arrivalPlan', value: 'store_luggage' }],
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
    id: 'hotel-room-not-ready',
    description: 'The room is not ready at arrival, so the learner must agree a practical alternative.',
    trigger: {
      op: 'and',
      predicates: [
        { op: 'eq', fact: 'bookingIdentified', value: true },
        { op: 'eq', fact: 'roomReady', value: false },
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
          { op: 'eq', fact: 'bookingIdentified', value: true },
          { op: 'eq', fact: 'arrivalPlan', value: 'store_luggage' },
          { op: 'eq', fact: 'arrangementConfirmed', value: true },
        ],
      },
    },
    {
      name: 'partial',
      predicate: { op: 'eq', fact: 'bookingIdentified', value: true },
    },
  ],

  checkpoints: [
    {
      id: 'cp-booking-identified',
      description: 'The booking has been identified',
      after: { op: 'eq', fact: 'bookingIdentified', value: true },
    },
    {
      id: 'cp-arrival-plan',
      description: 'A practical arrival plan is confirmed',
      after: { op: 'eq', fact: 'arrangementConfirmed', value: true },
    },
  ],

  phraseIds: [
    'phrase.es.hotel_reserva',
    'phrase.es.hotel_habitacion_lista',
    'phrase.es.hotel_dejar_maletas',
  ],

  skillIds: [
    'skill-inquire-specifications',
    'skill-propose-alternative',
    'skill-communicative-repair',
    'skill-request-repetition',
    'skill-check-understanding',
  ],

  communicationChallenges: [
    {
      id: 'challenge.es.hotel.repeat-checkin-time',
      type: 'unclear_detail',
      targetSkillId: 'skill-request-repetition',
      opportunityId: 'opp.es.hotel.repair.request-repetition',
      trigger: { op: 'eq', fact: 'bookingIdentified', value: true },
      actorInstruction:
        'Opt-in repair twist: state the check-in timing once in a compact reception turn, then wait. Repeat naturally if the learner asks.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
    {
      id: 'challenge.es.hotel.check-storage-plan',
      type: 'unclear_detail',
      targetSkillId: 'skill-check-understanding',
      opportunityId: 'opp.es.hotel.repair.check-understanding',
      trigger: { op: 'eq', fact: 'alternativeOffered', value: true },
      actorInstruction:
        'Opt-in repair twist: describe the luggage-storage plan in a way that is worth confirming. Accept a learner check such as “Entonces puedo dejar las maletas aquí y volver luego, ¿verdad?”.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
  ],

  pressureBranches: [
    {
      id: 'pressure.es.hotel.concise-reception-turn',
      variantKind: 'more_concise',
      level: 'manageable',
      trigger: { op: 'eq', fact: 'bookingIdentified', value: true },
      actorInstruction:
        'Opt-in pressure branch: keep the next reception follow-up concise while preserving every fact needed to continue.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
  ],

  opportunityDefinitions: [
    {
      id: 'opp.es.hotel.inquire-specifications',
      skillId: 'skill-inquire-specifications',
      evidenceBand: 'a1',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "A concrete question about the room, deposit, or another check-in condition.",
      },
      sceneCondition: { op: 'eq', fact: 'bookingIdentified', value: true },
      positiveExamples: [
        'Asks when the room will be ready, where luggage can be left, or another concrete check-in condition.',
      ],
      negativeExamples: [
        'Only repeats the booking reference without asking for needed check-in information.',
      ],
      relevantActionIds: ['ask_specification'],
      relevantIntentIds: ['ask_checkin_condition'],
    },
    {
      id: 'opp.es.hotel.propose-alternative',
      skillId: 'skill-propose-alternative',
      evidenceBand: 'a2',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "The learner generates and holds a workable alternative arrangement during check-in.",
      },
      sceneCondition: { op: 'eq', fact: 'alternativeOffered', value: true },
      positiveExamples: [
        'Proposes leaving luggage and returning later after learning the room is not ready.',
      ],
      negativeExamples: [
        'Rejects the delay without proposing a workable alternative.',
      ],
      relevantActionIds: ['propose_arrangement'],
      relevantIntentIds: ['propose_arrival_plan'],
    },
    {
      id: 'opp.es.hotel.repair.request-repetition',
      skillId: 'skill-request-repetition',
      evidenceBand: 'a1',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "One formulaic repair clause asking for the just-delivered detail again. No scene-specific content has to be generated and no meaning is at stake beyond hearing it a second time.",
      },
      sceneCondition: { op: 'eq', fact: 'bookingIdentified', value: true },
      positiveExamples: [
        'Asks Lucía to repeat the just-delivered timing detail.',
      ],
      negativeExamples: [
        'Asks a new check-in question instead of requesting repetition.',
      ],
      relevantIntentIds: ['request_repetition'],
      communicationChallengeId: 'challenge.es.hotel.repeat-checkin-time',
    },
    {
      id: 'opp.es.hotel.repair.check-understanding',
      skillId: 'skill-check-understanding',
      evidenceBand: 'a2',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "The learner must retain the detail just delivered, re-formulate it as an interpretation, and turn it into a confirmation question. The reformulated clause is generated rather than recalled, and a wrong restatement has to be noticed.",
      },
      sceneCondition: { op: 'eq', fact: 'alternativeOffered', value: true },
      positiveExamples: [
        'States the understood storage/return plan and asks Lucía to confirm it.',
      ],
      negativeExamples: [
        'Asks an open question without proposing an interpretation.',
      ],
      relevantIntentIds: ['check_understanding'],
      communicationChallengeId: 'challenge.es.hotel.check-storage-plan',
    },
  ],

  reviewStatus: 'released',
};
