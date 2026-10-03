import { describe, expect, it } from 'vitest';
import {
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

  it('keeps both Spanish launch programs draft while pinning executable reviewed scenes', () => {
    expect(ROLEPLAY_PROGRAM_CATALOG).toHaveLength(2);

    for (const program of [SPANISH_DAILY_SERVICES_PILOT, SPANISH_TRAVEL_PILOT]) {
      expect(program.reviewStatus).toBe('draft');
      expect(program.targetLocale).toBe('es-ES');
      expect(program.missionPlan).toHaveLength(5);
      expect(new Set(program.missionPlan.map(item => item.missionId)).size).toBe(5);
    }
  });
});
