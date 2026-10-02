import { describe, expect, it } from 'vitest';
import { Passage, SupportExposure } from '../../types';
import { inheritSupportForRetry, mergeAttemptPassages, mergeFinalizedAttemptEvidence, passagesForAttempt } from './retrySupport';
import {
  EMPTY_VALIDATED_SKILL_EVIDENCE,
  mergeValidatedSkillEvidence,
} from './skillEvidence';

const EXPOSURE: SupportExposure = {
  id: 'exp-1',
  sessionId: 's-1',
  attemptId: 'attempt-1',
  source: 'coach',
  kind: 'full_form',
  targetSkillId: 'skill-request-substitution',
  targetPhraseId: 'phrase-1',
  targetItemIds: ['phrase-1'],
  exposure: 'visible',
  policyVersion: 3,
  recordedAt: '2026-10-02T10:00:00.000Z',
};

describe('inheritSupportForRetry', () => {
  it('copies prior support into the retry without changing the original', () => {
    const result = inheritSupportForRetry({
      exposures: [EXPOSURE],
      fromAttemptId: 'attempt-1',
      toAttemptId: 'attempt-2',
      supportLedgerHighWaterMark: 1,
      recordedAt: '2026-10-02T10:01:00.000Z',
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(EXPOSURE);
    expect(result[1]).toMatchObject({
      attemptId: 'attempt-2',
      source: 'retry',
      kind: 'full_form',
      targetSkillId: 'skill-request-substitution',
      targetPhraseId: 'phrase-1',
    });
  });

  it('inherits support shown after the scene checkpoint when it is below the retry high-water mark', () => {
    const afterCheckpoint: SupportExposure = {
      ...EXPOSURE,
      id: 'exp-after-checkpoint',
      kind: 'partial_form',
      recordedAt: '2026-10-02T10:00:30.000Z',
    };
    const afterRetryStarted: SupportExposure = {
      ...EXPOSURE,
      id: 'exp-after-retry-started',
      kind: 'intent_hint',
      recordedAt: '2026-10-02T10:01:30.000Z',
    };

    const result = inheritSupportForRetry({
      exposures: [EXPOSURE, afterCheckpoint, afterRetryStarted],
      fromAttemptId: 'attempt-1',
      toAttemptId: 'attempt-2',
      supportLedgerHighWaterMark: 2,
      recordedAt: '2026-10-02T10:01:00.000Z',
    });

    const inheritedIds = result
      .filter(item => item.attemptId === 'attempt-2')
      .map(item => item.id);

    expect(inheritedIds).toContain('retry:attempt-2:exp-1');
    expect(inheritedIds).toContain('retry:attempt-2:exp-after-checkpoint');
    expect(inheritedIds).not.toContain(
      'retry:attempt-2:exp-after-retry-started'
    );
  });

  it('rejects an impossible high-water mark instead of silently widening support', () => {
    expect(() =>
      inheritSupportForRetry({
        exposures: [EXPOSURE],
        fromAttemptId: 'attempt-1',
        toAttemptId: 'attempt-2',
        supportLedgerHighWaterMark: 2,
        recordedAt: '2026-10-02T10:01:00.000Z',
      })
    ).toThrow(/supportLedgerHighWaterMark/);
  });

  it('does not duplicate inherited support on replay', () => {
    const first = inheritSupportForRetry({
      exposures: [EXPOSURE],
      fromAttemptId: 'attempt-1',
      toAttemptId: 'attempt-2',
      supportLedgerHighWaterMark: 1,
      recordedAt: '2026-10-02T10:01:00.000Z',
    });
    const second = inheritSupportForRetry({
      exposures: first,
      fromAttemptId: 'attempt-1',
      toAttemptId: 'attempt-2',
      supportLedgerHighWaterMark: 1,
      recordedAt: '2026-10-02T10:02:00.000Z',
    });

    expect(second.filter(item => item.attemptId === 'attempt-2')).toHaveLength(1);
  });
});


describe('mergeAttemptPassages', () => {
  const passage = (id: string, attemptId: string, startedAt: string): Passage => ({
    id,
    sessionId: 's-1',
    attemptId,
    speaker: 'user',
    revisionKey: 'rev-1',
    assemblyVersion: 1,
    status: 'final',
    text: id,
    modality: 'spoken',
    startedAt,
    fragments: [],
  });

  it('preserves old attempts while deduplicating replayed passages', () => {
    const p1 = passage('p-1', 'attempt-1', '2026-10-02T10:00:00.000Z');
    const p2 = passage('p-2', 'attempt-2', '2026-10-02T10:01:00.000Z');

    const merged = mergeAttemptPassages([p1], [p1, p2]);
    expect(merged.map(item => item.id)).toEqual(['p-1', 'p-2']);
    expect(new Set(merged.map(item => item.attemptId))).toEqual(
      new Set(['attempt-1', 'attempt-2'])
    );
  });
});


describe('passagesForAttempt', () => {
  it('keeps earlier retry context out of the active-attempt assessor', () => {
    const passage = (id: string, attemptId: string): Passage => ({
      id,
      sessionId: 's-1',
      attemptId,
      speaker: 'user',
      revisionKey: 'rev-1',
      assemblyVersion: 1,
      status: 'final',
      text: id,
      modality: 'spoken',
      startedAt: '2026-10-02T10:00:00.000Z',
      fragments: [],
    });

    const selected = passagesForAttempt(
      [
        passage('p-parent', 'attempt-1'),
        passage('p-retry', 'attempt-2'),
        passage('p-retry-2', 'attempt-2'),
      ],
      'attempt-2'
    );

    expect(selected.map(item => item.id)).toEqual(['p-retry', 'p-retry-2']);
  });
});


describe('mergeFinalizedAttemptEvidence', () => {
  it('preserves parent-attempt evidence and deduplicates grounded identities', () => {
    const parentObservation = {
      observationId: 'obs-parent',
      sessionId: 's-1',
      attemptId: 'attempt-1',
      sourceTurnId: 'p-parent',
      sourceRevision: 'rev-1',
      itemId: 'phrase-a',
      candidateForm: 'A',
      meaning: 'A',
      quote: 'A',
      modality: 'spoken',
      retrieval: 'unassisted',
      taskOutcome: 'achieved',
      rehearsal: false,
      supportExposureIds: [],
      recordedAt: '2026-10-02T10:00:00.000Z',
    } as any;
    const parentSkill = {
      id: 'skill-parent',
      attemptId: 'attempt-1',
    } as any;
    const currentObservation = {
      ...parentObservation,
      observationId: 'obs-current',
      attemptId: 'attempt-2',
      sourceTurnId: 'p-current',
    };
    const currentSkill = {
      id: 'skill-current',
      attemptId: 'attempt-2',
    } as any;

    const merged = mergeFinalizedAttemptEvidence({
      finalizedAttempts: [
        {
          attemptId: 'attempt-1',
          observations: [parentObservation],
          skillObservations: [parentSkill],
          skillLapses: [],
          validatedSkillEvidence: mergeValidatedSkillEvidence([
            EMPTY_VALIDATED_SKILL_EVIDENCE,
          ]),
        },
      ],
      current: {
        observations: [currentObservation, parentObservation],
        skillObservations: [currentSkill, parentSkill],
        skillLapses: [],
        validatedSkillEvidence: mergeValidatedSkillEvidence([
          EMPTY_VALIDATED_SKILL_EVIDENCE,
        ]),
      },
    });

    expect(merged.observations.map(item => item.sourceTurnId).sort()).toEqual([
      'p-current',
      'p-parent',
    ]);
    expect(merged.skillObservations.map(item => item.id).sort()).toEqual([
      'skill-current',
      'skill-parent',
    ]);
    expect(merged.validatedSkillEvidence.observations).toEqual([]);
    expect(merged.validatedSkillEvidence.lapses).toEqual([]);
  });
});
