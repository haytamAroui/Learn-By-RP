import { describe, expect, it } from 'vitest';
import {
  ROLEPLAY_PROGRAM_CATALOG,
  SPANISH_DAILY_SERVICES_PILOT,
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

  it('keeps the first pilot explicitly draft until launch curation is complete', () => {
    expect(SPANISH_DAILY_SERVICES_PILOT.reviewStatus).toBe('draft');
    expect(SPANISH_DAILY_SERVICES_PILOT.targetLocale).toBe('es-ES');
    expect(SPANISH_DAILY_SERVICES_PILOT.missionPlan).toHaveLength(2);
  });
});
