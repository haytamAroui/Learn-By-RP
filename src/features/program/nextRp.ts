import type {
  CommunicativeSkillId,
  MissionDefinition,
  SkillLapse,
  SkillObservation,
  SupportExposure,
  UiLanguage,
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
import { isRecoveryEligible } from './rpModes';

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
  | 'PROGRAM_CORE_COMPLETE'
  | 'RECOVERY_CAP_OFF_RAMP';

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
  consecutiveRecoveries?: number;
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

  // Recovery can start from one genuine strict lapse. `revisit` is a stronger
  // repeated-lapse signal used by projection/UI, not a prerequisite for recovery.
  // A raw failed scene is never present here; only persisted SkillLapse records
  // can reach this branch.
  const recoverySignal = projections
    .filter(projection => projection.reviewDue)
    .sort((a, b) => {
      if (a.revisit !== b.revisit) return a.revisit ? -1 : 1;
      return a.skillId.localeCompare(b.skillId);
    })[0];

  if (recoverySignal) {
    const latestMatchingLapse = [...input.lapses]
      .filter(lapse => lapse.skillId === recoverySignal.skillId)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];

    const recovery = isRecoveryEligible({
      lapse: latestMatchingLapse,
      targetSkillId: recoverySignal.skillId,
      consecutiveRecoveries: input.consecutiveRecoveries ?? 0,
    });

    if (recovery.eligible) {
      const mission = recoveryCandidate(input, recoverySignal.skillId);
      if (mission) {
        return recommendationForMission(
          'recovery',
          mission,
          'STRICT_LAPSE_RECOVERY',
          recoverySignal.skillId
        );
      }
    } else if (recovery.offRampRequired) {
      const offRamp = orderedAvailableMissions(input).find(
        mission => !input.completedMissionIds.includes(mission.id)
      );
      if (offRamp) {
        return recommendationForMission(
          'continue',
          offRamp,
          'RECOVERY_CAP_OFF_RAMP'
        );
      }
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

export const NEXT_RP_REASON_TEXT: Record<
  UiLanguage,
  Record<NextRpReasonCode, string>
> = {
  en: {
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
    RECOVERY_CAP_OFF_RAMP:
      'Pause recovery missions and continue through another manageable program route.',
  },
  fr: {
    PROGRAM_NEXT_READY: 'Continuez avec la prochaine mission validée de votre programme.',
    INDEPENDENT_SUCCESS_TRANSFER:
      'Vous avez utilisé cette compétence de façon autonome ; essayez-la dans une autre situation.',
    SUPPORTED_SUCCESS_COLD_TRANSFER:
      'Vous avez réussi avec de l’aide ; essayez la même compétence sans aide dans une autre situation.',
    STRICT_LAPSE_RECOVERY:
      'Une opportunité sans aide a été tentée sans démonstration ; utilisez un scénario de récupération gérable.',
    REPEATED_SUCCESS_CHALLENGE:
      'Des réussites autonomes répétées permettent de proposer une variante plus difficile.',
    PROGRAM_CORE_COMPLETE:
      'Les missions validées du programme sont terminées ; une simulation intégrée peut être proposée.',
    RECOVERY_CAP_OFF_RAMP:
      'Faites une pause dans les missions de récupération et poursuivez par une autre voie gérable du programme.',
  },
  es: {
    PROGRAM_NEXT_READY: 'Continúa con la siguiente misión revisada de tu programa.',
    INDEPENDENT_SUCCESS_TRANSFER:
      'Usaste esta habilidad de forma independiente; pruébala en otra situación.',
    SUPPORTED_SUCCESS_COLD_TRANSFER:
      'Lo completaste con apoyo; prueba la misma habilidad sin ayuda en otra situación.',
    STRICT_LAPSE_RECOVERY:
      'Se intentó una oportunidad sin ayuda sin demostrarla; usa un escenario de recuperación manejable.',
    REPEATED_SUCCESS_CHALLENGE:
      'Los éxitos independientes repetidos permiten ofrecer una variante más difícil.',
    PROGRAM_CORE_COMPLETE:
      'Las misiones revisadas del programa están completas; se puede ofrecer una simulación integrada.',
    RECOVERY_CAP_OFF_RAMP:
      'Pausa las misiones de recuperación y continúa por otra ruta manejable del programa.',
  },
  nl: {
    PROGRAM_NEXT_READY: 'Ga verder met de volgende beoordeelde missie in je programma.',
    INDEPENDENT_SUCCESS_TRANSFER:
      'Je gebruikte deze vaardigheid zelfstandig; probeer ze in een andere situatie.',
    SUPPORTED_SUCCESS_COLD_TRANSFER:
      'Je voltooide dit met hulp; probeer dezelfde vaardigheid zonder hulp in een andere situatie.',
    STRICT_LAPSE_RECOVERY:
      'Een kans zonder hulp werd geprobeerd maar niet aangetoond; gebruik een haalbaar herstelscenario.',
    REPEATED_SUCCESS_CHALLENGE:
      'Herhaald zelfstandig succes maakt een optionele moeilijkere variant beschikbaar.',
    PROGRAM_CORE_COMPLETE:
      'De beoordeelde programmamissies zijn voltooid; een geïntegreerde simulatie kan worden aangeboden.',
    RECOVERY_CAP_OFF_RAMP:
      'Pauzeer herstelmissies en ga verder via een andere haalbare route in het programma.',
  },
};

export function renderNextRpReason(
  reasonCode: NextRpReasonCode,
  language: UiLanguage
): string {
  return NEXT_RP_REASON_TEXT[language][reasonCode];
}
