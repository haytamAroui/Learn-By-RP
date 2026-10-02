import { describe, expect, it } from 'vitest';
import type { SkillObservation, SupportExposure } from '../../types';
import {
  deriveSkillEvidenceReasonCodes,
  evidenceReasonCodeForValidationCheck,
  evidenceReasonCodesForDisplay,
  renderSkillEvidenceReason,
} from './evidenceReasons';

function support(kind: SupportExposure['kind']): SupportExposure {
  return {
    id: 'exp-' + kind,
    sessionId: 's-1',
    attemptId: 'attempt-1',
    source: 'coach',
    kind,
    targetItemIds: [],
    exposure: 'visible',
    recordedAt: '2026-10-02T12:00:00.000Z',
  };
}

function observation(overrides: Partial<SkillObservation> = {}): SkillObservation {
  return {
    id: 'obs-1',
    skillId: 'skill-request-substitution',
    sessionId: 's-1',
    attemptId: 'attempt-1',
    sourcePassageId: 'p-1',
    sourceRevision: 'rev-1',
    contextKey: {
      domainId: 'cafes',
      scenarioFamilyId: 'counter-ordering',
    },
    modality: 'spoken',
    retrieval: 'unassisted',
    taskOutcome: 'achieved',
    demonstration: 'demonstrated',
    supportExposureIds: [],
    evidenceSource: 'validated_explicit',
    quote: 'Could I have oat milk instead?',
    recordedAt: '2026-10-02T12:00:04.000Z',
    ...overrides,
  };
}

describe('skill evidence reason codes', () => {
  it('explains independent spoken evidence from runtime facts', () => {
    expect(deriveSkillEvidenceReasonCodes({
      retrieval: 'unassisted',
      modality: 'spoken',
      evidenceSource: 'validated_explicit',
      relevantSupport: [],
      isRehearsalAttempt: false,
    })).toEqual(['INDEPENDENT_NO_RELEVANT_SUPPORT']);
  });

  it('explains the strongest specific support surface instead of generic model prose', () => {
    expect(deriveSkillEvidenceReasonCodes({
      retrieval: 'assisted',
      modality: 'spoken',
      evidenceSource: 'validated_explicit',
      relevantSupport: [support('full_form')],
      isRehearsalAttempt: false,
    })).toEqual(['ASSISTED_FORM_SUPPORT_SHOWN']);

    expect(deriveSkillEvidenceReasonCodes({
      retrieval: 'assisted',
      modality: 'spoken',
      evidenceSource: 'validated_explicit',
      relevantSupport: [support('model_phrase_audio')],
      isRehearsalAttempt: false,
    })).toEqual(['ASSISTED_MODEL_PHRASE_SHOWN']);

    expect(deriveSkillEvidenceReasonCodes({
      retrieval: 'assisted',
      modality: 'spoken',
      evidenceSource: 'validated_explicit',
      relevantSupport: [support('briefing_exposure')],
      isRehearsalAttempt: false,
    })).toEqual(['ASSISTED_BRIEFING_EXPOSURE']);
  });

  it('distinguishes recent assistant modeling from generic form support', () => {
    const actorSupport = {
      ...support('full_form'),
      source: 'actor' as const,
    };

    expect(deriveSkillEvidenceReasonCodes({
      retrieval: 'assisted',
      modality: 'spoken',
      evidenceSource: 'validated_explicit',
      relevantSupport: [actorSupport],
      isRehearsalAttempt: false,
    })).toEqual(['ASSISTED_RECENT_ASSISTANT_MODELING']);
  });

  it('keeps typed and rehearsal qualifiers separate from the main evidence reason', () => {
    expect(deriveSkillEvidenceReasonCodes({
      retrieval: 'assisted',
      modality: 'typed',
      evidenceSource: 'validated_explicit',
      relevantSupport: [support('typed_example')],
      isRehearsalAttempt: true,
    })).toEqual([
      'ASSISTED_TYPED_EXAMPLE_SHOWN',
      'TYPED_NOT_SPOKEN_EVIDENCE',
      'REHEARSAL_NOT_COUNTED_FOR_STATUS',
    ]);
  });

  it('gives old rows a deterministic fallback and appends learner disputes only for display', () => {
    expect(evidenceReasonCodesForDisplay(observation())).toEqual([
      'INDEPENDENT_NO_RELEVANT_SUPPORT',
    ]);

    expect(evidenceReasonCodesForDisplay(observation({
      userDisputed: true,
    }))).toEqual([
      'INDEPENDENT_NO_RELEVANT_SUPPORT',
      'DISPUTED_BY_LEARNER',
    ]);
  });

  it('maps only learner-relevant validator failures to non-credit reason codes', () => {
    expect(evidenceReasonCodeForValidationCheck('rehearsal_not_independent'))
      .toBe('REHEARSAL_NOT_COUNTED_FOR_STATUS');
    expect(evidenceReasonCodeForValidationCheck('revision_mismatch'))
      .toBe('TRANSCRIPT_UNCERTAIN');
    expect(evidenceReasonCodeForValidationCheck('opportunity_not_demonstrated'))
      .toBe('TARGET_SKILL_NOT_DEMONSTRATED');
    expect(evidenceReasonCodeForValidationCheck('unknown_skill')).toBeUndefined();
  });

  it('renders localized learner-facing text from codes', () => {
    expect(renderSkillEvidenceReason('INDEPENDENT_NO_RELEVANT_SUPPORT', 'fr'))
      .toMatch(/sans aide/i);
    expect(renderSkillEvidenceReason('TYPED_NOT_SPOKEN_EVIDENCE', 'nl'))
      .toMatch(/typte/i);
  });
});
