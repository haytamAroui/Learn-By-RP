import { EvidenceCategory, LearningObservation, RetrievalType } from '../../types';

/**
 * Evidence classification (§10.2, §10.4).
 *
 * Categories are derived from the transcript, the modality and the exposure
 * ledger. They are never collapsed into one "learned" flag, and `unknown` is a
 * real answer: silence, noise, a disconnect or an unavailable assessment are not
 * lapses.
 */
export interface ClassifyInput {
  retrieval: RetrievalType;
  modality: 'spoken' | 'typed';
  /** Support shown before the turn. */
  exposures: Array<{ source: string; kind: string; recordedAt: string }>;
  /** True when the assistant's form was played or shown recently. */
  modelingWithinWindow: boolean;
  /** True when the learner attempted and could not produce the form. */
  attemptedButFailed: boolean;
  /** True when the learner's own wording differed from the curated form. */
  wasCorrected: boolean;
}

export function classifyEvidence(input: ClassifyInput): EvidenceCategory {
  const {
    retrieval,
    exposures,
    modelingWithinWindow,
    attemptedButFailed,
    wasCorrected,
  } = input;

  // A lapse is only a lapse when there was a genuine cold opportunity to
  // retrieve and nothing was on screen. Silence, a dropped connection, a failed
  // assessment, or a form the assistant had just played are all not lapses:
  // without a real chance, failing proves nothing.
  if (
    attemptedButFailed &&
    retrieval === 'unassisted' &&
    exposures.length === 0 &&
    !modelingWithinWindow
  ) {
    return 'lapse';
  }

  // Spontaneous typing is written retrieval, not spoken production. It is still
  // a real attempt, so it is recorded as encountered rather than independent.
  if (retrieval === 'unassisted' && input.modality === 'typed') {
    return 'encountered';
  }

  if (retrieval === 'unassisted' && !modelingWithinWindow) {
    return wasCorrected ? 'corrected' : 'independent';
  }

  if (retrieval === 'assisted') {
    return 'assisted';
  }

  if (retrieval === 'unknown') {
    return 'unknown';
  }

  return 'encountered';
}

/**
 * Whether an observation may raise a phrase's recall status.
 *
 * Encountered and unknown observations are stored and shown, but they do not
 * count as evidence of retrieval. This is what keeps a typed answer, an
 * interrupted playback or a speculative match from inflating progress.
 */
export function countsAsIndependentEvidence(observation: LearningObservation): boolean {
  return (
    observation.retrieval === 'unassisted' &&
    observation.modality === 'spoken' &&
    !observation.userDisputed &&
    !observation.hidden
  );
}

/**
 * Whether an observation can contribute to a skill's status.
 *
 * §10.6: a skill needs several distinct day/context evidence keys before it is
 * shown. Assisted use is retained as context but does not demonstrate the skill
 * on its own.
 */
export function countsTowardSkill(observation: LearningObservation): boolean {
  return (
    observation.retrieval !== 'unknown' &&
    !observation.userDisputed &&
    !observation.hidden
  );
}

/** Plain-language label for the learner, never a proficiency judgement. */
export function describeCategory(
  category: EvidenceCategory,
  labels: { label: string }
): string {
  return labels.label;
}