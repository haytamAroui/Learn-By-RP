import { SceneDefinition } from '../contracts/scene';
import { PARCEL_SCENE } from './scenes/parcel';
import { NEIGHBOR_SCENE } from './scenes/neighbor';
import { METRO_SCENE } from './scenes/metro';
import { DINING_SCENE } from './scenes/dining';
import { HOTEL_SCENE } from './scenes/hotel';
import { BIKE_RENTAL_SCENE } from './scenes/rental';

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
  version: 2,
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
    'phrase.es.cafe_con_leche',
    'phrase.es.oat_milk_request',
    'phrase.es.para_llevar',
    'phrase.es.cuanto_es',
  ],
  skillIds: [
    'skill-request-substitution',
    'skill-inquire-specifications',
    'skill-propose-alternative',
    'skill-communicative-repair',
    'skill-request-repetition',
    'skill-request-slower-speech',
    'skill-ask-clarification',
    'skill-check-understanding',
    'skill-clarify-misunderstanding',
    'skill-paraphrase-when-stuck',
  ],

  pressureBranches: [
    {
      id: 'pressure.es.cafe.concise-followup',
      variantKind: 'more_concise',
      level: 'manageable',
      trigger: { op: 'eq', fact: 'itemConfirmed', value: true },
      actorInstruction:
        'Opt-in pressure branch: keep the next service follow-up brief and direct, using ordinary vocabulary and no interruption. The learner may skip this variation without penalty.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
    {
      id: 'pressure.es.cafe.single-interruption',
      variantKind: 'one_interruption',
      level: 'stretch',
      trigger: { op: 'eq', fact: 'alternativeOffered', value: true },
      actorInstruction:
        'Opt-in stretch pressure branch: interrupt once with a short relevant service question, then immediately give the floor back. Do not repeat the interruption and do not change scene facts.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
  ],

  communicationChallenges: [
    {
      id: 'challenge.es.cafe.repeat-dense-detail',
      type: 'unclear_detail',
      targetSkillId: 'skill-request-repetition',
      opportunityId: 'opp.es.cafe.repair.request-repetition',
      trigger: { op: 'eq', fact: 'itemConfirmed', value: true },
      actorInstruction:
        'Opt-in repair twist: say one ordinary but information-dense service detail once, then wait. If the learner asks you to repeat it, repeat naturally; do not pretend they failed if they answer without repair.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
    {
      id: 'challenge.es.cafe.fast-service-turn',
      type: 'fast_speech',
      targetSkillId: 'skill-request-slower-speech',
      opportunityId: 'opp.es.cafe.repair.request-slower-speech',
      trigger: { op: 'eq', fact: 'itemConfirmed', value: true },
      actorInstruction:
        'Opt-in repair twist: deliver one short service follow-up faster than the normal scene pace. Return to normal speed immediately if the learner asks you to speak more slowly.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
    {
      id: 'challenge.es.cafe.unknown-service-term',
      type: 'unknown_word',
      targetSkillId: 'skill-ask-clarification',
      opportunityId: 'opp.es.cafe.repair.ask-clarification',
      trigger: { op: 'eq', fact: 'alternativeOffered', value: true },
      actorInstruction:
        'Opt-in repair twist: use one plausible café term whose meaning is not required elsewhere in the mission, then pause so the learner can ask what it means. Explain it plainly if asked.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
    {
      id: 'challenge.es.cafe.ambiguous-service-detail',
      type: 'unclear_detail',
      targetSkillId: 'skill-check-understanding',
      opportunityId: 'opp.es.cafe.repair.check-understanding',
      trigger: { op: 'eq', fact: 'alternativeOffered', value: true },
      actorInstruction:
        'Opt-in repair twist: give a service detail that has one natural interpretation but is worth confirming. Accept a learner check such as “So you mean …, right?” and clarify without penalty.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
    {
      id: 'challenge.es.cafe.mishear-service-mode',
      type: 'scripted_mishearing',
      targetSkillId: 'skill-clarify-misunderstanding',
      opportunityId: 'opp.es.cafe.repair.clarify-misunderstanding',
      trigger: { op: 'eq', fact: 'itemConfirmed', value: true },
      actorInstruction:
        'Opt-in repair twist: once only, misunderstand the learner’s intended service mode (for here vs takeaway) and state the wrong interpretation. Correct it immediately when the learner clarifies what they meant.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
    {
      id: 'challenge.es.cafe.reformulation-followup',
      type: 'unexpected_followup',
      targetSkillId: 'skill-paraphrase-when-stuck',
      opportunityId: 'opp.es.cafe.repair.paraphrase-when-stuck',
      trigger: { op: 'eq', fact: 'itemConfirmed', value: true },
      actorInstruction:
        'Opt-in repair twist: say you did not understand one non-essential word or expression the learner used and ask them to explain the same idea another way. Accept any clear paraphrase; never demand a target phrase.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
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
    {
      id: 'opp.es.cafe.repair.request-repetition',
      skillId: 'skill-request-repetition',
      sceneCondition: { op: 'eq', fact: 'itemConfirmed', value: true },
      positiveExamples: [
        'Asks the barista to repeat the just-delivered service detail because it was not caught.',
        'Uses a natural repetition request such as “¿Puede repetirlo, por favor?”.',
      ],
      negativeExamples: [
        'Asks the barista to speak more slowly without requesting repetition.',
        'Continues the order without addressing the missed detail.',
      ],
      relevantIntentIds: ['request_repetition'],
      communicationChallengeId: 'challenge.es.cafe.repeat-dense-detail',
    },
    {
      id: 'opp.es.cafe.repair.request-slower-speech',
      skillId: 'skill-request-slower-speech',
      sceneCondition: { op: 'eq', fact: 'itemConfirmed', value: true },
      positiveExamples: [
        'Explicitly asks the barista to speak more slowly after the faster service turn.',
        'Uses a natural request such as “¿Puede hablar más despacio, por favor?”.',
      ],
      negativeExamples: [
        'Requests verbatim repetition without asking for a slower pace.',
        'Uses the Slow accessibility control without producing a repair request.',
      ],
      relevantIntentIds: ['request_slower_speech'],
      communicationChallengeId: 'challenge.es.cafe.fast-service-turn',
    },
    {
      id: 'opp.es.cafe.repair.ask-clarification',
      skillId: 'skill-ask-clarification',
      sceneCondition: { op: 'eq', fact: 'alternativeOffered', value: true },
      positiveExamples: [
        'Identifies the unfamiliar café term or unclear phrase and asks what it means.',
        'Uses a focused clarification question rather than guessing.',
      ],
      negativeExamples: [
        'Asks for a new product fact unrelated to the unclear expression.',
        'Repeats the character’s words without asking for meaning.',
      ],
      relevantIntentIds: ['ask_clarification'],
      communicationChallengeId: 'challenge.es.cafe.unknown-service-term',
    },
    {
      id: 'opp.es.cafe.repair.check-understanding',
      skillId: 'skill-check-understanding',
      sceneCondition: { op: 'eq', fact: 'alternativeOffered', value: true },
      positiveExamples: [
        'States an interpretation of the service detail and asks the barista to confirm it.',
        'Uses a check such as “Entonces quiere decir que…, ¿verdad?”.',
      ],
      negativeExamples: [
        'Asks an open clarification question without proposing an interpretation.',
        'Changes the order without checking the uncertain detail.',
      ],
      relevantIntentIds: ['check_understanding'],
      communicationChallengeId: 'challenge.es.cafe.ambiguous-service-detail',
    },
    {
      id: 'opp.es.cafe.repair.clarify-misunderstanding',
      skillId: 'skill-clarify-misunderstanding',
      sceneCondition: { op: 'eq', fact: 'itemConfirmed', value: true },
      positiveExamples: [
        'Corrects the barista’s wrong interpretation and clearly restates the intended service mode.',
        'Uses a repair such as “No, quería decir para llevar, no para tomar aquí.”',
      ],
      negativeExamples: [
        'Accepts the wrong interpretation without correction.',
        'Simply repeats the same words without making the intended meaning clearer.',
      ],
      relevantIntentIds: ['clarify_misunderstanding'],
      communicationChallengeId: 'challenge.es.cafe.mishear-service-mode',
    },
    {
      id: 'opp.es.cafe.repair.paraphrase-when-stuck',
      skillId: 'skill-paraphrase-when-stuck',
      sceneCondition: { op: 'eq', fact: 'itemConfirmed', value: true },
      positiveExamples: [
        'Explains the same intended idea with different words after the barista asks for reformulation.',
        'Uses a description, example, or simpler wording rather than abandoning the meaning.',
      ],
      negativeExamples: [
        'Repeats the same unexplained word verbatim.',
        'Switches topic instead of attempting to express the intended idea another way.',
      ],
      relevantIntentIds: ['paraphrase_when_stuck'],
      communicationChallengeId: 'challenge.es.cafe.reformulation-followup',
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
      knowledgeBoundary: ['knows where product labels and warning information are displayed', 'knows opening hours', 'does not diagnose, recommend treatment, or give individualized dosage advice'],
      mayKnowAboutPriorScenes: [],
    },
  ],

  factSchema: {
    drowsinessMedicineAvailable: { type: 'boolean' },
    nonDrowsyMedicineAvailable: { type: 'boolean' },
    ingredientQuestionAsked: { type: 'boolean' },
    itemConfirmed: { type: 'boolean' },
    alternativeOffered: { type: 'boolean' },
    closedByLearner: { type: 'boolean' },
  },

  initialFacts: {
    drowsinessMedicineAvailable: true,
    nonDrowsyMedicineAvailable: true,
    ingredientQuestionAsked: false,
    itemConfirmed: false,
    alternativeOffered: false,
    closedByLearner: false,
  },

  learnerKnows: ['They want to describe a symptom and ask how to find official non-drowsiness and usage information on a product label.'],
  characterKnows: { pharmacist: ['The shelf contains products with official labels describing warnings and drowsiness information.'] },

  allowedActions: [
    {
      name: 'ask_about_ingredient',
      actor: 'character',
      description: 'Learner asks whether a medicine causes drowsiness.',
      preconditions: [],
      effects: [{ set: 'ingredientQuestionAsked', value: true }],
    },
    {
      name: 'confirm_order_item',
      actor: 'character',
      description: 'Confirms that the learner has located the official label information for the product they named; does not recommend or approve treatment.',
      preconditions: [],
      effects: [{ set: 'itemConfirmed', value: true }],
    },
    {
      name: 'offer_alternative',
      actor: 'director',
      description: 'Points to another package label the learner can compare; does not recommend a treatment.',
      preconditions: [{ op: 'eq', fact: 'alternativeOffered', value: false }],
      effects: [{ set: 'alternativeOffered', value: true }],
    },
    {
      name: 'complete_scene',
      actor: 'director',
      description: 'Closes the scene.',
      preconditions: [{ op: 'eq', fact: 'itemConfirmed', value: true }],
      effects: [{ set: 'closedByLearner', value: true }],
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
      // The task is complete when the learner obtains the official product-label information they asked for.
      name: 'achieved',
      predicate: { op: 'eq', fact: 'itemConfirmed', value: true },
    },
    {
      name: 'partial',
      predicate: { op: 'eq', fact: 'ingredientQuestionAsked', value: true },
    },
  ],

  checkpoints: [
    {
      id: 'cp-item-confirmed',
      description: 'Official label information located',
      after: { op: 'eq', fact: 'itemConfirmed', value: true },
    },
  ],

  phraseIds: [
    'phrase.es.tengo_alergia',
    'phrase.es.que_no_de_sueno',
    'phrase.es.instrucciones_envase',
  ],
  skillIds: [
    'skill-inquire-specifications',
    'skill-communicative-repair',
    'skill-request-substitution',
  ],
  communicationChallenges: [],
  pressureBranches: [],
  opportunityDefinitions: [
    {
      id: 'opp.es.pharmacy.inquire-specifications.open',
      skillId: 'skill-inquire-specifications',
      sceneCondition: {
        op: 'eq',
        fact: 'nonDrowsyMedicineAvailable',
        value: true,
      },
      positiveExamples: [
        'Asks where the official label states drowsiness, use, warnings, or another concrete product condition.',
      ],
      negativeExamples: [
        'Names a product without asking about the relevant condition.',
      ],
      relevantActionIds: ['ask_about_ingredient'],
      relevantIntentIds: ['ask_label_instructions', 'request_product_information'],
    },
    {
      id: 'opp.es.pharmacy.request-substitution.after-label-comparison',
      skillId: 'skill-request-substitution',
      sceneCondition: { op: 'eq', fact: 'alternativeOffered', value: true },
      positiveExamples: [
        'After comparing official label information, asks to look at another available package that matches the stated non-drowsiness constraint.',
      ],
      negativeExamples: [
        'Asks the pharmacist to choose or prescribe treatment instead of requesting another package to compare.',
      ],
      relevantActionIds: ['confirm_order_item'],
      relevantIntentIds: ['request_product_information'],
    },
  ],
  reviewStatus: 'released',
};

export const SCENES: Record<string, SceneDefinition> = {
  [CAFE_SCENE.id]: CAFE_SCENE,
  [PARCEL_SCENE.id]: PARCEL_SCENE,
  [NEIGHBOR_SCENE.id]: NEIGHBOR_SCENE,
  [METRO_SCENE.id]: METRO_SCENE,
  [PHARMACY_SCENE.id]: PHARMACY_SCENE,
  [DINING_SCENE.id]: DINING_SCENE,
  [HOTEL_SCENE.id]: HOTEL_SCENE,
  [BIKE_RENTAL_SCENE.id]: BIKE_RENTAL_SCENE,
};

export function getScene(sceneId: string): SceneDefinition | undefined {
  return SCENES[sceneId];
}
