import { describe, expect, it } from 'vitest';
import {
  isExecutableGoalInput,
  toExecutableProgramGoalInput,
  RoleplayProgram,
  validateRoleplayProgram,
  validateTargetLocale,
} from './program';

const PROGRAM: RoleplayProgram = {
  id: 'program.es.daily-services.v1',
  version: 1,
  targetLanguage: 'es',
  targetLocale: 'es-ES',
  policyVersion: 3,
  title: 'Daily services',
  reviewStatus: 'released',
  missionPlan: [
    {
      missionId: 'mission-es-cafe-sol',
      missionVersion: 1,
      sceneId: 'scene.es.cafe.breakfast',
      sceneVersion: 1,
    },
  ],
};

describe('roleplay program contract', () => {
  it('accepts a fully pinned curated program', () => {
    expect(validateRoleplayProgram(PROGRAM)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('requires mission version and paired scene version pins', () => {
    const invalid = {
      ...PROGRAM,
      missionPlan: [
        {
          missionId: 'mission-es-cafe-sol',
          missionVersion: 0,
          sceneId: 'scene.es.cafe.breakfast',
        },
      ],
    } as RoleplayProgram;

    const result = validateRoleplayProgram(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toMatch(/missionVersion/i);
    expect(result.errors.join('\n')).toMatch(/sceneVersion/i);
  });

  it('enforces final simulation safety semantics', () => {
    const safe = validateRoleplayProgram({
      ...PROGRAM,
      finalSimulation: {
        mission: PROGRAM.missionPlan[0],
        supportHiddenByDefault: true,
        preserveAccommodations: true,
        helpAvailable: true,
        evidencePolicy: 'same_as_program',
        scoring: 'none',
      },
    });
    expect(safe.valid).toBe(true);

    const unsafe = validateRoleplayProgram({
      ...PROGRAM,
      finalSimulation: {
        mission: PROGRAM.missionPlan[0],
        supportHiddenByDefault: false as true,
        preserveAccommodations: true,
        helpAvailable: true,
        evidencePolicy: 'same_as_program',
        scoring: 'none',
      },
    });
    expect(unsafe.errors.join('\n')).toMatch(/supportHiddenByDefault/i);
  });

  it('validates BCP-47 locale shape', () => {
    expect(validateTargetLocale('es-ES')).toBe(true);
    expect(validateTargetLocale('nl-BE')).toBe(true);
    expect(validateTargetLocale('not_a_locale')).toBe(false);
  });

  it('accepts slot-based goal input', () => {
    expect(
      isExecutableGoalInput({
        targetLanguage: 'es',
        targetLocale: 'es-ES',
        domain: 'work',
        contextId: 'job-interview',
        deadline: '2026-11-15',
      })
    ).toBe(true);
  });

  it('keeps personal profile fields local at the execution boundary', () => {
    const localGoal = {
      targetLanguage: 'es' as const,
      targetLocale: 'es-ES',
      domain: 'work' as const,
      contextId: 'job-interview',
      deadline: '2026-11-15',
      personalProfile: {
        displayName: 'Local learner alias',
        notes: 'Private local note',
      },
      recordedAt: '2026-10-02T05:00:00.000Z',
    };

    const executable = toExecutableProgramGoalInput(localGoal);

    expect(executable).toEqual({
      targetLanguage: 'es',
      targetLocale: 'es-ES',
      domain: 'work',
      contextId: 'job-interview',
      deadline: '2026-11-15',
    });
    expect('personalProfile' in executable).toBe(false);
    expect('recordedAt' in executable).toBe(false);
    expect(localGoal.personalProfile.notes).toBe('Private local note');
  });

  it('rejects free text as directly executable input', () => {
    expect(
      isExecutableGoalInput({
        targetLanguage: 'es',
        targetLocale: 'es-ES',
        domain: 'work',
        contextId: 'job-interview',
        freeText: 'Make me ready for any interview',
      })
    ).toBe(false);
  });
});
