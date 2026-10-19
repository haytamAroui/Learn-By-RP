import { describe, expect, it } from 'vitest';
import {
  FLEMISH_EVERYDAY_PILOT,
  FLEMISH_TRAVEL_PILOT,
  FLEMISH_WORK_LOGISTICS_PILOT,
  ROLEPLAY_PROGRAM_CATALOG,
  SPANISH_DAILY_SERVICES_PILOT,
  SPANISH_TRAVEL_PILOT,
  validateProgramAgainstCatalog,
} from './programs';

describe('curated program catalog', () => {
  it('keeps every pinned mission and scene aligned with reviewed catalogs', () => {
    for (const program of ROLEPLAY_PROGRAM_CATALOG) {
      const result = validateProgramAgainstCatalog(program);
      expect(result.errors, program.id).toEqual([]);
      expect(result.valid, program.id).toBe(true);
    }
  });

  it('preserves four existing draft launch programs and adds one gated Dutch work pilot', () => {
    expect(ROLEPLAY_PROGRAM_CATALOG).toHaveLength(5);

    for (const program of [SPANISH_DAILY_SERVICES_PILOT, SPANISH_TRAVEL_PILOT]) {
      expect(program.reviewStatus).toBe('draft');
      expect(program.targetLocale).toBe('es-ES');
      expect(program.missionPlan).toHaveLength(5);
      expect(new Set(program.missionPlan.map(item => item.missionId)).size).toBe(5);
    }

    for (const program of [FLEMISH_EVERYDAY_PILOT, FLEMISH_TRAVEL_PILOT]) {
      expect(program.reviewStatus).toBe('draft');
      expect(program.targetLocale).toBe('nl-BE');
      expect(program.targetLanguage).toBe('nl');
      expect(program.missionPlan).toHaveLength(5);
      expect(new Set(program.missionPlan.map(item => item.missionId)).size).toBe(5);
    }

    expect(FLEMISH_WORK_LOGISTICS_PILOT.reviewStatus).toBe('draft');
    expect(FLEMISH_WORK_LOGISTICS_PILOT.targetLocale).toBe('nl-BE');
    expect(FLEMISH_WORK_LOGISTICS_PILOT.missionPlan).toHaveLength(1);
  });
});
