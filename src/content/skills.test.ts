import { describe, expect, it } from 'vitest';
import {
  COMMUNICATIVE_SKILLS_CATALOG,
  PRACTICE_SKILLS,
  communicativeSkillFor,
  isAncestorSkill,
  isDirectlyEvidencedSkill,
  mostSpecificSkillIds,
} from './skills';

describe('canonical skill hierarchy', () => {
  it('defines unique stable ids and the six learner-facing PracticeSkills', () => {
    const ids = COMMUNICATIVE_SKILLS_CATALOG.map(skill => skill.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(PRACTICE_SKILLS).toHaveLength(6);
    expect(PRACTICE_SKILLS.map(skill => skill.id)).toEqual([
      'practice-start-conversation',
      'practice-keep-it-going',
      'practice-explain-an-idea',
      'practice-ask-for-clarification',
      'practice-handle-difficult-moment',
      'practice-speak-for-purpose',
    ]);
  });

  it('makes communicative repair a derived family with six direct children', () => {
    expect(isDirectlyEvidencedSkill('skill-communicative-repair')).toBe(false);

    const children = [
      'skill-request-repetition',
      'skill-request-slower-speech',
      'skill-ask-clarification',
      'skill-check-understanding',
      'skill-clarify-misunderstanding',
      'skill-paraphrase-when-stuck',
    ];
    for (const id of children) {
      expect(communicativeSkillFor(id)?.parentSkillId, id)
        .toBe('skill-communicative-repair');
      expect(isDirectlyEvidencedSkill(id), id).toBe(true);
      expect(isAncestorSkill('skill-communicative-repair', id), id).toBe(true);
    }
  });

  it('keeps only the most-specific skill in one hierarchy', () => {
    expect(mostSpecificSkillIds([
      'skill-communicative-repair',
      'skill-ask-clarification',
    ])).toEqual(['skill-ask-clarification']);
  });

  it('keeps neighboring child skills distinct', () => {
    expect(mostSpecificSkillIds([
      'skill-request-repetition',
      'skill-request-slower-speech',
    ])).toEqual([
      'skill-request-repetition',
      'skill-request-slower-speech',
    ]);
  });

  it('includes the added V1 direct skills', () => {
    for (const id of [
      'skill-give-opinion-with-reason',
      'skill-compare-options',
      'skill-make-arrangement',
      'skill-narrate-past-event',
    ]) {
      expect(isDirectlyEvidencedSkill(id), id).toBe(true);
    }
  });
});
