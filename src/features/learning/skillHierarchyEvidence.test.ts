import { describe, expect, it } from 'vitest';
import { MISSION_CATALOG } from '../../data/missions';
import { validateSkillEvidenceProposal } from './skillEvidence';
import type { Passage } from '../../types';

describe('most-specific skill attribution', () => {
  it('credits the child and rejects its parent for the same communicative act', () => {
    const base = MISSION_CATALOG.find(m => m.id === 'mission-es-cafe-sol')!;
    const mission = {
      ...base,
      primarySkillIds: [
        'skill-communicative-repair',
        'skill-ask-clarification',
      ],
      secondarySkillIds: [],
    };
    const passage: Passage = {
      id: 'p-repair',
      sessionId: 's-repair',
      attemptId: 'a-repair',
      speaker: 'user',
      revisionKey: 'r1',
      assemblyVersion: 1,
      status: 'final',
      text: 'What do you mean by that?',
      modality: 'spoken',
      startedAt: '2026-10-02T12:00:00.000Z',
      endedAt: '2026-10-02T12:00:02.000Z',
      fragments: [],
    };
    const shared = {
      sourcePassageId: passage.id,
      sourceRevision: passage.revisionKey,
      quote: passage.text,
      modality: 'spoken' as const,
      retrievalProposal: 'unassisted' as const,
      supportExposureIds: [],
    };

    const result = validateSkillEvidenceProposal({
      schemaVersion: 1,
      sessionId: passage.sessionId,
      attemptId: passage.attemptId,
      taskOutcome: 'achieved',
      skillItems: [
        { ...shared, skillId: 'skill-communicative-repair' },
        { ...shared, skillId: 'skill-ask-clarification' },
      ],
    }, {
      sessionId: passage.sessionId,
      attemptId: passage.attemptId,
      mission,
      passages: [passage],
      supportExposures: [],
      opportunityInstances: [],
      evidenceSource: 'legacy_inferred',
      sessionEndReason: 'error',
    });

    expect(result.validated.map(item => item.skillId))
      .toEqual(['skill-ask-clarification']);
    expect(result.rejected).toEqual(expect.arrayContaining([
      expect.objectContaining({
        check: 'less_specific_skill',
        candidate: expect.objectContaining({
          skillId: 'skill-communicative-repair',
        }),
      }),
    ]));
  });
});
