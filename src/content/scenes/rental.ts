import {
  OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
  type SceneDefinition,
} from '../../contracts/scene';

export const BIKE_RENTAL_SCENE: SceneDefinition = {
  id: 'scene.es.rental.bike',
  version: 1,
  missionId: 'mission-es-bike-rental',
  language: 'es',

  characters: [
    {
      id: 'rental-clerk',
      name: 'Diego',
      role: 'bike-rental clerk',
      voiceStyle: 'Friendly, practical, clear',
      knowledgeBoundary: [
        'knows the standard city bike is unavailable',
        'knows an electric city bike is available at the same location',
        'knows the return deadline and that a lock is included',
      ],
      mayKnowAboutPriorScenes: [],
    },
  ],

  factSchema: {
    rentalRequested: { type: 'boolean' },
    preferredBikeAvailable: { type: 'boolean' },
    substituteOffered: { type: 'boolean' },
    rentalSelected: { type: 'boolean' },
    returnInfoAsked: { type: 'boolean' },
    rentalConfirmed: { type: 'boolean' },
  },

  initialFacts: {
    rentalRequested: false,
    preferredBikeAvailable: false,
    substituteOffered: false,
    rentalSelected: false,
    returnInfoAsked: false,
    rentalConfirmed: false,
  },

  learnerKnows: [
    'They want to rent a city bike for the afternoon.',
    'They need to know the return time and whether a lock is included.',
  ],

  characterKnows: {
    'rental-clerk': [
      'The standard city bike is unavailable.',
      'An electric city bike is available.',
      'The bike must be returned before 20:00 and a lock is included.',
    ],
  },

  allowedActions: [
    {
      name: 'request_service',
      actor: 'character',
      description: 'The learner asks to rent a city bike.',
      preconditions: [{ op: 'eq', fact: 'rentalRequested', value: false }],
      effects: [{ set: 'rentalRequested', value: true }],
    },
    {
      name: 'offer_substitute',
      actor: 'director',
      description: 'Diego explains the preferred bike is unavailable and offers an electric city bike.',
      preconditions: [
        { op: 'eq', fact: 'rentalRequested', value: true },
        { op: 'eq', fact: 'preferredBikeAvailable', value: false },
        { op: 'eq', fact: 'substituteOffered', value: false },
      ],
      effects: [{ set: 'substituteOffered', value: true }],
    },
    {
      name: 'confirm_selection',
      actor: 'character',
      description: 'The learner chooses the available substitute.',
      preconditions: [{ op: 'eq', fact: 'substituteOffered', value: true }],
      effects: [{ set: 'rentalSelected', value: true }],
    },
    {
      name: 'ask_specification',
      actor: 'character',
      description: 'The learner asks about return time, included lock, or another concrete rental condition.',
      preconditions: [{ op: 'eq', fact: 'rentalSelected', value: true }],
      effects: [{ set: 'returnInfoAsked', value: true }],
    },
    {
      name: 'confirm_arrangement',
      actor: 'character',
      description: 'Diego confirms the rental after the learner has selected the bike and clarified conditions.',
      preconditions: [
        {
          op: 'and',
          predicates: [
            { op: 'eq', fact: 'rentalSelected', value: true },
            { op: 'eq', fact: 'returnInfoAsked', value: true },
          ],
        },
      ],
      effects: [{ set: 'rentalConfirmed', value: true }],
    },
  ],

  actionSchemas: {
    request_service: {
      type: 'object',
      required: ['request'],
      properties: { request: { type: 'string' } },
      additionalProperties: false,
    },
    offer_substitute: {
      type: 'object',
      required: ['alternative'],
      properties: { alternative: { type: 'string' } },
      additionalProperties: false,
    },
    confirm_selection: {
      type: 'object',
      required: ['selection'],
      properties: { selection: { type: 'string' } },
      additionalProperties: false,
    },
    ask_specification: {
      type: 'object',
      required: ['topic'],
      properties: { topic: { type: 'string' } },
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
    id: 'rental-standard-bike-unavailable',
    description: 'The standard city bike is unavailable, so the learner must choose another rental option.',
    trigger: {
      op: 'and',
      predicates: [
        { op: 'eq', fact: 'rentalRequested', value: true },
        { op: 'eq', fact: 'preferredBikeAvailable', value: false },
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
          { op: 'eq', fact: 'rentalSelected', value: true },
          { op: 'eq', fact: 'returnInfoAsked', value: true },
          { op: 'eq', fact: 'rentalConfirmed', value: true },
        ],
      },
    },
    {
      name: 'partial',
      predicate: { op: 'eq', fact: 'rentalSelected', value: true },
    },
  ],

  checkpoints: [
    {
      id: 'cp-rental-selected',
      description: 'An available rental bike is selected',
      after: { op: 'eq', fact: 'rentalSelected', value: true },
    },
    {
      id: 'cp-rental-confirmed',
      description: 'Rental conditions are clarified and confirmed',
      after: { op: 'eq', fact: 'rentalConfirmed', value: true },
    },
  ],

  phraseIds: [
    'phrase.es.rental_bici',
    'phrase.es.rental_otra_bici',
    'phrase.es.rental_devolver',
  ],

  skillIds: [
    'skill-request-substitution',
    'skill-inquire-specifications',
    'skill-communicative-repair',
    'skill-ask-clarification',
    'skill-check-understanding',
  ],

  communicationChallenges: [
    {
      id: 'challenge.es.rental.unknown-rental-term',
      type: 'unknown_word',
      targetSkillId: 'skill-ask-clarification',
      opportunityId: 'opp.es.rental.repair.ask-clarification',
      trigger: { op: 'eq', fact: 'rentalSelected', value: true },
      actorInstruction:
        'Opt-in repair twist: use one ordinary rental-service term that is not needed for completion, then pause. Explain it plainly if the learner asks.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
    {
      id: 'challenge.es.rental.check-return-condition',
      type: 'unclear_detail',
      targetSkillId: 'skill-check-understanding',
      opportunityId: 'opp.es.rental.repair.check-understanding',
      trigger: { op: 'eq', fact: 'returnInfoAsked', value: true },
      actorInstruction:
        'Opt-in repair twist: state the return condition in a way that is worth confirming. Accept a learner check such as “Entonces tengo que devolverla antes de las ocho, ¿verdad?”.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
  ],

  pressureBranches: [
    {
      id: 'pressure.es.rental.concise-service-turn',
      variantKind: 'more_concise',
      level: 'manageable',
      trigger: { op: 'eq', fact: 'rentalSelected', value: true },
      actorInstruction:
        'Opt-in pressure branch: keep the next rental-condition exchange concise while preserving all required information.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
  ],

  opportunityDefinitions: [
    {
      id: 'opp.es.rental.request-substitution',
      skillId: 'skill-request-substitution',
      evidenceBand: 'a2',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "A constraint rules out the first choice, so the request has to be adapted to what is actually available.",
      },
      sceneCondition: { op: 'eq', fact: 'substituteOffered', value: true },
      positiveExamples: [
        'Requests or accepts another available bike after the preferred type is unavailable.',
      ],
      negativeExamples: [
        'Repeats the unavailable bike request without adapting.',
      ],
      relevantActionIds: ['confirm_selection'],
      relevantIntentIds: ['request_substitution'],
    },
    {
      id: 'opp.es.rental.inquire-specifications',
      skillId: 'skill-inquire-specifications',
      evidenceBand: 'a1',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "A concrete question about bike size, helmet, or price at the rental counter.",
      },
      sceneCondition: { op: 'eq', fact: 'rentalSelected', value: true },
      positiveExamples: [
        'Asks a concrete question about return time, included equipment, or another rental condition.',
      ],
      negativeExamples: [
        'Confirms the bike without asking for the needed condition.',
      ],
      relevantActionIds: ['ask_specification'],
      relevantIntentIds: ['ask_rental_condition'],
    },
    {
      id: 'opp.es.rental.repair.ask-clarification',
      skillId: 'skill-ask-clarification',
      evidenceBand: 'a1',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "One formulaic clause asking what a single unfamiliar word means. The demand is the request itself, not the domain it happens in, so the setting does not raise the band.",
      },
      sceneCondition: { op: 'eq', fact: 'rentalSelected', value: true },
      positiveExamples: [
        'Asks what the unfamiliar rental term means instead of guessing.',
      ],
      negativeExamples: [
        'Requests repetition without asking about meaning.',
      ],
      relevantIntentIds: ['ask_clarification'],
      communicationChallengeId: 'challenge.es.rental.unknown-rental-term',
    },
    {
      id: 'opp.es.rental.repair.check-understanding',
      skillId: 'skill-check-understanding',
      evidenceBand: 'a2',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "The learner must retain the detail just delivered, re-formulate it as an interpretation, and turn it into a confirmation question. The reformulated clause is generated rather than recalled, and a wrong restatement has to be noticed.",
      },
      sceneCondition: { op: 'eq', fact: 'returnInfoAsked', value: true },
      positiveExamples: [
        'States the understood return condition and asks Diego to confirm it.',
      ],
      negativeExamples: [
        'Asks a new open question without proposing an interpretation.',
      ],
      relevantIntentIds: ['check_understanding'],
      communicationChallengeId: 'challenge.es.rental.check-return-condition',
    },
  ],

  reviewStatus: 'released',
};
