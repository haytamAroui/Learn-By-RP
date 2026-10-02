import type { ProgramGoalInput, UserPreferences } from '../../types';

export const PROGRAM_GOAL_RETENTION_DAYS = 90;
const DAY_MS = 86_400_000;

export function pruneProgramGoalInputs(
  goals: ProgramGoalInput[],
  now = Date.now()
): ProgramGoalInput[] {
  return goals.filter(goal => {
    if (!goal.recordedAt) return false;
    const recorded = Date.parse(goal.recordedAt);
    if (!Number.isFinite(recorded)) return false;
    return now - recorded <= PROGRAM_GOAL_RETENTION_DAYS * DAY_MS;
  });
}

export function applyProgramDataRetention(
  preferences: UserPreferences,
  now = Date.now()
): UserPreferences {
  return {
    ...preferences,
    programGoals: pruneProgramGoalInputs(preferences.programGoals ?? [], now),
    continuityProfile: {
      alias: preferences.continuityProfile?.alias,
      facts: (preferences.continuityProfile?.facts ?? []).filter(fact => {
        if (!fact.expiresAt) return true;
        const expiry = Date.parse(fact.expiresAt);
        return Number.isFinite(expiry) && expiry > now;
      }),
    },
  };
}
