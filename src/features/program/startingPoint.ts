import type {
  ProgramEntryMode,
  StartingPointProfile,
  StartingPointSelfReport,
  UserPreferences,
} from '../../types';

export const DEFAULT_STARTING_POINT_ANSWERS: StartingPointSelfReport = {
  studiedBefore: 'not_sure',
  understandsEveryday: 'not_sure',
  canAnswerBasic: 'not_sure',
};

/**
 * Deterministic learner-entry policy.
 *
 * This is not a CEFR classifier. It only chooses how much reviewed support the
 * first program interaction should expose.
 */
export function deriveProgramEntryMode(
  answers: StartingPointSelfReport
): ProgramEntryMode {
  const completeBeginner =
    answers.studiedBefore === 'none' &&
    answers.understandsEveryday === 'no' &&
    answers.canAnswerBasic === 'no';

  if (completeBeginner) return 'observe_first';

  if (
    answers.canAnswerBasic === 'yes' ||
    answers.studiedBefore === 'not_sure' ||
    answers.understandsEveryday === 'not_sure' ||
    answers.canAnswerBasic === 'not_sure'
  ) {
    return 'warmup_first';
  }

  return 'guided_first';
}

/**
 * Compatibility bridge for older surfaces that still read comfortLevel.
 *
 * Learner Journey V1 treats the entry mode as authoritative for onboarding;
 * this field is only kept coherent until the old comfort-level UI is retired.
 */
export function legacyComfortLevelForEntryMode(
  entryMode: ProgramEntryMode
): UserPreferences['comfortLevel'] {
  switch (entryMode) {
    case 'observe_first':
      return 'beginner';
    case 'guided_first':
      return 'elementary';
    case 'warmup_first':
      return 'not_sure';
  }
}

export function buildStartingPointProfile(
  answers: StartingPointSelfReport,
  recordedAt = new Date().toISOString()
): StartingPointProfile {
  return {
    answers,
    entryMode: deriveProgramEntryMode(answers),
    warmupCompleted: false,
    recordedAt,
  };
}
