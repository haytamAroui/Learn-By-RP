import type {
  Passage,
  SkillLapse,
  SupportExposure,
} from '../../types';
import { isSkillProductionSupportRelevant } from '../learning/supportScope';

export type RpLearningMode = 'cold' | 'guided' | 'transfer' | 'recovery';

export const RP_MODE_POLICY = {
  maxConsecutiveRecoveries: 2,
} as const;

export interface AttemptLearningContext {
  mode: RpLearningMode;
  rehearsal: boolean;
  skillId: string;
  scenarioFamilyId: string;
  sourceScenarioFamilyId?: string;
  opportunityInstanceId?: string;
}

export function isColdForSkill(input: {
  passage: Passage;
  attemptId: string;
  skillId: string;
  opportunityInstanceId?: string;
  supportExposures: SupportExposure[];
}): boolean {
  return !input.supportExposures.some(exposure =>
    isSkillProductionSupportRelevant({
      exposure,
      passage: input.passage,
      attemptId: input.attemptId,
      skillId: input.skillId,
      opportunityInstanceId: input.opportunityInstanceId,
    })
  );
}

export function classifyAttemptLearningMode(input: {
  requestedMode: Exclude<RpLearningMode, 'guided'> | 'guided';
  passage?: Passage;
  attemptId: string;
  skillId: string;
  opportunityInstanceId?: string;
  supportExposures: SupportExposure[];
  rehearsal: boolean;
}): RpLearningMode {
  if (input.requestedMode === 'recovery') return 'recovery';
  if (input.requestedMode === 'transfer') return 'transfer';
  if (!input.passage) return input.requestedMode;

  return isColdForSkill({
    passage: input.passage,
    attemptId: input.attemptId,
    skillId: input.skillId,
    opportunityInstanceId: input.opportunityInstanceId,
    supportExposures: input.supportExposures,
  })
    ? 'cold'
    : 'guided';
}

/**
 * Transfer credit requires a new authored scenario family and a non-rehearsal
 * attempt. Pressure/locale/cosmetic variants sharing one family are not transfer.
 */
export function isTransferEligible(context: AttemptLearningContext): boolean {
  return (
    context.mode === 'transfer' &&
    !context.rehearsal &&
    Boolean(context.sourceScenarioFamilyId) &&
    context.sourceScenarioFamilyId !== context.scenarioFamilyId
  );
}

export function isRecoveryEligible(input: {
  lapse?: SkillLapse;
  targetSkillId: string;
  consecutiveRecoveries: number;
}): {
  eligible: boolean;
  offRampRequired: boolean;
  reason:
    | 'strict_lapse'
    | 'no_strict_lapse'
    | 'recovery_cap_reached';
} {
  if (!input.lapse || input.lapse.skillId !== input.targetSkillId) {
    return {
      eligible: false,
      offRampRequired: false,
      reason: 'no_strict_lapse',
    };
  }

  if (input.consecutiveRecoveries >= RP_MODE_POLICY.maxConsecutiveRecoveries) {
    return {
      eligible: false,
      offRampRequired: true,
      reason: 'recovery_cap_reached',
    };
  }

  return {
    eligible: true,
    offRampRequired: false,
    reason: 'strict_lapse',
  };
}
