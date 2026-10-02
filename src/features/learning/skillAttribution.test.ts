import { describe, expect, it } from 'vitest';
import { MISSION_CATALOG } from '../../data/missions';
import {
  SkillEvidenceCandidate,
  validateSkillEvidenceProposal,
} from './skillEvidence';
import type { MissionDefinition, Passage } from '../../types';

const baseMission = MISSION_CATALOG.find(mission => mission.id === 'mission-es-cafe-sol')!;

const mission: MissionDefinition = {
  ...baseMission,
  sceneId: undefined,
  primarySkillIds: ['skill-communicative-repair', 'skill-ask-clarification'],
  secondarySkillIds: [],
};

const passage: Passage = {
  id: 'p-repair',
  sessionId: 's-repair',
  attemptId: 'a-repair',
  speaker: 'user',
  revisionKey: 'rev-1',
  assemblyVersion: 1,
  status: 'final',
  text: 'Could you explain what that means?',
  modality: 'spoken',
  startedAt: '2026-10-02T10:00:00.000Z',
  endedAt: '2026-10-02T10:00:03.000Z',
  fragments: [],
};

function candidate(skillId: string): SkillEvidenceCandidate {
  return {
    skillId,
    sourcePassageId: passage.id,
    sourceRevision: passage.revisionKey,
    quote: passage.text,
    modality: 'spoken',
    retrievalProposal: 'unassisted',
    supportExposureIds: [],
  };
}

describe('most-specific communicative skill attribution', () => {
  it('credits the specific repair child and rejects the broad parent for the same act', () => {
    const result = validateSkillEvidenceProposal(
      {
        schemaVersion: 1,
        sessionId: passage.sessionId,
        attemptId: passage.attemptId,
        taskOutcome: 'achieved',
        skillItems: [
          candidate('skill-communicative-repair'),
          candidate('skill-ask-clarification'),
        ],
      },
      {
        sessionId: passage.sessionId,
        attemptId: passage.attemptId,
        mission,
        passages: [passage],
        supportExposures: [],
        evidenceSource: 'legacy_inferred',
        sessionEndReason: 'completed',
      }
    );

    expect(result.validated.map(observation => observation.skillId)).toEqual([
      'skill-ask-clarification',
    ]);
    expect(result.rejected).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          candidate: expect.objectContaining({ skillId: 'skill-communicative-repair' }),
          check: 'not_most_specific',
        }),
      ])
    );
  });

  it('never persists direct evidence on a derived family even when proposed alone', () => {
    const result = validateSkillEvidenceProposal(
      {
        schemaVersion: 1,
        sessionId: passage.sessionId,
        attemptId: passage.attemptId,
        taskOutcome: 'achieved',
        skillItems: [candidate('skill-communicative-repair')],
      },
      {
        sessionId: passage.sessionId,
        attemptId: passage.attemptId,
        mission,
        passages: [passage],
        supportExposures: [],
        evidenceSource: 'legacy_inferred',
        sessionEndReason: 'completed',
      }
    );

    expect(result.validated).toHaveLength(0);
    expect(result.rejected[0].check).toBe('skill_not_directly_evidenced');
  });
});
