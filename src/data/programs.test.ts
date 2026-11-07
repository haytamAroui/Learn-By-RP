import { describe, expect, it } from 'vitest';
import {
  FLEMISH_EVERYDAY_PILOT,
  FLEMISH_TRAVEL_PILOT,
  ROLEPLAY_PROGRAM_CATALOG,
  SPANISH_DAILY_SERVICES_PILOT,
  SPANISH_TRAVEL_PILOT,
  TAALBAD_PROGRAMS,
  FLEMISH_A1_FOUNDATION_PROGRAM,
  FLEMISH_A2_WORK_EVERYDAY_PROGRAM,
  FLEMISH_B1_PROFESSIONAL_PROGRAM,
  FLEMISH_WORK_COMPREHENSIVE_PROGRAM,
  FLEMISH_TUSSENTAAL_COMPREHENSIVE_PROGRAM,
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

  it('keeps two Spanish and two Flemish launch programs draft while pinning executable scenes', () => {
    expect(ROLEPLAY_PROGRAM_CATALOG).toHaveLength(4);

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
  });

  it('validates all Taalbad programs against catalog with exact 20 A1, 20 A2, 20 B1, and 24 Werk units', () => {
    expect(TAALBAD_PROGRAMS).toHaveLength(7);

    expect(FLEMISH_A1_FOUNDATION_PROGRAM.missionPlan).toHaveLength(20);
    expect(FLEMISH_A2_WORK_EVERYDAY_PROGRAM.missionPlan).toHaveLength(20);
    expect(FLEMISH_B1_PROFESSIONAL_PROGRAM.missionPlan).toHaveLength(20);
    expect(FLEMISH_WORK_COMPREHENSIVE_PROGRAM.missionPlan).toHaveLength(24);
    expect(FLEMISH_TUSSENTAAL_COMPREHENSIVE_PROGRAM.missionPlan).toHaveLength(12);

    for (const program of TAALBAD_PROGRAMS) {
      const result = validateProgramAgainstCatalog(program);
      expect(result.errors, program.id).toEqual([]);
      expect(result.valid, program.id).toBe(true);
    }
  });
});
