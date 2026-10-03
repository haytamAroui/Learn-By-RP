import type { MissionDefinition } from '../../types';

export const CHARACTER_BEHAVIOR_POLICY_VERSION = 1;

export const CHARACTER_BEHAVIOR_POLICY = {
  alwaysProhibited: [
    'discriminatory harassment directed at the learner',
    'sexualized interaction directed at the learner',
    'threats, humiliation, or simulated abuse directed at the learner',
    'claims about learner mastery, failure, diagnosis, or personal worth',
  ],
  regulatedHealthProhibited: [
    'diagnosis',
    'individualized dosage advice',
    'prescribing or selecting treatment',
    'claiming a product is medically appropriate for the learner',
  ],
} as const;

const ABUSE_PATTERNS = [
  /humiliat/i,
  /threaten/i,
  /sexuali[sz]ed/i,
  /harass/i,
  /racial slur/i,
  /simulated abuse/i,
];

const REGULATED_ADVICE_PATTERNS = [
  /knows dosage\s*:/i,
  /advises dosage clearly/i,
  /provides clear medical advice/i,
  /explains posology clearly/i,
  /\b(medicine|tablet|tablets|spray|pastilles?)\s+(recommended|suggested|selected)\b/i,
  /\b(one|two|three|four|five|six|\d+)\s+(tablet|tablets|pastille|pastilles|spray|sprays)\b.*\b(per day|times? a day|every\s+\d+\s+hours?)\b/i,
];

export function isRegulatedHealthMission(mission: MissionDefinition): boolean {
  return (
    mission.scenarioFamilyId === 'pharmacy-consultation' ||
    mission.tags.some(tag => ['health', 'pharmacy', 'medicine', 'medical'].includes(tag.toLowerCase()))
  );
}

function authoredCharacterText(mission: MissionDefinition): string[] {
  return [
    mission.character.personality,
    ...mission.character.knowledgeBoundary,
    ...mission.completionSignals,
    mission.transferReason ?? '',
  ].filter(Boolean);
}

/**
 * Build-time/release-time guard for executable character content.
 * The runtime prompt repeats these constraints, but unsafe authored content must
 * fail before release instead of relying on a model to refuse it later.
 */
export function validateCharacterBehaviorPolicy(
  mission: MissionDefinition
): string[] {
  const errors: string[] = [];
  const texts = authoredCharacterText(mission);

  for (const text of texts) {
    if (ABUSE_PATTERNS.some(pattern => pattern.test(text))) {
      errors.push(`${mission.id}: authored character content violates behavior policy`);
      break;
    }
  }

  if (isRegulatedHealthMission(mission)) {
    for (const text of texts) {
      if (REGULATED_ADVICE_PATTERNS.some(pattern => pattern.test(text))) {
        errors.push(
          `${mission.id}: regulated-domain authored content contains diagnosis/dosage/treatment advice`
        );
        break;
      }
    }
  }

  return errors;
}

export function characterBehaviorPromptRules(
  regulatedHealth: boolean
): string[] {
  const rules = [
    'Never direct discriminatory harassment, sexualized content, threats, humiliation, or simulated abuse at the learner.',
    'Never claim the learner is mastered, failed, diagnosed, deficient, or personally worthy/unworthy.',
  ];

  if (regulatedHealth) {
    rules.push(
      'Do not diagnose, prescribe, recommend individualized dosage, select treatment, or claim a product is medically appropriate for the learner. Limit the roleplay to communication practice, official label information, and referral to a qualified professional.'
    );
  }

  return rules;
}
