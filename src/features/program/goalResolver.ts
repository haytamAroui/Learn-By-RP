import type { LanguageCode, UserPreferences } from '../../types';
import type { RoleplayProgram } from '../../contracts/program';
import {
  FLEMISH_EVERYDAY_PILOT,
  FLEMISH_TRAVEL_PILOT,
  ROLEPLAY_PROGRAM_CATALOG,
  SPANISH_DAILY_SERVICES_PILOT,
  SPANISH_TRAVEL_PILOT,
} from '../../data/programs';
import { isProgramActivatable } from './releaseGates';
import { workplaceContextFor } from '../../content/workplaceContexts';

export type ProgramGoalMatch = 'exact' | 'closest' | 'none';

export interface ProgramCandidateResolution {
  targetLocale: string;
  match: ProgramGoalMatch;
  program?: RoleplayProgram;
  executable: boolean;
}

const DEFAULT_LEARNING_LOCALE: Record<LanguageCode, string> = {
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  ja: 'ja-JP',
  nl: 'nl-BE',
};

export function defaultLearningLocale(language: LanguageCode): string {
  return DEFAULT_LEARNING_LOCALE[language];
}

/**
 * Resolve only to human-authored catalog programs.
 *
 * A draft program may be returned as a preview candidate, but executable
 * remains false until the existing activation gate passes. Goal onboarding is
 * therefore incapable of bypassing review/native-locale release requirements.
 */
export function resolveProgramCandidate(input: {
  learningLanguage: LanguageCode;
  learningLocale?: string;
  primaryGoal: UserPreferences['primaryGoal'];
  /** Required for work goals: never silently substitute a different occupation. */
  contextId?: string;
}): ProgramCandidateResolution {
  const targetLocale =
    input.learningLocale?.trim() || defaultLearningLocale(input.learningLanguage);

  if (input.learningLanguage === 'nl' && targetLocale === 'nl-BE') {
    if (input.primaryGoal === 'work') {
      const context = input.contextId ? workplaceContextFor(input.contextId) : undefined;
      const program = context
        ? ROLEPLAY_PROGRAM_CATALOG.find(item => item.id === context.programId)
        : undefined;
      if (context && context.locale === targetLocale &&
          program?.targetLocale === targetLocale &&
          program.goalBinding?.domain === 'work' &&
          program.goalBinding.contextId === context.id) {
        return candidate(targetLocale, 'exact', program);
      }
      return { targetLocale, match: 'none', executable: false };
    }
    if (input.primaryGoal === 'travel') {
      return candidate(targetLocale, 'exact', FLEMISH_TRAVEL_PILOT);
    }
    if (
      input.primaryGoal === 'daily_life' ||
      input.primaryGoal === 'relocation'
    ) {
      return candidate(targetLocale, 'exact', FLEMISH_EVERYDAY_PILOT);
    }
    if (input.primaryGoal === 'social' || input.primaryGoal === 'explore') {
      return candidate(targetLocale, 'closest', FLEMISH_EVERYDAY_PILOT);
    }
  }

  if (input.learningLanguage === 'es' && targetLocale === 'es-ES') {
    if (input.primaryGoal === 'travel') {
      return candidate(targetLocale, 'exact', SPANISH_TRAVEL_PILOT);
    }
    if (
      input.primaryGoal === 'daily_life' ||
      input.primaryGoal === 'relocation'
    ) {
      return candidate(targetLocale, 'exact', SPANISH_DAILY_SERVICES_PILOT);
    }
    if (input.primaryGoal === 'social' || input.primaryGoal === 'explore') {
      return candidate(targetLocale, 'closest', SPANISH_DAILY_SERVICES_PILOT);
    }
  }

  return {
    targetLocale,
    match: 'none',
    executable: false,
  };
}

function candidate(
  targetLocale: string,
  match: Exclude<ProgramGoalMatch, 'none'>,
  program: RoleplayProgram
): ProgramCandidateResolution {
  return {
    targetLocale,
    match,
    program,
    executable: isProgramActivatable(program),
  };
}