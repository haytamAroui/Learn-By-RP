import { describe, expect, it } from 'vitest';
import { deriveLapses, isRelevantToPassage } from './skillEvidence';
import { OpportunityInstance, Passage, SupportExposure } from '../../types';

/**
 * Support ledger completeness and lapse eligibility.
 *
 * Both rules protect the same thing: a claim about what the learner did unaided is
 * only as good as the record of what help they had. These exist because each
 * failure mode was live at least once:
 *
 *  - revealing a caption's meaning wrote no exposure at all, so the most common
 *    support action in the product was invisible to the evidence pipeline;
 *  - a session that ended early could be recorded as a failed attempt, producing
 *    a lapse for a learner who was merely thinking or who lost signal.
 */

const passage: Passage = {
  id: 'p-1',
  sessionId: 's-1',
  attemptId: 'attempt-1',
  speaker: 'user',
  revisionKey: 'rev-1',
  assemblyVersion: 3,
  status: 'final',
  text: 'Bonjour, je voudrais un cafe por favor',
  modality: 'spoken',
  startedAt: '2026-09-20T09:00:00.000Z',
  endedAt: '2026-09-20T09:00:04.000Z',
  fragments: [],
};

function exposure(overrides: Partial<SupportExposure> = {}): SupportExposure {
  return {
    id: 'exp-1',
    sessionId: 's-1',
    attemptId: 'attempt-1',
    source: 'caption',
    kind: 'meaning',
    targetItemIds: [],
    exposure: 'visible',
    recordedAt: '2026-09-20T09:00:02.000Z',
    ...overrides,
  };
}

function failedOpportunity(
  overrides: Partial<OpportunityInstance> = {}
): OpportunityInstance {
  return {
    id: 'opp-1',
    attemptId: 'attempt-1',
    opportunityId: 'opportunity-request-substitution',
    skillId: 'skill-request-substitution',
    status: 'taken',
    detection: 'validated',
    demonstration: 'attempted_not_demonstrated',
    learnerAttemptPassageId: 'p-1',
    learnerAttemptRevision: 'rev-1',
    recordedAt: '2026-09-20T09:00:04.000Z',
    ...overrides,
  };
}

const failingProposal = {
  schemaVersion: 1,
  sessionId: 's-1',
  attemptId: 'attempt-1',
  taskOutcome: 'not_achieved' as const,
  skillItems: [],
};

const baseContext = {
  sessionId: 's-1',
  attemptId: 'attempt-1',
  mission: {
    id: 'mission-es-cafe-sol',
    category: 'cafes',
    scenarioFamilyId: 'counter-ordering',
    primarySkillIds: ['skill-request-substitution'],
    secondarySkillIds: [],
  } as never,
  passages: [passage],
  supportExposures: [] as SupportExposure[],
  opportunityInstances: [failedOpportunity()],
};

describe('meaning reveal is support', () => {
  // The behaviour the UI now writes.
  const meaningExposure = () =>
    exposure({ id: 'exp-meaning-p-0', source: 'caption', kind: 'meaning' });

  it('is relevant to a passage the learner spoke after it was revealed', () => {
    expect(isRelevantToPassage(meaningExposure(), passage, 'attempt-1')).toBe(true);
  });

  it('does not retroactively assist a passage spoken before the reveal', () => {
    // Help shown afterwards did not produce this attempt. Counting it would
    // penalise a learner for asking for help after they had already spoken.
    const later = exposure({ recordedAt: '2026-09-20T09:00:06.000Z' });

    expect(isRelevantToPassage(later, passage, 'attempt-1')).toBe(false);
  });

  it('is not relevant to a different attempt', () => {
    expect(isRelevantToPassage(exposure({ attemptId: 'attempt-2' }), passage, 'attempt-1')).toBe(
      false
    );
  });

  it('is relevant at the exact moment the passage ended', () => {
    const sameInstant = exposure({ recordedAt: passage.endedAt! });
    expect(isRelevantToPassage(sameInstant, passage, 'attempt-1')).toBe(true);
  });

  it('assumes support existed when timestamps are unusable', () => {
    // Guessing "no support" would overstate independent recall, which is the more
    // damaging direction of the error.
    const broken = exposure({ recordedAt: 'not-a-date' });
    const undatedPassage = { ...passage, startedAt: 'nonsense', endedAt: undefined };

    expect(isRelevantToPassage(broken, undatedPassage, 'attempt-1')).toBe(true);
  });

  it('suppresses a lapse when meaning was revealed during the attempt', () => {
    const lapses = deriveLapses(failingProposal, {
      ...baseContext,
      supportExposures: [meaningExposure()],
    });

    expect(lapses).toEqual([]);
  });
});

describe('an early-ended session is not a failed attempt', () => {
  it('keeps a failure unscored until its authored opportunity is qualified', () => {
    const lapses = deriveLapses(failingProposal, {
      ...baseContext,
      sessionEndReason: 'completed',
    });

    expect(lapses).toEqual([]);
  });

  it.each([['user_ended'], ['time_limit'], ['error']] as const)(
    'records no lapse when the session ended as %s',
    reason => {
      const lapses = deriveLapses(failingProposal, {
        ...baseContext,
        sessionEndReason: reason,
      });

      expect(lapses).toEqual([]);
    }
  );

  it('records no lapse when the end reason is unknown', () => {
    const lapses = deriveLapses(failingProposal, { ...baseContext });
    expect(lapses).toEqual([]);
  });
});
