import { describe, expect, it } from 'vitest';
import { classifyEvidence, countsAsIndependentEvidence, countsTowardSkill } from './evidence';
import { LearningObservation } from '../../types';

const now = new Date().toISOString();

function input(overrides: Partial<Parameters<typeof classifyEvidence>[0]> = {}) {
  return {
    retrieval: 'unassisted' as const,
    modality: 'spoken' as const,
    exposures: [] as Array<{ source: string; kind: string; recordedAt: string }>,
    modelingWithinWindow: false,
    attemptedButFailed: false,
    wasCorrected: false,
    ...overrides,
  };
}

describe('classifyEvidence', () => {
  it('is independent for unaided spoken use', () => {
    expect(classifyEvidence(input())).toBe('independent');
  });

  it('is assisted when support was shown', () => {
    expect(classifyEvidence(input({ retrieval: 'assisted' }))).toBe('assisted');
  });

  it('is unknown when retrieval could not be established', () => {
    expect(classifyEvidence(input({ retrieval: 'unknown' }))).toBe('unknown');
  });

  it('records typed production as encountered, not independent', () => {
    // §10.4: spontaneous typing is written retrieval. Real, but it is not
    // evidence of spoken production, so it must not read as independent.
    expect(classifyEvidence(input({ modality: 'typed' }))).toBe('encountered');
  });

  it('is corrected when the wording differed from the curated form', () => {
    expect(classifyEvidence(input({ wasCorrected: true }))).toBe('corrected');
  });

  it('is a lapse only after a genuine cold attempt failed', () => {
    expect(
      classifyEvidence(input({ attemptedButFailed: true, exposures: [] }))
    ).toBe('lapse');
  });

  it('is not a lapse when support had already been given', () => {
    expect(
      classifyEvidence(
        input({
          attemptedButFailed: true,
          exposures: [{ source: 'coach', kind: 'full_form', recordedAt: now }],
        })
      )
    ).not.toBe('lapse');
  });

  it('is not a lapse when the assistant had just modeled the form', () => {
    expect(
      classifyEvidence(input({ attemptedButFailed: true, modelingWithinWindow: true }))
    ).not.toBe('lapse');
  });

  it('never collapses the categories into one learned flag', () => {
    const results = new Set([
      classifyEvidence(input()),
      classifyEvidence(input({ retrieval: 'assisted' })),
      classifyEvidence(input({ retrieval: 'unknown' })),
      classifyEvidence(input({ modality: 'typed' })),
      classifyEvidence(input({ wasCorrected: true })),
      classifyEvidence(input({ attemptedButFailed: true })),
    ]);

    expect(results.size).toBe(6);
  });
});

describe('countsAsIndependentEvidence', () => {
  const base: LearningObservation = {
    observationId: 'obs-1',
    sessionId: 's-1',
    attemptId: 'a-1',
    sourceTurnId: 'p-1',
    sourceRevision: 'rev-1',
    itemId: 'phrase.es.1',
    candidateForm: 'x',
    meaning: 'y',
    quote: 'x',
    modality: 'spoken',
    retrieval: 'unassisted',
    taskOutcome: 'achieved',
    rehearsal: false,
    supportExposureIds: [],
    recordedAt: now,
  };

  it('counts unaided spoken use', () => {
    expect(countsAsIndependentEvidence(base)).toBe(true);
  });

  it('does not count a typed answer as spoken production', () => {
    expect(countsAsIndependentEvidence({ ...base, modality: 'typed' })).toBe(false);
  });

  it('does not count assisted use', () => {
    expect(countsAsIndependentEvidence({ ...base, retrieval: 'assisted' })).toBe(false);
  });

  it('does not count an unknown outcome', () => {
    expect(countsAsIndependentEvidence({ ...base, retrieval: 'unknown' })).toBe(false);
  });

  it('does not count hidden or disputed evidence', () => {
    expect(countsAsIndependentEvidence({ ...base, hidden: true })).toBe(false);
    expect(countsAsIndependentEvidence({ ...base, userDisputed: true })).toBe(false);
  });
});

describe('countsTowardSkill', () => {
  const base: LearningObservation = {
    observationId: 'obs-1',
    sessionId: 's-1',
    attemptId: 'a-1',
    sourceTurnId: 'p-1',
    sourceRevision: 'rev-1',
    itemId: 'phrase.es.1',
    candidateForm: 'x',
    meaning: 'y',
    quote: 'x',
    modality: 'spoken',
    retrieval: 'assisted',
    taskOutcome: 'achieved',
    rehearsal: false,
    supportExposureIds: [],
    recordedAt: now,
  };

  it('counts assisted use as context for a skill', () => {
    // Assisted use happened; it just does not demonstrate the skill alone.
    expect(countsTowardSkill(base)).toBe(true);
  });

  it('does not count an unknown outcome', () => {
    expect(countsTowardSkill({ ...base, retrieval: 'unknown' })).toBe(false);
  });

  it('does not count disputed or hidden evidence', () => {
    expect(countsTowardSkill({ ...base, userDisputed: true })).toBe(false);
    expect(countsTowardSkill({ ...base, hidden: true })).toBe(false);
  });
});