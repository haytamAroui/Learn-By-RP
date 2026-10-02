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

  initialFacts: {
    menuVisible: true,
    oatMilkAvailable: false,
    almondMilkAvailable: true,
    wholeMilkAvailable: true,
    trainDepartsSoon: true,
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
      effects: [
        { set: 'orderedItem', from: 'item', default: 'unspecified' },
        { set: 'itemConfirmed', default: true },
      ],
    },
    {
      name: 'offer_alternative',
      actor: 'director',
      description: 'Offers a substitute when the requested item is unavailable.',
      preconditions: [{ notFact: 'alternativeOffered' }],
      effects: [
        { set: 'alternativeOffered', from: 'alternative', default: 'leche de almendra' },
      ],
    },
    {
      name: 'confirm_takeaway',
      actor: 'character',
      description: 'Confirms the order is for here rather than to go.',
      preconditions: [{ fact: 'itemConfirmed' }],
      effects: [{ set: 'takeaway', from: 'takeaway', default: false }],
    },
    {
      name: 'confirm_for_here',
      actor: 'character',
      description: 'Confirms the order is to be served in the café.',
      preconditions: [{ fact: 'itemConfirmed' }],
      effects: [{ set: 'forHere', default: true }],
    },
    {
      name: 'ask_about_ingredient',
      actor: 'character',
      description: 'The learner asks whether an item contains something.',
      preconditions: [{ fact: 'itemConfirmed' }],
      effects: [{ set: 'ingredientQuestionAsked', default: true }],
    },
    {
      name: 'complete_scene',
      actor: 'director',
      description: 'Closes the scene explicitly when the learner is done.',
      preconditions: [{ fact: 'itemConfirmed' }],
      effects: [{ set: 'closedByLearner', default: true }],
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
      properties: { takeaway: { type: 'boolean' } },
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
    trigger: { fact: 'oatMilkAvailable', equals: false },
    maxPerScene: 1,
  },

  completion: [
    {
      // §9.3: an available item is confirmed AND a service mode is settled.
      name: 'achieved',
      predicate: {
        all: [
          { fact: 'itemConfirmed' },
          { any: [{ fact: 'takeaway' }, { fact: 'forHere' }] },
        ],
      },
    },
    {
      name: 'partial',
      predicate: { fact: 'itemConfirmed' },
    },
  ],

  checkpoints: [
    { id: 'cp-item-confirmed', description: 'An item is on the order', after: { fact: 'itemConfirmed' } },
    {
      id: 'cp-service-settled',
      description: 'Service mode settled',
      after: { all: [{ fact: 'itemConfirmed' }, { any: [{ fact: 'takeaway' }, { fact: 'forHere' }] }] },
    },
  ],

  // Curated mappings only. Never model-generated.
  phraseIds: [
    'phrase.es.cafe_leche',
    'phrase.es.leche_almendra',
    'phrase.es.para_llevar',
    'phrase.es.cuanto_cuesta',
  ],
  skillIds: ['skill-request-substitution', 'skill-request-item', 'skill-clarify-service'],

  opportunityDefinitions: [
    {
      id: 'opp.es.cafe.request-substitution.after-alternative',
      skillId: 'skill-request-substitution',
      sceneCondition: { fact: 'alternativeOffered' },
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
      sceneCondition: { fact: 'itemConfirmed' },
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
  version: 1,
  missionId: 'mission-es-farmacia-sol',
  language: 'es',

  characters: [
    {
      id: 'pharmacist',
      name: 'Elena',
      role: 'pharmacist',
      voiceStyle: 'Calm, precise, brief',
      knowledgeBoundary: ['knows which medicines are non-drowsy', 'knows opening hours'],
      mayKnowAboutPriorScenes: [],
    },
  ],

  initialFacts: {
    drowsinessMedicineAvailable: true,
    nonDrowsyMedicineAvailable: true,
    symptomKnown: false,
  },

  learnerKnows: ['They have a headache and want something that will not make them sleepy.'],
  characterKnows: { pharmacist: ['A drowsy medicine and a non-drowsy one are both on the shelf.'] },

  allowedActions: [
    {
      name: 'ask_about_ingredient',
      actor: 'character',
      description: 'Learner asks whether a medicine causes drowsiness.',
      preconditions: [],
      effects: [{ set: 'ingredientQuestionAsked', default: true }],
    },
    {
      name: 'confirm_order_item',
      actor: 'character',
      description: 'Accepts the medicine the learner names.',
      preconditions: [],
      effects: [
        { set: 'orderedItem', from: 'item', default: 'unspecified' },
        { set: 'itemConfirmed', default: true },
      ],
    },
    {
      name: 'offer_alternative',
      actor: 'director',
      description: 'Offers the non-drowsy alternative.',
      preconditions: [{ notFact: 'alternativeOffered' }],
      effects: [{ set: 'alternativeOffered', from: 'alternative', default: 'no somnolencia' }],
    },
    {
      name: 'complete_scene',
      actor: 'director',
      description: 'Closes the scene.',
      preconditions: [{ fact: 'itemConfirmed' }],
      effects: [{ set: 'closedByLearner', default: true }],
    },
  ],

  actionSchemas: {
    ask_about_ingredient: {
      type: 'object',
      required: [],
      properties: { ingredient: { type: 'string' } },
      additionalProperties: false,
    },
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
    complete_scene: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false,
    },
  },

  completion: [
    {
      // The task is complete when the learner secures a non-drowsy option.
      name: 'achieved',
      predicate: {
        all: [
          { fact: 'itemConfirmed' },
          { any: [{ fact: 'alternativeOffered' }, { fact: 'itemConfirmed' }] },
        ],
      },
    },
    { name: 'partial', predicate: { fact: 'ingredientQuestionAsked' } },
  ],

  checkpoints: [
    { id: 'cp-symptom-known', description: 'Symptom described', after: { fact: 'symptomKnown' } },
    { id: 'cp-item-confirmed', description: 'Medicine chosen', after: { fact: 'itemConfirmed' } },
  ],

  phraseIds: ['phrase.es.sin_somnio', 'phrase.es.dolor_cabeza'],
  skillIds: ['skill-request-substitution', 'skill-clarify-service'],
  opportunityDefinitions: [
    {
      id: 'opp.es.pharmacy.inquire-specifications.open',
      skillId: 'skill-inquire-specifications',
      sceneCondition: { fact: 'nonDrowsyMedicineAvailable' },
      positiveExamples: [
        'Asks whether an option causes drowsiness or asks another concrete product-condition question.',
      ],
      negativeExamples: [
        'Names a product without asking about the relevant condition.',
      ],
      relevantActionIds: ['ask_about_ingredient'],
      relevantIntentIds: ['ask_dosage', 'request_medicine'],
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
