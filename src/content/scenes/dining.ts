import {
  OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
  type SceneDefinition,
} from '../../contracts/scene';

export const DINING_SCENE: SceneDefinition = {
  id: 'scene.es.dining.terrace',
  version: 1,
  missionId: 'mission-es-la-terraza',
  language: 'es',

  characters: [
    {
      id: 'head-waiter',
      name: 'Andrés',
      role: 'head waiter',
      voiceStyle: 'Courteous, welcoming, concise',
      knowledgeBoundary: [
        'knows the terrace seating layout',
        'knows the preferred table near the fountain is unavailable',
        'knows the house dishes and ingredient information',
      ],
      mayKnowAboutPriorScenes: [],
    },
  ],

  factSchema: {
    terraceRequested: { type: 'boolean' },
    preferredSpotAvailable: { type: 'boolean' },
    seatingAlternativeOffered: { type: 'boolean' },
    seatingConfirmed: { type: 'boolean' },
    recommendationAsked: { type: 'boolean' },
    dietaryQuestionAsked: { type: 'boolean' },
    dishAlternativeOffered: { type: 'boolean' },
    dishSelected: { type: 'boolean' },
  },

  initialFacts: {
    terraceRequested: false,
    preferredSpotAvailable: false,
    seatingAlternativeOffered: false,
    seatingConfirmed: false,
    recommendationAsked: false,
    dietaryQuestionAsked: false,
    dishAlternativeOffered: false,
    dishSelected: false,
  },

  learnerKnows: [
    'They want a terrace table for two.',
    'They want a recommendation and may ask about gluten or dairy.',
  ],

  characterKnows: {
    'head-waiter': [
      'The preferred terrace spot near the fountain is unavailable.',
      'Another terrace table is available.',
      'The waiter can provide ingredient information and suggest another dish if needed.',
    ],
  },

  allowedActions: [
    {
      name: 'request_seating',
      actor: 'character',
      description: 'The learner requests a terrace table for two.',
      preconditions: [{ op: 'eq', fact: 'terraceRequested', value: false }],
      effects: [{ set: 'terraceRequested', value: true }],
    },
    {
      name: 'offer_alternative',
      actor: 'director',
      description: 'Andrés explains the preferred terrace spot is unavailable and opens another seating option.',
      preconditions: [
        { op: 'eq', fact: 'terraceRequested', value: true },
        { op: 'eq', fact: 'preferredSpotAvailable', value: false },
        { op: 'eq', fact: 'seatingAlternativeOffered', value: false },
      ],
      effects: [{ set: 'seatingAlternativeOffered', value: true }],
    },
    {
      name: 'propose_arrangement',
      actor: 'character',
      description: 'The learner proposes or accepts another workable terrace location.',
      preconditions: [{ op: 'eq', fact: 'seatingAlternativeOffered', value: true }],
      effects: [{ set: 'seatingConfirmed', value: true }],
    },
    {
      name: 'ask_recommendation',
      actor: 'character',
      description: 'The learner asks what Andrés recommends today.',
      preconditions: [{ op: 'eq', fact: 'seatingConfirmed', value: true }],
      effects: [{ set: 'recommendationAsked', value: true }],
    },
    {
      name: 'ask_specification',
      actor: 'character',
      description: 'The learner asks about a concrete ingredient or dietary condition.',
      preconditions: [{ op: 'eq', fact: 'recommendationAsked', value: true }],
      effects: [{ set: 'dietaryQuestionAsked', value: true }],
    },
    {
      name: 'offer_substitute',
      actor: 'director',
      description: 'Andrés offers another dish after the learner states a relevant dietary condition.',
      preconditions: [
        { op: 'eq', fact: 'dietaryQuestionAsked', value: true },
        { op: 'eq', fact: 'dishAlternativeOffered', value: false },
      ],
      effects: [{ set: 'dishAlternativeOffered', value: true }],
    },
    {
      name: 'confirm_selection',
      actor: 'character',
      description: 'The learner selects a suitable dish after the recommendation or substitute is discussed.',
      preconditions: [
        {
          op: 'or',
          predicates: [
            { op: 'eq', fact: 'recommendationAsked', value: true },
            { op: 'eq', fact: 'dishAlternativeOffered', value: true },
          ],
        },
      ],
      effects: [{ set: 'dishSelected', value: true }],
    },
  ],

  actionSchemas: {
    request_seating: {
      type: 'object',
      required: ['request'],
      properties: { request: { type: 'string' } },
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
    ask_recommendation: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false,
    },
    ask_specification: {
      type: 'object',
      required: ['topic'],
      properties: { topic: { type: 'string' } },
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
  },

  complication: {
    id: 'dining-preferred-terrace-spot-unavailable',
    description: 'The preferred terrace spot is unavailable, so the learner must refine the seating arrangement.',
    trigger: {
      op: 'and',
      predicates: [
        { op: 'eq', fact: 'terraceRequested', value: true },
        { op: 'eq', fact: 'preferredSpotAvailable', value: false },
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
          { op: 'eq', fact: 'seatingConfirmed', value: true },
          { op: 'eq', fact: 'recommendationAsked', value: true },
          { op: 'eq', fact: 'dishSelected', value: true },
        ],
      },
    },
    {
      name: 'partial',
      predicate: {
        op: 'or',
        predicates: [
          { op: 'eq', fact: 'seatingConfirmed', value: true },
          { op: 'eq', fact: 'recommendationAsked', value: true },
        ],
      },
    },
  ],

  checkpoints: [
    {
      id: 'cp-seating-confirmed',
      description: 'A terrace table is settled',
      after: { op: 'eq', fact: 'seatingConfirmed', value: true },
    },
    {
      id: 'cp-recommendation-discussed',
      description: 'The recommendation has been discussed',
      after: { op: 'eq', fact: 'recommendationAsked', value: true },
    },
  ],

  phraseIds: [
    'phrase.es.mesa_en_terraza',
    'phrase.es.que_nos_recomienda',
    'phrase.es.lleva_gluten',
  ],

  skillIds: [
    'skill-propose-alternative',
    'skill-inquire-specifications',
    'skill-request-substitution',
  ],

  communicationChallenges: [],

  pressureBranches: [
    {
      id: 'pressure.es.dining.concise-host-turn',
      variantKind: 'more_concise',
      level: 'manageable',
      trigger: { op: 'eq', fact: 'seatingConfirmed', value: true },
      actorInstruction:
        'Opt-in pressure branch: keep the next waiter follow-up concise and natural while preserving all necessary information.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
  ],

  opportunityDefinitions: [
    {
      id: 'opp.es.dining.propose-alternative',
      skillId: 'skill-propose-alternative',
      evidenceBand: 'a2',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "The preferred terrace table is unavailable and the learner produces a workable alternative.",
      },
      sceneCondition: { op: 'eq', fact: 'seatingAlternativeOffered', value: true },
      positiveExamples: [
        'Suggests or accepts another workable terrace location after the preferred spot is unavailable.',
      ],
      negativeExamples: [
        'Rejects the unavailable spot without proposing or accepting another arrangement.',
      ],
      relevantActionIds: ['propose_arrangement'],
      relevantIntentIds: ['request_table'],
    },
    {
      id: 'opp.es.dining.inquire-specifications',
      skillId: 'skill-inquire-specifications',
      evidenceBand: 'a2',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "Asking for a recommendation plus an ingredient or dietary check combines obtaining advice with narrowing a choice.",
      },
      sceneCondition: { op: 'eq', fact: 'seatingConfirmed', value: true },
      positiveExamples: [
        'Asks for a recommendation or a concrete ingredient, allergen, or dish detail needed to decide.',
      ],
      negativeExamples: [
        'Makes a preference statement without asking for the missing information.',
      ],
      relevantActionIds: ['ask_recommendation', 'ask_specification'],
      relevantIntentIds: ['ask_recommendation', 'check_allergens'],
    },
    {
      id: 'opp.es.dining.request-substitution',
      skillId: 'skill-request-substitution',
      evidenceBand: 'a2',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "A dietary condition identified earlier has to be carried into a request for another dish.",
      },
      sceneCondition: { op: 'eq', fact: 'dishAlternativeOffered', value: true },
      positiveExamples: [
        'Requests or chooses another suitable dish after the first option conflicts with the stated condition.',
      ],
      negativeExamples: [
        'Repeats the unsuitable option without adapting.',
      ],
      relevantActionIds: ['confirm_selection'],
      relevantIntentIds: ['request_substitution'],
    },
  ],

  reviewStatus: 'released',
};
