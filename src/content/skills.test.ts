import { describe, expect, it } from 'vitest';
import {
  COMMUNICATIVE_SKILLS_CATALOG,
  PRACTICE_SKILLS_CATALOG,
  communicativeSkillById,
  isAncestorSkill,
  isDirectlyEvidencedSkill,
  selectMostSpecificSkillIds,
  validateSkillCatalog,
} from './skills';

describe('canonical skill catalog', () => {
  it('passes structural validation', () => {
    expect(validateSkillCatalog()).toEqual([]);
  });

  it('defines the six learner-facing PracticeSkill groups', () => {
    expect(PRACTICE_SKILLS_CATALOG.map(skill => skill.id)).toEqual([
      'practice-start-conversation',
      'practice-keep-it-going',
      'practice-explain-idea',
      'practice-ask-clarification',
      'practice-handle-difficult-moment',
      'practice-speak-for-purpose',
    ]);
  });

  it('keeps communicative repair as a derived family, never direct evidence', () => {
    const repair = communicativeSkillById('skill-communicative-repair');

    expect(repair?.evidenceMode).toBe('derived');
    expect(isDirectlyEvidencedSkill('skill-communicative-repair')).toBe(false);
    expect(repair?.childSkillIds).toEqual([
      'skill-request-repetition',
      'skill-request-slower-speech',
      'skill-ask-clarification',
      'skill-check-understanding',
      'skill-clarify-misunderstanding',
      'skill-paraphrase-when-stuck',
    ]);
  });

  it('records repair children as direct, reciprocal descendants', () => {
    const repair = communicativeSkillById('skill-communicative-repair')!;

    for (const childId of repair.childSkillIds ?? []) {
      expect(communicativeSkillById(childId)?.parentSkillId).toBe(repair.id);
      expect(isDirectlyEvidencedSkill(childId)).toBe(true);
      expect(isAncestorSkill(repair.id, childId)).toBe(true);
    }
  });

  it('selects the most-specific child when parent and child label the same act', () => {
    expect(
      selectMostSpecificSkillIds([
        'skill-communicative-repair',
        'skill-ask-clarification',
      ])
    ).toEqual(['skill-ask-clarification']);
  });

  it('does not collapse unrelated skills', () => {
    expect(
      selectMostSpecificSkillIds([
        'skill-ask-clarification',
        'skill-give-opinion-with-reason',
      ])
    ).toEqual([
      'skill-ask-clarification',
      'skill-give-opinion-with-reason',
    ]);
  });

  it('defines the new V1 direct skills with review metadata', () => {
    const ids = new Set(COMMUNICATIVE_SKILLS_CATALOG.map(skill => skill.id));

    for (const id of [
      'skill-give-opinion-with-reason',
      'skill-compare-options',
      'skill-make-arrangement',
      'skill-narrate-past-event',
    ]) {
      expect(ids.has(id)).toBe(true);
      const skill = communicativeSkillById(id)!;
      expect(skill.evidenceMode).toBe('direct');
      expect(skill.positiveExamples.length).toBeGreaterThan(0);
      expect(skill.negativeExamples.length).toBeGreaterThan(0);
      expect(skill.boundaryNotes.length).toBeGreaterThan(0);
      expect(skill.typicalOpportunityPatterns.length).toBeGreaterThan(0);
      expect(skill.lifecycle.status).toBe('active');
      expect(Object.keys(skill.canDo).sort()).toEqual(['en', 'es', 'fr', 'nl']);
    }
  });
});
