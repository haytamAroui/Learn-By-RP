import { SceneDefinition } from '../contracts/scene';

/**
 * The breakfast café, worked example from §9.3.
 *
 * The information gap is authored, not improvised: the learner can see the menu
 * (a static prop), the character knows one item is out of stock. The learner must
 * discover an alternative and confirm for here or takeaway.
 *
 * A grammatically imperfect request succeeds because `confirm_order_item` has no
 * wording precondition. A perfect sentence asking for the wrong item does not
 * complete the task, because completion depends on facts the reducer sets, not
 * on how well the request was phrased.
 */
export const CAFE_SCENE: SceneDefinition = {
  id: 'scene.es.cafe.breakfast',
  version: 1,
  missionId: 'mission-es-cafe-sol',
  language: 'es',

  characters: [
    {
      id: 'barista',
      name: 'Mateo',
      role: 'café worker',
      voiceStyle: 'Warm, patient, quick turns, one follow-up at a time',
      knowledgeBoundary: [
        'knows the current menu',
        'knows oat milk is out of stock today',
        'knows the kitchen closes at 11:00',
      ],
      // The character knows nothing about the learner's life outside this scene.
      mayKnowAboutPriorScenes: [],
    },
  ],

  factSchema: {
    menuVisible: { type: 'boolean' },
    oatMilkAvailable: { type: 'boolean' },
    almondMilkAvailable: { type: 'boolean' },
    wholeMilkAvailable: { type: 'boolean' },
    trainDepartsSoon: { type: 'boolean' },
    itemConfirmed: { type: 'boolean' },
    alternativeOffered: { type: 'boolean' },
    serviceMode: { type: 'enum', values: ['unset', 'takeaway', 'for_here'] },
    ingredientQuestionAsked: { type: 'boolean' },
    closedByLearner: { type: 'boolean' },
  },

  initialFacts: {
    menuVisible: true,
    oatMilkAvailable: false,
    almondMilkAvailable: true,
    wholeMilkAvailable: true,
    trainDepartsSoon: true,
    itemConfirmed: false,
    alternativeOffered: false,
    serviceMode: 'unset',
    ingredientQuestionAsked: false,
    closedByLearner: false,
  },

  learnerKnows: [
    'The menu is in front of them (a static prop).',
    'A train leaves soon, so the order has to be quick.',
  ],

  characterKnows: {
    barista: [
      'Oat milk ran out this morning.',
      'Almond and whole milk are available.',
    ],
  },

  allowedActions: [
    {
      name: 'confirm_order_item',
      actor: 'character',
      description:
        'Accepts whatever item the learner names, however it is phrased. Equivalence is judged from the transcript, not from the words used.',
      // No wording precondition on purpose: a clumsy request still orders.
      preconditions: [],
      effects: [{ set: 'itemConfirmed', value: true }],
    },
    {
      name: 'offer_alternative',
      actor: 'director',
      description: 'Offers a substitute when the requested item is unavailable.',
      preconditions: [{ op: 'eq', fact: 'alternativeOffered', value: false }],
      effects: [{ set: 'alternativeOffered', value: true }],
    },
    {
      name: 'confirm_takeaway',
      actor: 'character',
      description: 'Confirms the order is for here rather than to go.',
      preconditions: [{ op: 'eq', fact: 'itemConfirmed', value: true }],
      effects: [{ set: 'serviceMode', value: 'takeaway' }],
    },
    {
      name: 'confirm_for_here',
      actor: 'character',
      description: 'Confirms the order is to be served in the café.',
      preconditions: [{ op: 'eq', fact: 'itemConfirmed', value: true }],
      effects: [{ set: 'serviceMode', value: 'for_here' }],
    },
    {
      name: 'ask_about_ingredient',
      actor: 'character',
      description: 'The learner asks whether an item contains something.',
      preconditions: [{ op: 'eq', fact: 'itemConfirmed', value: true }],
      effects: [{ set: 'ingredientQuestionAsked', value: true }],
    },
    {
      name: 'complete_scene',
      actor: 'director',
      description: 'Closes the scene explicitly when the learner is done.',
      preconditions: [{ op: 'eq', fact: 'itemConfirmed', value: true }],
      effects: [{ set: 'closedByLearner', value: true }],
    },
  ],

  actionSchemas: {
    confirm_order_item: {
      type: 'object',
      required: ['item'],
      properties: { item: { type: 'string' } },
      additionalProperties: false,
    },
    offer_alternative: {
      type: 'object',
      required: ['alternative'],
      properties: { alternative: { type: 'string' } },
      additionalProperties: false,
    },
    confirm_takeaway: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false,
    },
    confirm_for_here: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false,
    },
    ask_about_ingredient: {
      type: 'object',
      required: [],
      properties: { ingredient: { type: 'string' } },
      additionalProperties: false,
    },
    complete_scene: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false,
    },
  },

  complication: {
    id: 'oat-milk-unavailable',
    description:
      'Oat milk is out of stock. This follows from an authored fact, not from a manufactured misunderstanding.',
    trigger: { op: 'eq', fact: 'oatMilkAvailable', value: false },
    maxPerScene: 1,
  },

  completion: [
    {
      // §9.3: an available item is confirmed AND a service mode is settled.
      name: 'achieved',
      predicate: {
        op: 'and',
        predicates: [
          { op: 'eq', fact: 'itemConfirmed', value: true },
          { op: 'in', fact: 'serviceMode', values: ['takeaway', 'for_here'] },
        ],
      },
    },
    {
      name: 'partial',
      predicate: { op: 'eq', fact: 'itemConfirmed', value: true },
    },
  ],

  checkpoints: [
    {
      id: 'cp-item-confirmed',
      description: 'An item is on the order',
      after: { op: 'eq', fact: 'itemConfirmed', value: true },
    },
    {
      id: 'cp-service-settled',
      description: 'Service mode settled',
      after: {
        op: 'and',
        predicates: [
          { op: 'eq', fact: 'itemConfirmed', value: true },
          { op: 'in', fact: 'serviceMode', values: ['takeaway', 'for_here'] },
        ],
      },
    },
  ],

  // Curated mappings only. Never model-generated.
  phraseIds: [
    'phrase.es.cafe_leche',
    'phrase.es.leche_almendra',
    'phrase.es.para_llevar',
    'phrase.es.cuanto_cuesta',
  ],
  skillIds: [
    'skill-request-substitution',
    'skill-inquire-specifications',
    'skill-propose-alternative',
    'skill-communicative-repair',
  ],

  opportunityDefinitions: [
    {
      id: 'opp.es.cafe.request-substitution.after-alternative',
      skillId: 'skill-request-substitution',
      sceneCondition: { op: 'eq', fact: 'alternativeOffered', value: true },
      positiveExamples: [
        'Accepts or requests a viable substitute after learning the preferred option is unavailable.',
        'Asks for another available milk or changes the order to an available option.',
      ],
      negativeExamples: [
        'Repeats the unavailable option without adapting.',
        'Changes topic without addressing the unavailable item.',
      ],
      relevantActionIds: ['confirm_order_item'],
      relevantIntentIds: ['request_substitution'],
    },
    {
      id: 'opp.es.cafe.inquire-specifications.after-item',
      skillId: 'skill-inquire-specifications',
      sceneCondition: { op: 'eq', fact: 'itemConfirmed', value: true },
      positiveExamples: [
        'Asks a concrete follow-up about the confirmed item, ingredient, price, or service condition.',
      ],
      negativeExamples: [
        'Makes an unrelated comment that does not seek information about the order.',
      ],
      relevantActionIds: ['ask_about_ingredient'],
      relevantIntentIds: ['ask_specification'],
    },
  ],

  reviewStatus: 'released',
};

/**
 * A pharmacy scene, used to prove the reducer is not specialised to the café.
 * Same contract, different authored facts and a different completion rule.
 */
export const PHARMACY_SCENE: SceneDefinition = {
  id: 'scene.es.pharmacy.symptom',
  version: 2,
  missionId: 'mission-es-farmacia-sol',
  language: 'es',

  characters: [
    {
      id: 'pharmacy-counter-staff',
      name: 'Elena',
      role: 'pharmacy counter staff',
      voiceStyle: 'Calm, precise, brief',
      knowledgeBoundary: [
        'can direct the learner to the licensed pharmacist',
        'can point to official labels and patient leaflets',
        'must not diagnose, recommend medicine, or give dosage/treatment advice',
      ],
      mayKnowAboutPriorScenes: [],
    },
  ],

  factSchema: {
    pharmacistAvailable: { type: 'boolean' },
    labelHelpAvailable: { type: 'boolean' },
    pharmacistRequested: { type: 'boolean' },
    labelHelpRequested: { type: 'boolean' },
    handoffOffered: { type: 'boolean' },
    closedByLearner: { type: 'boolean' },
  },

  initialFacts: {
    pharmacistAvailable: true,
    labelHelpAvailable: true,
    pharmacistRequested: false,
    labelHelpRequested: false,
    handoffOffered: false,
    closedByLearner: false,
  },

  learnerKnows: [
    'They have symptoms they want to describe and need to ask for the licensed pharmacist.',
  ],
  characterKnows: {
    'pharmacy-counter-staff': [
      'The licensed pharmacist can be requested at the consultation counter.',
      'Official product labels and patient leaflets are available.',
    ],
  },

  allowedActions: [
    {
      name: 'request_pharmacist',
      actor: 'character',
      description:
        'Records that the learner asks to speak with the licensed pharmacist.',
      preconditions: [
        { op: 'eq', fact: 'pharmacistAvailable', value: true },
      ],
      effects: [{ set: 'pharmacistRequested', value: true }],
    },
    {
      name: 'request_label_help',
      actor: 'character',
      description:
        'Records that the learner asks where to find official label or leaflet information.',
      preconditions: [
        { op: 'eq', fact: 'labelHelpAvailable', value: true },
      ],
      effects: [{ set: 'labelHelpRequested', value: true }],
    },
    {
      name: 'offer_pharmacist_handoff',
      actor: 'director',
      description:
        'Offers the learner a handoff to the licensed pharmacist.',
      preconditions: [
        { op: 'eq', fact: 'pharmacistAvailable', value: true },
        { op: 'eq', fact: 'handoffOffered', value: false },
      ],
      effects: [{ set: 'handoffOffered', value: true }],
    },
    {
      name: 'complete_scene',
      actor: 'director',
      description: 'Closes the scene after the professional handoff is secured.',
      preconditions: [
        { op: 'eq', fact: 'pharmacistRequested', value: true },
      ],
      effects: [{ set: 'closedByLearner', value: true }],
    },
  ],

  actionSchemas: {
    request_pharmacist: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false,
    },
    request_label_help: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false,
    },
    offer_pharmacist_handoff: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false,
    },
    complete_scene: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false,
    },
  },

  completion: [
    {
      name: 'achieved',
      predicate: {
        op: 'eq',
        fact: 'pharmacistRequested',
        value: true,
      },
    },
    {
      name: 'partial',
      predicate: {
        op: 'eq',
        fact: 'labelHelpRequested',
        value: true,
      },
    },
  ],

  checkpoints: [
    {
      id: 'cp-pharmacist-requested',
      description: 'Licensed pharmacist requested',
      after: {
        op: 'eq',
        fact: 'pharmacistRequested',
        value: true,
      },
    },
  ],

  phraseIds: [
    'phrase.es.tengo_alergia',
    'phrase.es.request_pharmacist',
    'phrase.es.find_official_leaflet',
  ],
  skillIds: [
    'skill-inquire-specifications',
    'skill-communicative-repair',
  ],
  opportunityDefinitions: [
    {
      id: 'opp.es.pharmacy.inquire-authoritative-help.open',
      skillId: 'skill-inquire-specifications',
      sceneCondition: {
        op: 'eq',
        fact: 'pharmacistAvailable',
        value: true,
      },
      positiveExamples: [
        'Describes a concrete symptom, asks for the licensed pharmacist, or asks where to find official label or leaflet information.',
      ],
      negativeExamples: [
        'Requests diagnosis, treatment selection, or dosage instead of practising a communication handoff.',
      ],
      relevantActionIds: [
        'request_pharmacist',
        'request_label_help',
      ],
      relevantIntentIds: [
        'request_pharmacist',
        'ask_label_help',
      ],
    },
  ],
  reviewStatus: 'released',
};

export const SCENES: Record<string, SceneDefinition> = {
  [CAFE_SCENE.id]: CAFE_SCENE,
  [PHARMACY_SCENE.id]: PHARMACY_SCENE,
};

export function getScene(sceneId: string): SceneDefinition | undefined {
  return SCENES[sceneId];
}
