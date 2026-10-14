import type {
  LanguageCode,
  CommunicativeSkillId,
  ProgramGoalInput,
  ProgramGoalDomain,
} from '../types';

export type {
  ProgramGoalDomain,
  ProgramGoalInput,
  ProgramPreferences,
} from '../types';

export const ROLEPLAY_PROGRAM_CONTRACT_VERSION = 1;

export type ExecutableProgramGoalInput = Omit<
  ProgramGoalInput,
  'personalProfile' | 'recordedAt'
>;

/**
 * The execution boundary intentionally excludes learner-owned profile fields.
 *
 * Personal display names/notes and local retention timestamps may inform the
 * local UI, but they are not part of the goal sent to authoring/provider logic.
 */
export function toExecutableProgramGoalInput(
  goal: ProgramGoalInput
): ExecutableProgramGoalInput {
  const {
    personalProfile: _personalProfile,
    recordedAt: _recordedAt,
    ...executable
  } = goal;

  return executable;
}

export interface ProgramMissionRef {
  missionId: string;
  missionVersion: number;
  sceneId?: string;
  sceneVersion?: number;
}

export interface RoleplayProgram {
  id: string;
  version: number;
  targetLanguage: LanguageCode;
  /** BCP-47 locale such as es-ES, fr-FR, nl-BE. */
  targetLocale: string;
  policyVersion: number;
  title: string;
  /** Reviewed goal affinity, never a model-generated learner or proficiency label. */
  goalBinding?: { domain: ProgramGoalDomain; contextId: string };
  missionPlan: ProgramMissionRef[];
  finalSimulation?: {
    mission: ProgramMissionRef;
    supportHiddenByDefault: true;
    preserveAccommodations: true;
    helpAvailable: true;
    evidencePolicy: 'same_as_program';
    scoring: 'none';
  };
  reviewStatus: 'draft' | 'reviewed' | 'released';
}

/**
 * Rebuildable state. Never use this as the source of user intent.
 */
export interface ProgramProjection {
  programId: string;
  programVersion: number;
  completedMissionIds: string[];
  currentMissionId?: string;
  demonstratedSkillIds: CommunicativeSkillId[];
  reviewSkillIds: CommunicativeSkillId[];
  rebuiltAt: string;
}

export interface ProgramContractValidation {
  valid: boolean;
  errors: string[];
}

const BCP47 =
  /^[A-Za-z]{2,3}(?:-[A-Za-z]{4})?(?:-(?:[A-Za-z]{2}|\d{3}))?(?:-[A-Za-z0-9]{5,8})*$/;

export function validateTargetLocale(locale: string): boolean {
  return BCP47.test(locale);
}

export function validateRoleplayProgram(
  program: RoleplayProgram
): ProgramContractValidation {
  const errors: string[] = [];

  if (!program.id.trim()) errors.push('program id is required');
  if (!Number.isInteger(program.version) || program.version < 1) {
    errors.push('program version must be a positive integer');
  }
  if (!validateTargetLocale(program.targetLocale)) {
    errors.push(`invalid BCP-47 targetLocale: ${program.targetLocale}`);
  }
  if (!Number.isInteger(program.policyVersion) || program.policyVersion < 1) {
    errors.push('policyVersion must be a positive integer');
  }
  if (program.goalBinding && !program.goalBinding.contextId.trim()) {
    errors.push('goalBinding.contextId must not be blank');
  }
  if (program.goalBinding && !['travel', 'relocation', 'work', 'social', 'services', 'exam'].includes(program.goalBinding.domain)) {
    errors.push('goalBinding.domain is not a known program goal');
  }
  if (program.missionPlan.length === 0) {
    errors.push('missionPlan must contain at least one pinned mission');
  }

  if (program.finalSimulation) {
    const final = program.finalSimulation;
    if (final.supportHiddenByDefault !== true) {
      errors.push('finalSimulation.supportHiddenByDefault must be true');
    }
    if (final.preserveAccommodations !== true) {
      errors.push('finalSimulation.preserveAccommodations must be true');
    }
    if (final.helpAvailable !== true) {
      errors.push('finalSimulation.helpAvailable must be true');
    }
    if (final.evidencePolicy !== 'same_as_program') {
      errors.push('finalSimulation must use the same evidence policy');
    }
    if (final.scoring !== 'none') {
      errors.push('finalSimulation scoring/readiness prediction is not allowed');
    }
  }

  const missionIds = new Set<string>();
  for (const [index, entry] of program.missionPlan.entries()) {
    const path = `missionPlan[${index}]`;
    if (!entry.missionId.trim()) errors.push(`${path}.missionId is required`);
    if (!Number.isInteger(entry.missionVersion) || entry.missionVersion < 1) {
      errors.push(`${path}.missionVersion must be a positive integer`);
    }
    if (entry.sceneId && (!entry.sceneVersion || entry.sceneVersion < 1)) {
      errors.push(`${path}.sceneVersion is required when sceneId is pinned`);
    }
    if (!entry.sceneId && entry.sceneVersion !== undefined) {
      errors.push(`${path}.sceneId is required when sceneVersion is pinned`);
    }
    if (missionIds.has(entry.missionId)) {
      errors.push(`${path}: duplicate missionId ${entry.missionId}`);
    }
    missionIds.add(entry.missionId);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Free text can be collected for later extraction/preview, but it is never a
 * directly executable goal input in V1.
 */
export function isExecutableGoalInput(value: unknown): value is ProgramGoalInput {
  if (!value || typeof value !== 'object') return false;
  const goal = value as Partial<ProgramGoalInput> & { freeText?: unknown };
  if (typeof goal.freeText === 'string') return false;
  return (
    typeof goal.targetLanguage === 'string' &&
    typeof goal.targetLocale === 'string' &&
    validateTargetLocale(goal.targetLocale) &&
    typeof goal.domain === 'string' &&
    typeof goal.contextId === 'string' &&
    goal.contextId.trim().length > 0
  );
}
