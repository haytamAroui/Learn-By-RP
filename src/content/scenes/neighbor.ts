import {
  OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
  type SceneDefinition,
} from '../../contracts/scene';

export const NEIGHBOR_SCENE: SceneDefinition = {
  id: 'scene.es.neighbor.key-handover',
  version: 1,
  missionId: 'mission-es-neighbors-door',
  language: 'es',

  characters: [
    {
      id: 'neighbor',
      name: 'Sofia',
      role: 'neighbor',
      voiceStyle: 'Casual, warm, natural short turns',
      knowledgeBoundary: [
        'knows the superintendent left the terrace key with her',
        'knows she must leave for work soon',
        'can agree a nearby handover arrangement',
      ],
      mayKnowAboutPriorScenes: [],
    },
  ],

  factSchema: {
    keyConfirmed: { type: 'boolean' },
    neighborInRush: { type: 'boolean' },
    alternativeOffered: { type: 'boolean' },
    meetingPlace: { type: 'enum', values: ['unset', 'cafe_downstairs'] },
    arrangementConfirmed: { type: 'boolean' },
  },

  initialFacts: {
    keyConfirmed: false,
    neighborInRush: true,
    alternativeOffered: false,
    meetingPlace: 'unset',
    arrangementConfirmed: false,
  },

  learnerKnows: [
    'They need the terrace key.',
    'Sofia may be leaving soon, so a quick handover may need another location.',
  ],

  characterKnows: {
    neighbor: [
      'The spare terrace key is with Sofia.',
      'Sofia needs to leave for work soon.',
      'The café downstairs is a workable handover point.',
    ],
  },

  allowedActions: [
    {
      name: 'ask_specification',
      actor: 'character',
      description: 'The learner asks whether Sofia has the terrace key.',
      preconditions: [{ op: 'eq', fact: 'keyConfirmed', value: false }],
      effects: [{ set: 'keyConfirmed', value: true }],
    },
    {
      name: 'offer_alternative',
      actor: 'director',
      description: 'Sofia explains she is in a rush and opens the option of meeting downstairs.',
      preconditions: [
        { op: 'eq', fact: 'keyConfirmed', value: true },
        { op: 'eq', fact: 'neighborInRush', value: true },
        { op: 'eq', fact: 'alternativeOffered', value: false },
      ],
      effects: [{ set: 'alternativeOffered', value: true }],
    },
    {
      name: 'propose_arrangement',
      actor: 'character',
      description: 'The learner proposes meeting downstairs at the café for the handover.',
      preconditions: [{ op: 'eq', fact: 'alternativeOffered', value: true }],
      effects: [{ set: 'meetingPlace', value: 'cafe_downstairs' }],
    },
    {
      name: 'confirm_arrangement',
      actor: 'character',
      description: 'Sofia confirms the handover location.',
      preconditions: [{ op: 'eq', fact: 'meetingPlace', value: 'cafe_downstairs' }],
      effects: [{ set: 'arrangementConfirmed', value: true }],
    },
  ],

  actionSchemas: {
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
    id: 'neighbor-leaving-soon',
    description: 'Sofia is leaving soon, so the learner needs a workable alternative handover arrangement.',
    trigger: {
      op: 'and',
      predicates: [
        { op: 'eq', fact: 'keyConfirmed', value: true },
        { op: 'eq', fact: 'neighborInRush', value: true },
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
          { op: 'eq', fact: 'keyConfirmed', value: true },
          { op: 'eq', fact: 'meetingPlace', value: 'cafe_downstairs' },
          { op: 'eq', fact: 'arrangementConfirmed', value: true },
        ],
      },
    },
    {
      name: 'partial',
      predicate: { op: 'eq', fact: 'keyConfirmed', value: true },
    },
  ],

  checkpoints: [
    {
      id: 'cp-key-confirmed',
      description: 'Sofia confirms she has the key',
      after: { op: 'eq', fact: 'keyConfirmed', value: true },
    },
    {
      id: 'cp-handover-arranged',
      description: 'The handover location is agreed',
      after: { op: 'eq', fact: 'arrangementConfirmed', value: true },
    },
  ],

  phraseIds: [
    'phrase.es.tienes_un_momento',
    'phrase.es.proponer_lugar',
    'phrase.es.muchas_gracias',
  ],

  skillIds: [
    'skill-propose-alternative',
    'skill-inquire-specifications',
    'skill-communicative-repair',
    'skill-check-understanding',
    'skill-clarify-misunderstanding',
  ],

  communicationChallenges: [
    {
      id: 'challenge.es.neighbor.check-handover-detail',
      type: 'unclear_detail',
      targetSkillId: 'skill-check-understanding',
      opportunityId: 'opp.es.neighbor.repair.check-understanding',
      trigger: { op: 'eq', fact: 'alternativeOffered', value: true },
      actorInstruction:
        'Opt-in repair twist: give one handover detail with a natural interpretation that is worth confirming. Accept a learner check such as “Entonces nos vemos abajo, ¿verdad?”.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
    {
      id: 'challenge.es.neighbor.mishear-location',
      type: 'scripted_mishearing',
      targetSkillId: 'skill-clarify-misunderstanding',
      opportunityId: 'opp.es.neighbor.repair.clarify-misunderstanding',
      trigger: { op: 'eq', fact: 'meetingPlace', value: 'cafe_downstairs' },
      actorInstruction:
        'Opt-in repair twist: once only, state the wrong nearby meeting place. Correct it immediately when the learner clarifies where they meant.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
  ],

  pressureBranches: [
    {
      id: 'pressure.es.neighbor.one-interruption',
      variantKind: 'one_interruption',
      level: 'manageable',
      trigger: { op: 'eq', fact: 'keyConfirmed', value: true },
      actorInstruction:
        'Opt-in pressure branch: interrupt once with a brief practical question because Sofia is leaving soon, then immediately return the floor to the learner.',
      requiresLearnerOptIn: true,
      skippable: true,
    },
  ],

  opportunityDefinitions: [
    {
      id: 'opp.es.neighbor.inquire-specifications',
      skillId: 'skill-inquire-specifications',
      evidenceBand: 'a1',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "A direct question about one shared object, the spare key.",
      },
      sceneCondition: { op: 'eq', fact: 'neighborInRush', value: true },
      positiveExamples: [
        'Asks directly whether Sofia has the terrace key or another concrete handover detail.',
      ],
      negativeExamples: [
        'Makes small talk without asking for the information needed to solve the handover.',
      ],
      relevantActionIds: ['ask_specification'],
      relevantIntentIds: ['ask_neighbor_help'],
    },
    {
      id: 'opp.es.neighbor.propose-alternative',
      skillId: 'skill-propose-alternative',
      evidenceBand: 'a2',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "A handover point has to be generated while the neighbour is leaving, so the proposal is produced under time pressure rather than chosen from options.",
      },
      sceneCondition: { op: 'eq', fact: 'alternativeOffered', value: true },
      positiveExamples: [
        'Suggests another nearby meeting place or handover arrangement because Sofia is in a rush.',
      ],
      negativeExamples: [
        'Only says the current timing does not work without proposing another arrangement.',
      ],
      relevantActionIds: ['propose_arrangement'],
      relevantIntentIds: ['propose_alternative_meeting'],
    },
    {
      id: 'opp.es.neighbor.repair.check-understanding',
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
        'States the understood handover detail and asks Sofia to confirm it.',
      ],
      negativeExamples: [
        'Asks an open clarification question without proposing an interpretation.',
      ],
      relevantIntentIds: ['check_understanding'],
      communicationChallengeId: 'challenge.es.neighbor.check-handover-detail',
    },
    {
      id: 'opp.es.neighbor.repair.clarify-misunderstanding',
      skillId: 'skill-clarify-misunderstanding',
      evidenceBand: 'b1',
      assessedChannel: 'interaction',
      eligibleModalities: ['typed', 'spoken'],
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'authored_pending_review',
        rationale: "The partner states the wrong meeting place. The learner tracks the discrepancy, contradicts it, specifies the correct one, and repairs shared understanding.",
      },
      sceneCondition: { op: 'eq', fact: 'meetingPlace', value: 'cafe_downstairs' },
      positiveExamples: [
        'Corrects Sofia’s mistaken location and clearly restates the intended meeting place.',
      ],
      negativeExamples: [
        'Accepts the wrong location or repeats the same wording without clarifying.',
      ],
      relevantIntentIds: ['clarify_misunderstanding'],
      communicationChallengeId: 'challenge.es.neighbor.mishear-location',
    },
  ],

  reviewStatus: 'released',
};
