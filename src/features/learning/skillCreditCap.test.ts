import { describe, expect, it } from 'vitest';
import { MISSION_CATALOG } from '../../data/missions';
import { LEARNING_POLICY_VERSION, SKILL_POLICY } from './policy';
import {
  SkillEvidenceCandidate,
  validateSkillEvidenceProposal,
} from './skillEvidence';
import type { Passage } from '../../types';

const mission = MISSION_CATALOG.find(item => item.id === 'mission-es-cafe-sol')!;

function passage(
  id: string,
  revisionKey: string,
  text: string
): Passage {
  return {
    id,
    sessionId: 's-cap',
    attemptId: 'attempt-cap',
    speaker: 'user',
    revisionKey,
    assemblyVersion: 1,
    status: 'final',
    text,
    modality: 'spoken',
    startedAt: '2026-10-02T12:00:00.000Z',
    endedAt: '2026-10-02T12:00:04.000Z',
    fragments: [],
  };
}

function candidate(input: {
  skillId: string;
  passage: Passage;
  quote: string;
}): SkillEvidenceCandidate {
  return {
    skillId: input.skillId,
    sourcePassageId: input.passage.id,
    sourceRevision: input.passage.revisionKey,
    quote: input.quote,
    modality: 'spoken',
    retrievalProposal: 'unassisted',
    supportExposureIds: [],
  };
}

function validate(
  passages: Passage[],
  skillItems: SkillEvidenceCandidate[]
) {
  return validateSkillEvidenceProposal(
    {
      schemaVersion: 1,
      sessionId: 's-cap',
      attemptId: 'attempt-cap',
      taskOutcome: 'achieved',
      skillItems,
    },
    {
      sessionId: 's-cap',
      attemptId: 'attempt-cap',
      mission,
      passages,
      supportExposures: [],
      opportunityInstances: [],
      evidenceSource: 'legacy_inferred',
      sessionEndReason: 'completed',
    }
  );
}

describe('per-passage skill credit cap', () => {
  it('is a versioned tunable policy with a conservative V1 value of two', () => {
    expect(LEARNING_POLICY_VERSION).toBe(5);
    expect(SKILL_POLICY.maxSkillsCreditedPerPassage).toBe(2);
  });

  it('keeps the two mission-primary skills and rejects a third secondary skill', () => {
    const p = passage(
      'p-cap-1',
      'rev-cap-1',
      'Avena detalle cambio.'
    );
    const items = [
      candidate({
        skillId: 'skill-propose-alternative',
        passage: p,
        quote: 'cambio',
      }),
      candidate({
        skillId: 'skill-inquire-specifications',
        passage: p,
        quote: 'detalle',
      }),
      candidate({
        skillId: 'skill-request-substitution',
        passage: p,
        quote: 'Avena',
      }),
    ];

    const result = validate([p], items);

    expect(result.validated.map(item => item.skillId).sort()).toEqual([
      'skill-inquire-specifications',
      'skill-request-substitution',
    ]);
    expect(result.rejected).toEqual(expect.arrayContaining([
      expect.objectContaining({
        check: 'passage_skill_cap_exceeded',
        candidate: expect.objectContaining({
          skillId: 'skill-propose-alternative',
        }),
      }),
    ]));
  });

  it('selects the same skills regardless of proposal ordering', () => {
    const p = passage(
      'p-cap-2',
      'rev-cap-2',
      'Avena detalle cambio.'
    );
    const items = [
      candidate({
        skillId: 'skill-propose-alternative',
        passage: p,
        quote: 'cambio',
      }),
      candidate({
        skillId: 'skill-inquire-specifications',
        passage: p,
        quote: 'detalle',
      }),
      candidate({
        skillId: 'skill-request-substitution',
        passage: p,
        quote: 'Avena',
      }),
    ];

    const forward = validate([p], items)
      .validated.map(item => item.skillId).sort();
    const reverse = validate([p], [...items].reverse())
      .validated.map(item => item.skillId).sort();

    expect(reverse).toEqual(forward);
  });

  it('applies the limit independently to each learner passage', () => {
    const first = passage(
      'p-cap-3a',
      'rev-cap-3a',
      'Avena detalle.'
    );
    const second = passage(
      'p-cap-3b',
      'rev-cap-3b',
      'Cambio pregunta.'
    );

    const result = validate(
      [first, second],
      [
        candidate({
          skillId: 'skill-request-substitution',
          passage: first,
          quote: 'Avena',
        }),
        candidate({
          skillId: 'skill-inquire-specifications',
          passage: first,
          quote: 'detalle',
        }),
        candidate({
          skillId: 'skill-propose-alternative',
          passage: second,
          quote: 'Cambio',
        }),
        candidate({
          skillId: 'skill-inquire-specifications',
          passage: second,
          quote: 'pregunta',
        }),
      ]
    );

    expect(result.validated).toHaveLength(4);
    expect(result.rejected.filter(item =>
      item.check === 'passage_skill_cap_exceeded'
    )).toEqual([]);
  });

  it('does not let an otherwise-invalid candidate consume a passage slot', () => {
    const p = passage(
      'p-cap-4',
      'rev-cap-4',
      'Avena cambio.'
    );

    const result = validate(
      [p],
      [
        candidate({
          skillId: 'skill-inquire-specifications',
          passage: p,
          quote: 'not in transcript',
        }),
        candidate({
          skillId: 'skill-request-substitution',
          passage: p,
          quote: 'Avena',
        }),
        candidate({
          skillId: 'skill-propose-alternative',
          passage: p,
          quote: 'cambio',
        }),
      ]
    );

    expect(result.validated.map(item => item.skillId).sort()).toEqual([
      'skill-propose-alternative',
      'skill-request-substitution',
    ]);
    expect(result.rejected).toEqual(expect.arrayContaining([
      expect.objectContaining({
        check: 'quote_not_in_passage',
        candidate: expect.objectContaining({
          skillId: 'skill-inquire-specifications',
        }),
      }),
    ]));
    expect(result.rejected.some(item =>
      item.check === 'passage_skill_cap_exceeded'
    )).toBe(false);
  });
});
