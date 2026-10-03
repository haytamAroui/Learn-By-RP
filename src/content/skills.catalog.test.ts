import { describe, expect, it } from 'vitest';
import {
  COMMUNICATIVE_SKILLS_CATALOG,
  RETIRED_COMMUNICATIVE_SKILL_IDS,
  FLEMISH_SKILL_PATTERNS,
  communicativeSkillFor,
} from './skills';

describe('communicative skill catalog contract', () => {
  it('gives every skill reviewer guidance and localized can-do text', () => {
    for (const skill of COMMUNICATIVE_SKILLS_CATALOG) {
      expect(skill.positiveExamples.length, skill.id).toBeGreaterThan(0);
      expect(skill.negativeExamples.length, skill.id).toBeGreaterThan(0);
      expect(skill.boundaryNotes.length, skill.id).toBeGreaterThan(0);
      expect(skill.typicalOpportunityPatterns.length, skill.id).toBeGreaterThan(0);
      expect(['production', 'comprehension', 'interaction']).toContain(skill.modality);

      for (const locale of ['en', 'fr', 'es', 'nl'] as const) {
        expect(skill.canDo[locale].trim().length, skill.id + ':' + locale)
          .toBeGreaterThan(0);
      }
    }
  });

  it('gives every active skill a Belgian Dutch practice pattern', () => {
    for (const skill of COMMUNICATIVE_SKILLS_CATALOG) {
      if (skill.deprecated !== null) continue;
      expect(FLEMISH_SKILL_PATTERNS[skill.id]?.trim().length, skill.id).toBeGreaterThan(0);
    }
  });

  it('never reuses a retired stable id', () => {
    const active = new Set(COMMUNICATIVE_SKILLS_CATALOG.map(skill => skill.id));
    expect(RETIRED_COMMUNICATIVE_SKILL_IDS.filter(id => active.has(id))).toEqual([]);
  });

  it('keeps parent and deprecation successor references valid and acyclic', () => {
    const ids = new Set(COMMUNICATIVE_SKILLS_CATALOG.map(skill => skill.id));

    for (const skill of COMMUNICATIVE_SKILLS_CATALOG) {
      if (skill.parentSkillId) expect(ids.has(skill.parentSkillId), skill.id).toBe(true);
      for (const successor of skill.deprecated?.successorSkillIds ?? []) {
        expect(ids.has(successor), skill.id).toBe(true);
      }

      const seen = new Set<string>();
      let current = skill;
      while (current.parentSkillId) {
        expect(seen.has(current.id), 'cycle: ' + skill.id).toBe(false);
        seen.add(current.id);
        const parent = communicativeSkillFor(current.parentSkillId);
        expect(parent, current.id + ' parent').toBeDefined();
        if (!parent) break;
        current = parent;
      }
    }
  });
});
