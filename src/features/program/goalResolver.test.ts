import { describe, expect, it } from 'vitest';
import {
  defaultLearningLocale,
  resolveProgramCandidate,
} from './goalResolver';

describe('reviewed program candidate resolution', () => {
  it('defaults Dutch to Belgian Dutch', () => {
    expect(defaultLearningLocale('nl')).toBe('nl-BE');
  });

  it('maps Dutch daily-life intent to the Flemish everyday program', () => {
    const result = resolveProgramCandidate({
      learningLanguage: 'nl',
      primaryGoal: 'relocation',
    });

    expect(result.targetLocale).toBe('nl-BE');
    expect(result.match).toBe('exact');
    expect(result.program?.id).toBe('program.nl-be.everyday.pilot');
    expect(result.executable).toBe(false);
  });

  it('maps Dutch travel intent to the Flemish travel program', () => {
    const result = resolveProgramCandidate({
      learningLanguage: 'nl',
      primaryGoal: 'travel',
    });

    expect(result.match).toBe('exact');
    expect(result.program?.id).toBe('program.nl-be.travel.pilot');
    expect(result.executable).toBe(false);
  });

  it('offers the everyday program only as a closest match for social intent', () => {
    const result = resolveProgramCandidate({
      learningLanguage: 'nl',
      primaryGoal: 'social',
    });

    expect(result.match).toBe('closest');
    expect(result.program?.id).toBe('program.nl-be.everyday.pilot');
  });

  it('does not invent a Dutch work program', () => {
    const result = resolveProgramCandidate({
      learningLanguage: 'nl',
      primaryGoal: 'work',
    });

    expect(result.match).toBe('none');
    expect(result.program).toBeUndefined();
    expect(result.executable).toBe(false);
  });
});