import type {
  CommunicativeSkillId,
  MissionDefinition,
  SkillLapse,
  SkillObservation,
  SupportExposure,
} from '../../types';
import type {
  ProgramGoalInput,
  ProgramPreferences,
  RoleplayProgram,
} from '../../contracts/program';
import { MISSION_CATALOG } from '../../data/missions';
import { isIndependentSuccess } from '../learning/skillEvidence';
import { projectSkillsV2 } from '../learning/skillProjection';
import { LEARNING_POLICY_VERSION } from '../learning/policy';

export const NEXT_RP_POLICY_VERSION = 1;

export type NextRpKind =
  | 'continue'
  | 'transfer'
  | 'recovery'
  | 'challenge'
  | 'final_simulation';

export type NextRpReasonCode =
  | 'PROGRAM_NEXT_READY'
  | 'INDEPENDENT_SUCCESS_TRANSFER'
  | 'SUPPORTED_SUCCESS_COLD_TRANSFER'
  | 'STRICT_LAPSE_RECOVERY'
  | 'REPEATED_SUCCESS_CHALLENGE'
  | 'PROGRAM_CORE_COMPLETE';

export interface MissionReadiness {
  missionId: string;
  ready: boolean;
}

export interface NextRpRecommendation {
  policyVersion: number;
  kind: NextRpKind;
  missionId?: string;
  missionVersion?: number;
  targetSkillId?: CommunicativeSkillId;
  reasonCode: NextRpReasonCode;
  requiresLearnerConfirmation: boolean;
}

export interface NextRpInput {
  program: RoleplayProgram;
  goal: ProgramGoalInput;
  programPreferences: ProgramPreferences;
  observations: SkillObservation[];
  supportHistory: SupportExposure[];
  lapses: SkillLapse[];
  recentScenarioFamilyIds: string[];
  completedMissionIds: string[];
  missionReadiness: MissionReadiness[];
  /** Ordering only; never converted into readiness or competence. */
  deadline?: string;
  now?: number;
}

function missionForRef(program: RoleplayProgram, missionId: string): MissionDefinition | undefined {
  const ref = program.missionPlan.find(item => item.missionId === missionId);
  if (!ref) return undefined;
  const mission = MISSION_CATALOG.find(item => item.id === ref.missionId);
  if (!mission || mission.version !== ref.missionVersion) return undefined;
  return mission;
}

function isMissionAvailable(input: NextRpInput, missionId: string): boolean {
  if (input.programPreferences.skippedMissionIds.includes(missionId)) return false;
  const readiness = input.missionReadiness.find(item => item.missionId === missionId);
  return readiness?.ready ?? false;
}

function orderedAvailableMissions(input: NextRpInput): MissionDefinition[] {
  const pinned = new Set(input.programPreferences.pinnedMissionIds);
  const refs = [...input.program.missionPlan].sort((a, b) => {
    const aPinned = pinned.has(a.missionId) ? 0 : 1;
    const bPinned = pinned.has(b.missionId) ? 0 : 1;
    if (aPinned !== bPinned) return aPinned - bPinned;
    return input.program.missionPlan.indexOf(a) - input.program.missionPlan.indexOf(b);
  });

  // Deadline is intentionally absent from scoring. V1 may use it later only to
  // order equally eligible curated missions.
  void input.deadline;
  void input.goal;
  void input.supportHistory;

  return refs
    .filter(ref => isMissionAvailable(input, ref.missionId))
    .map(ref => missionForRef(input.program, ref.missionId))
    .filter((mission): mission is MissionDefinition => Boolean(mission));
}

function missionPractisesSkill(
  mission: MissionDefinition,
  skillId: CommunicativeSkillId
): boolean {
  return (
    mission.primarySkillIds.includes(skillId) ||
    mission.secondarySkillIds.includes(skillId)
  );
}

function differentFamilyCandidate(input: NextRpInput, skillId: CommunicativeSkillId) {
  const recent = new Set(input.recentScenarioFamilyIds);
  return orderedAvailableMissions(input).find(
    mission =>
      !input.completedMissionIds.includes(mission.id) &&
      missionPractisesSkill(mission, skillId) &&
      !recent.has(mission.scenarioFamilyId)
  );
}

function recoveryCandidate(input: NextRpInput, skillId: CommunicativeSkillId) {
  return (
    differentFamilyCandidate(input, skillId) ??
    orderedAvailableMissions(input).find(
      mission =>
        !input.completedMissionIds.includes(mission.id) &&
        missionPractisesSkill(mission, skillId)
    )
  );
}

function recommendationForMission(
  kind: NextRpKind,
  mission: MissionDefinition,
  reasonCode: NextRpReasonCode,
  targetSkillId?: CommunicativeSkillId,
  requiresLearnerConfirmation = false
): NextRpRecommendation {
  return {
    policyVersion: NEXT_RP_POLICY_VERSION,
    kind,
    missionId: mission.id,
    missionVersion: mission.version,
    targetSkillId,
    reasonCode,
    requiresLearnerConfirmation,
  };
}

/**
 * Deterministic next-RP policy.
 *
 * Inputs are validated ledgers + curated catalog state. There is no generated
 * prose and no model choice. Strict lapses are the only failure signal.
 */
export function recommendNextRp(input: NextRpInput): NextRpRecommendation {
  if (input.program.policyVersion !== LEARNING_POLICY_VERSION) {
    throw new Error(
      `Program policy ${input.program.policyVersion} does not match learning policy ${LEARNING_POLICY_VERSION}`
    );
  }

  const projections = projectSkillsV2(
    input.observations,
    input.lapses,
    input.now ?? Date.now()
  );

  // Strong recovery signal first. A raw failed scene is never present here;
  // only persisted strict SkillLapse records can reach this branch.
  const revisit = projections
    .filter(projection => projection.revisit)
    .sort((a, b) => a.skillId.localeCompare(b.skillId))[0];

  if (revisit) {
    const mission = recoveryCandidate(input, revisit.skillId);
    if (mission) {
      return recommendationForMission(
        'recovery',
        mission,
        'STRICT_LAPSE_RECOVERY',
        revisit.skillId
      );
    }
  }

  const latest = [...input.observations]
    .filter(observation => observation.evidenceSource === 'validated_explicit')
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];

  if (latest) {
    if (isIndependentSuccess(latest)) {
      const sameSkillSuccesses = input.observations.filter(
        observation =>
          observation.skillId === latest.skillId &&
          isIndependentSuccess(observation)
      );

      const transfer = differentFamilyCandidate(input, latest.skillId);
      if (transfer) {
        return recommendationForMission(
          'transfer',
          transfer,
          'INDEPENDENT_SUCCESS_TRANSFER',
          latest.skillId
        );
      }

      if (sameSkillSuccesses.length >= 2) {
        const challenge = orderedAvailableMissions(input).find(
          mission =>
            !input.completedMissionIds.includes(mission.id) &&
            missionPractisesSkill(mission, latest.skillId)
        );
        if (challenge) {
          return recommendationForMission(
            'challenge',
            challenge,
            'REPEATED_SUCCESS_CHALLENGE',
            latest.skillId,
            true
          );
        }
      }
    } else if (latest.retrieval === 'assisted') {
      const transfer = differentFamilyCandidate(input, latest.skillId);
      if (transfer) {
        return recommendationForMission(
          'transfer',
          transfer,
          'SUPPORTED_SUCCESS_COLD_TRANSFER',
          latest.skillId
        );
      }
    }
  }

  const next = orderedAvailableMissions(input).find(
    mission => !input.completedMissionIds.includes(mission.id)
  );
  if (next) {
    return recommendationForMission(
      'continue',
      next,
      'PROGRAM_NEXT_READY'
    );
  }

  return {
    policyVersion: NEXT_RP_POLICY_VERSION,
    kind: 'final_simulation',
    reasonCode: 'PROGRAM_CORE_COMPLETE',
    requiresLearnerConfirmation: true,
  };
}

export const NEXT_RP_REASON_TEXT: Record<NextRpReasonCode, string> = {
  PROGRAM_NEXT_READY: 'Continue with the next reviewed mission in your program.',
  INDEPENDENT_SUCCESS_TRANSFER:
    'You used this skill independently; try it in a different situation.',
  SUPPORTED_SUCCESS_COLD_TRANSFER:
    'You completed this with support; try the same skill cold in another situation.',
  STRICT_LAPSE_RECOVERY:
    'A recent cold opportunity was attempted but not demonstrated; use a manageable recovery scenario.',
  REPEATED_SUCCESS_CHALLENGE:
    'Repeated independent success makes an optional harder variant available.',
  PROGRAM_CORE_COMPLETE:
    'The current reviewed program missions are complete; an integrated simulation can be offered.',
};
