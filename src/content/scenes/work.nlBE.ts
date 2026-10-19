import type { SceneDefinition } from '../../contracts/scene';

/**
 * Authored workplace scene. Draft until reviewed by a Belgian Dutch speaker and
 * the content/simulation release gates are satisfied. Scene truth is finite,
 * language evidence comes only from a real learner passage plus opportunity.
 */
export const NL_BE_WORK_DAMAGED_DELIVERY_SCENE: SceneDefinition = {
  id: 'scene.nl-be.work.damaged-delivery',
  version: 1,
  missionId: 'mission-nl-be-work-damaged-delivery',
  language: 'nl',
  speechVariety: 'standard',
  characters: [
    {
      id: 'supervisor',
      name: 'Sofie',
      role: 'warehouse team leader',
      voiceStyle: 'Natural Belgian Standard Dutch, short work instructions',
      knowledgeBoundary: [
        'Does not know damage has been found until the learner reports it',
        'Can explain the fictional next step of separating the three boxes and noting the damage',
        'Never makes claims about binding safety or company policy',
      ],
      mayKnowAboutPriorScenes: [],
    },
  ],
  factSchema: {
    problemReported: { type: 'boolean' },
    nextStepRequested: { type: 'boolean' },
    nextStepConfirmed: { type: 'boolean' },
  },
  initialFacts: {
    problemReported: false,
    nextStepRequested: false,
    nextStepConfirmed: false,
  },
  learnerKnows: [
    'Three cardboard boxes in this fictional delivery have visible damage.',
    'You should communicate with the team leader instead of guessing what to do.',
  ],
  characterKnows: {
    supervisor: [
      'In this simulated workflow, damaged boxes are set aside and the damage is reported.',
      'The supervisor must wait for the learner to report the damage before discussing the next step.',
    ],
  },
  allowedActions: [
    {
      name: 'report_issue',
      actor: 'character',
      description: 'The learner communicates that three boxes in the delivery are damaged.',
      preconditions: [{ op: 'eq', fact: 'problemReported', value: false }],
      effects: [{ set: 'problemReported', value: true }],
    },
    {
      name: 'ask_specification',
      actor: 'character',
      description: 'After reporting the damage, the learner asks what to do with the damaged boxes.',
      preconditions: [
        { op: 'eq', fact: 'problemReported', value: true },
        { op: 'eq', fact: 'nextStepRequested', value: false },
      ],
      effects: [{ set: 'nextStepRequested', value: true }],
    },
    {
      name: 'confirm_arrangement',
      actor: 'character',
      description: 'After hearing the simulated instruction, the learner checks and confirms the action in their own words.',
      preconditions: [
        { op: 'eq', fact: 'nextStepRequested', value: true },
        { op: 'eq', fact: 'nextStepConfirmed', value: false },
      ],
      effects: [{ set: 'nextStepConfirmed', value: true }],
    },
  ],
  actionSchemas: {
    report_issue: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false,
    },
    ask_specification: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false,
    },
    confirm_arrangement: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false,
    },
  },
  completion: [
    { name: 'achieved', predicate: { op: 'eq', fact: 'nextStepConfirmed', value: true } },
    { name: 'partial', predicate: { op: 'eq', fact: 'problemReported', value: true } },
  ],
  checkpoints: [
    {
      id: 'cp-nl-be-work-damage-reported',
      description: 'Delivery problem has been reported',
      after: { op: 'eq', fact: 'problemReported', value: true },
    },
  ],
  phraseIds: [
    'phrase.nl-be.work.dozen_beschadigd',
    'phrase.nl-be.work.wat_moet_ik_doen',
    'phrase.nl-be.work.bedoelt_u',
  ],
  skillIds: [
    'skill-report-workplace-problem',
    'skill-inquire-specifications',
    'skill-check-understanding',
  ],
  communicationChallenges: [],
  pressureBranches: [],
  opportunityDefinitions: [
    {
      id: 'opp.nl-be.work.report-damage',
      skillId: 'skill-report-workplace-problem',
      sceneCondition: { op: 'eq', fact: 'problemReported', value: false },
      positiveExamples: [
        'Reports that three boxes in the delivery are damaged and identifies the concrete problem.',
        'Says in Belgian Dutch: Er zijn drie dozen beschadigd.',
      ],
      negativeExamples: [
        'Only says hello without describing a problem.',
        'Claims damage has been reported when they did not tell the supervisor.',
      ],
      relevantActionIds: ['report_issue'],
      relevantIntentIds: ['report_damaged_delivery'],
    },
    {
      id: 'opp.nl-be.work.ask-next-step',
      skillId: 'skill-inquire-specifications',
      sceneCondition: {
        op: 'and',
        predicates: [
          { op: 'eq', fact: 'problemReported', value: true },
          { op: 'eq', fact: 'nextStepRequested', value: false },
        ],
      },
      positiveExamples: [
        'Asks what to do next with the damaged boxes rather than making an assumption.',
      ],
      negativeExamples: [
        'States that the problem is solved without asking for instructions.',
      ],
      relevantActionIds: ['ask_specification'],
      relevantIntentIds: ['ask_followup_instruction'],
    },
    {
      id: 'opp.nl-be.work.check-instruction',
      skillId: 'skill-check-understanding',
      sceneCondition: {
        op: 'and',
        predicates: [
          { op: 'eq', fact: 'nextStepRequested', value: true },
          { op: 'eq', fact: 'nextStepConfirmed', value: false },
        ],
      },
      positiveExamples: [
        'Checks the proposed next action in their own words and asks for confirmation.',
        'Says: Dus ik zet ze apart en meld de schade, klopt dat?',
      ],
      negativeExamples: [
        'Simply agrees without communicating what the instruction means.',
        'Invents a different instruction or safety rule.',
      ],
      relevantActionIds: ['confirm_arrangement'],
      relevantIntentIds: ['check_next_step'],
    },
  ],
  reviewStatus: 'draft',
};
