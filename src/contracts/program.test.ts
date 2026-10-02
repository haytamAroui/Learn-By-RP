import { describe, expect, it } from 'vitest';
import {
  isExecutableGoalInput,
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
