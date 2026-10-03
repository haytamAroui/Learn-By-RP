import type { SceneDefinition } from '../../contracts/scene';

export const METRO_SCENE: SceneDefinition = {
  id: 'scene.es.metro.ticket-platform',
  version: 1,
  missionId: 'mission-es-metro-station',
  language: 'es',

  characters: [
    {
      id: 'metro-attendant',
      name: 'Javier',
      role: 'metro attendant',
      voiceStyle: 'Clear, practical, moderately fast Madrid Spanish',
      knowledgeBoundary: [
        'knows the Tarjeta Multi and ten-journey ticket process',
        'knows Line 1 toward Atocha leaves from platform 1',
        'knows the machine can fail to print a receipt',
      ],
      mayKnowAboutPriorScenes: [],
    },
  ],

  factSchema: {
    ticketQuestionOpen: { type: 'boolean' },
    ticketInfoKnown: { type: 'boolean' },
    platformKnown: { type: 'boolean' },
    machineIssuePresent: { type: 'boolean' },
    issueReported: { type: 'boolean' },
    journeyConfirmed: { type: 'boolean' },
  },

  initialFacts: {
    ticketQuestionOpen: true,
    ticketInfoKnown: false,
    platformKnown: false,
    machineIssuePresent: true,
    issueReported: false,
    journeyConfirmed: false,
  },

  learnerKnows: [
    'They want a ten-journey card.',
    'They need to travel toward Atocha.',
    'The machine may not have produced a receipt.',
  ],

  characterKnows: {
    'metro-attendant': [
      'A Tarjeta Multi can carry a ten-journey ticket.',
      'Line 1 toward Atocha uses platform 1 here.',
      'A receipt issue can be reported at the service point.',
    ],
  },

  allowedActions: [
    {
      name: 'ask_specification',
      actor: 'character',
      description: 'The learner asks how to buy or load the ten-journey ticket.',
      preconditions: [{ op: 'eq', fact: 'ticketInfoKnown', value: false }],
      effects: [{ set: 'ticketInfoKnown', value: true }],
    },
    {
      name: 'ask_wayfinding',
      actor: 'character',
      description: 'The learner asks which platform or direction goes toward Atocha.',
      preconditions: [{ op: 'eq', fact: 'platformKnown', value: false }],
      effects: [{ set: 'platformKnown', value: true }],
    },
    {
      name: 'report_issue',
      actor: 'character',
      description: 'The learner reports the optional ticket-machine receipt problem.',
      preconditions: [{ op: 'eq', fact: 'machineIssuePresent', value: true }],
      effects: [{ set: 'issueReported', value: true }],
    },
    {
      name: 'confirm_arrangement',
      actor: 'character',
      description: 'The learner confirms the ticket and platform information before continuing the journey.',
      preconditions: [
        {
          op: 'and',
          predicates: [
            { op: 'eq', fact: 'ticketInfoKnown', value: true },
            { op: 'eq', fact: 'platformKnown', value: true },
          ],
        },
      ],
      effects: [{ set: 'journeyConfirmed', value: true }],
    },
  ],

  actionSchemas: {
    ask_specification: {
      type: 'object',
      required: ['topic'],
      properties: { topic: { type: 'string' } },
      additionalProperties: false,
    },
    ask_wayfinding: {
      type: 'object',
      required: ['destination'],
      properties: { destination: { type: 'string' } },
      additionalProperties: false,
    },
    report_issue: {
      type: 'object',
      required: ['issue'],
      properties: { issue: { type: 'string' } },
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
    id: 'metro-machine-receipt-missing',
    description: 'The machine did not print a receipt; this is optional and never blocks the journey task.',
    trigger: { op: 'eq', fact: 'machineIssuePresent', value: true },
    maxPerScene: 1,
    practiceVariation: true,
  },

  completion: [
    {
      name: 'achieved',
      predicate: {
        op: 'and',
        predicates: [
          { op: 'eq', fact: 'ticketInfoKnown', value: true },
          { op: 'eq', fact: 'platformKnown', value: true },
          { op: 'eq', fact: 'journeyConfirmed', value: true },
        ],
      },
    },
    {
      name: 'partial',
      predicate: {
        op: 'or',
        predicates: [
          { op: 'eq', fact: 'ticketInfoKnown', value: true },
          { op: 'eq', fact: 'platformKnown', value: true },
        ],
      },
    },
  ],

  checkpoints: [
    {
      id: 'cp-ticket-info',
      description: 'Ticket information is understood',
      after: { op: 'eq', fact: 'ticketInfoKnown', value: true },
    },
    {
      id: 'cp-route-info',
      description: 'Platform and direction are known',
      after: { op: 'eq', fact: 'platformKnown', value: true },
    },
  ],

  phraseIds: [
    'phrase.es.tarjeta_diez_viajes',
    'phrase.es.por_que_anden',
    'phrase.es.la_maquina_no_funciona',
  ],

  skillIds: [
    'skill-wayfinding-transit',
    'skill-inquire-specifications',
    'skill-communicative-repair',
    'skill-request-repetition',
    'skill-ask-clarification',
    'skill-check-understanding',
  ],

  communicationChallenges: [
    {
      id: 'challenge.es.metro.repeat-platform-detail',
      type: 'unclear_detail',
      targetSkillId: 'skill-request-repetition',
      opportunityId: 'opp.es.metro.repair.request-repetition',
      trigger: { op: 'eq', fact: 'platformKnown', value: true },
      actorInstruction:
        'Opt-in repair twist: give the platform and direction detail once in a compact service turn, then wait. Repeat naturally if the learner asks.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
    {
      id: 'challenge.es.metro.unknown-transit-term',
      type: 'unknown_word',
      targetSkillId: 'skill-ask-clarification',
      opportunityId: 'opp.es.metro.repair.ask-clarification',
      trigger: { op: 'eq', fact: 'ticketInfoKnown', value: true },
      actorInstruction:
        'Opt-in repair twist: use one ordinary transit term that is not required for completion, then pause. Explain it plainly if the learner asks what it means.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
    {
      id: 'challenge.es.metro.check-direction',
      type: 'unclear_detail',
      targetSkillId: 'skill-check-understanding',
      opportunityId: 'opp.es.metro.repair.check-understanding',
      trigger: { op: 'eq', fact: 'platformKnown', value: true },
      actorInstruction:
        'Opt-in repair twist: give a direction detail that is worth confirming. Accept a learner check such as “Entonces es el andén uno, ¿verdad?”.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
  ],

  pressureBranches: [
    {
      id: 'pressure.es.metro.concise-commuter-turn',
      variantKind: 'more_concise',
      level: 'manageable',
      trigger: { op: 'eq', fact: 'ticketInfoKnown', value: true },
      actorInstruction:
        'Opt-in pressure branch: make the next station-service response concise, as during a busy commuter period, without hiding required information.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
  ],

  opportunityDefinitions: [
    {
      id: 'opp.es.metro.inquire-specifications',
      skillId: 'skill-inquire-specifications',
      sceneCondition: { op: 'eq', fact: 'ticketQuestionOpen', value: true },
      positiveExamples: [
        'Asks a concrete question about buying, loading, paying for, or validating the ten-journey ticket.',
      ],
      negativeExamples: [
        'Only names the ticket without asking for the information needed to use it.',
      ],
      relevantActionIds: ['ask_specification'],
      relevantIntentIds: ['purchase_transit_ticket'],
    },
    {
      id: 'opp.es.metro.wayfinding',
      skillId: 'skill-wayfinding-transit',
      sceneCondition: { op: 'eq', fact: 'ticketQuestionOpen', value: true },
      positiveExamples: [
        'Asks which platform, direction, or line reaches Atocha.',
      ],
      negativeExamples: [
        'Names Atocha without asking for actionable route information.',
      ],
      relevantActionIds: ['ask_wayfinding'],
      relevantIntentIds: ['ask_platform'],
    },
    {
      id: 'opp.es.metro.repair.request-repetition',
      skillId: 'skill-request-repetition',
      sceneCondition: { op: 'eq', fact: 'platformKnown', value: true },
      positiveExamples: [
        'Asks Javier to repeat the compact platform or direction detail.',
      ],
      negativeExamples: [
        'Asks a new route question instead of requesting repetition.',
      ],
      relevantIntentIds: ['request_repetition'],
      communicationChallengeId: 'challenge.es.metro.repeat-platform-detail',
    },
    {
      id: 'opp.es.metro.repair.ask-clarification',
      skillId: 'skill-ask-clarification',
      sceneCondition: { op: 'eq', fact: 'ticketInfoKnown', value: true },
      positiveExamples: [
        'Asks what the unfamiliar transit term means rather than guessing.',
      ],
      negativeExamples: [
        'Requests the same sentence again without asking for meaning.',
      ],
      relevantIntentIds: ['ask_clarification'],
      communicationChallengeId: 'challenge.es.metro.unknown-transit-term',
    },
    {
      id: 'opp.es.metro.repair.check-understanding',
      skillId: 'skill-check-understanding',
      sceneCondition: { op: 'eq', fact: 'platformKnown', value: true },
      positiveExamples: [
        'States the understood route or platform and asks Javier to confirm it.',
      ],
      negativeExamples: [
        'Asks an open route question without proposing an interpretation.',
      ],
      relevantIntentIds: ['check_understanding'],
      communicationChallengeId: 'challenge.es.metro.check-direction',
    },
  ],

  reviewStatus: 'released',
};
