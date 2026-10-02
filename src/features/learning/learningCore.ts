import {
  LearningObservation,
  ValidatedLearningObservation,
  Passage,
  PhraseItem,
  RecallStatus,
  RetrievalType,
  SupportExposure,
  TaskOutcome
} from '../../types';
import { LEARNING_POLICY } from './policy';
import { matchPhraseInText, normalizeText } from './matching';
import { classifyEvidence, countsAsIndependentEvidence } from './evidence';
import { isPhraseProductionSupportRelevant } from './supportScope';

export interface AssessmentCandidate {
  itemId?: string;
  candidateForm: string;
  meaning: string;
  quote: string;
  sourcePassageId: string;
  sourceRevision: string;
  modality: 'spoken' | 'typed';
  retrievalProposal: RetrievalType;
  modelConfidence?: number;
}

export interface StructuredAssessmentProposal {
  schemaVersion: number;
  sessionId: string;
  attemptId: string;
  taskOutcome: TaskOutcome;
  outcomeReasoning?: string;
  items: AssessmentCandidate[];
  actionableFeedback?: string[];
  suggestedNextGoal?: string;
}

/**
 * Deterministically validate model-proposed assessments against the recorded transcript passages
 * and the support exposure ledger. The model proposes; the product validates.
 */
export function validateAssessmentProposal(
  proposal: StructuredAssessmentProposal,
  passages: Passage[],
  supportExposures: SupportExposure[],
  isRehearsalAttempt: boolean = false
): {
  validatedObservations: ValidatedLearningObservation[];
  taskOutcome: TaskOutcome;
  rejectedProposals: { candidate: AssessmentCandidate; reason: string }[];
} {
  const validatedObservations: ValidatedLearningObservation[] = [];
  const rejectedProposals: { candidate: AssessmentCandidate; reason: string }[] = [];

  const userPassages = passages.filter(p => p.speaker === 'user');
  const allUserText = normalizeText(userPassages.map(p => p.text).join(' '));

  for (const candidate of proposal.items) {
    // 1. Provenance: the quote must be the learner's own speech, in a passage
    //    the model is allowed to cite, at the revision it actually cited.
    const matchingPassage = userPassages.find(
      p => p.id === candidate.sourcePassageId && p.revisionKey === candidate.sourceRevision
    );

    // A proposal that names a passage must resolve to that passage at the
    // revision it claims. Falling back to the whole transcript when the cited
    // revision is missing would let a stale or invented citation smuggle a
    // quote in from elsewhere, so a named-but-unresolvable passage is rejected.
    if (candidate.sourcePassageId && !matchingPassage) {
      rejectedProposals.push({
        candidate,
        reason: `Cited passage ${candidate.sourcePassageId}@${candidate.sourceRevision} is not a current learner passage (stale revision or unknown id)`
      });
      continue;
    }

    if (!candidate.itemId) {
      rejectedProposals.push({
        candidate,
        reason: 'No curated item id; unmapped proposals are not stored as learner evidence'
      });
      continue;
    }

    const quoteClean = normalizeText(candidate.quote || '');
    if (!quoteClean) {
      rejectedProposals.push({ candidate, reason: 'Empty transcript quote in proposal' });
      continue;
    }

    // A proposal that cites a specific passage is verified against that passage.
    // One that cites nothing is verified against the whole learner transcript,
    // so a quote cannot be smuggled in from the assistant's side of the
    // conversation.
    const passageText = matchingPassage ? normalizeText(matchingPassage.text) : allUserText;
    const sourceScope = matchingPassage ? 'cited passage' : 'learner transcript';

    if (!passageText.includes(quoteClean)) {
      const quoteWords = quoteClean.split(' ').filter(w => w.length > 3);
      const presentWords = quoteWords.filter(w => passageText.includes(w));
      const coverage = quoteWords.length === 0 ? 0 : presentWords.length / quoteWords.length;

      if (coverage < LEARNING_POLICY.minQuoteCoverage) {
        rejectedProposals.push({
          candidate,
          reason: `Quote "${candidate.quote}" not verified in learner ${sourceScope}`
        });
        continue;
      }
    }

    // 2. Semantic check: does the learner's own wording actually convey the
    //    curated form? A model may call any turn a match; this decides.
    const scopeText = matchingPassage ? matchingPassage.text : allUserText;
    const match = matchPhraseInText(candidate.candidateForm, scopeText);

    if (match.verdict === 'none') {
      rejectedProposals.push({
        candidate,
        reason: `Learner wording does not convey "${candidate.candidateForm}"`
      });
      continue;
    }

    // 3. Exposure ledger reclassification. The model may propose; the ledger
    //    decides. Support downgrades independent use, it never upgrades it.
    const relevantExposures = supportExposures.filter(exp =>
      isPhraseProductionSupportRelevant({
        exposure: exp,
        phraseId: candidate.itemId!,
        passage: matchingPassage,
        attemptId: proposal.attemptId,
      })
    );

    // 4. Retrieval is derived, never taken from the proposal. The model is not
    //    allowed to claim the learner recalled something unaided.
    let finalRetrieval: RetrievalType;

    // Target and timing relevance was already decided against the learner
    // passage by supportScope. Assessment time must not change the verdict.
    const hadFormExposure = relevantExposures.length > 0;
    const modeledRecently = relevantExposures.some(
      exp => exp.kind === 'model_phrase_audio'
    );

    if (hadFormExposure || modeledRecently || isRehearsalAttempt) {
      finalRetrieval = 'assisted';
    } else if (candidate.modality === 'spoken') {
      // Provenance and equivalence both held against real speech.
      finalRetrieval = 'unassisted';
    } else {
      // Spontaneous typing is written retrieval. It is valid evidence of recall
      // but is not evidence of spoken production, and a model that claimed
      // spoken here was wrong. Recorded as unknown rather than downgraded to
      // assisted, because the learner did produce the form unaided.
      finalRetrieval = 'unknown';
    }

    const finalModality: 'spoken' | 'typed' = candidate.modality === 'typed' ? 'typed' : 'spoken';

    const observation = {
      observationId: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sessionId: proposal.sessionId,
      attemptId: proposal.attemptId,
      sourceTurnId: candidate.sourcePassageId || 'turn-1',
      sourceRevision: candidate.sourceRevision || 'rev-1',
      itemId: candidate.itemId,
      candidateForm: candidate.candidateForm,
      meaning: candidate.meaning,
      quote: match.matchedText || candidate.quote,
      modality: finalModality,
      retrieval: finalRetrieval,
      taskOutcome: proposal.taskOutcome || 'unknown',
      rehearsal: isRehearsalAttempt,
      supportExposureIds: relevantExposures.map(e => e.id),
      recordedAt: new Date().toISOString(),
      category: classifyEvidence({
        retrieval: finalRetrieval,
        modality: finalModality,
        exposures: relevantExposures,
        modelingWithinWindow: modeledRecently,
        attemptedButFailed: false,
        wasCorrected:
          normalizeText(matchingPassage?.text ?? '') !== normalizeText(candidate.candidateForm) &&
          match.verdict === 'paraphrase',
      }),
      // Retained together when the learner's wording differed from the curated
      // form, so both are available without losing the original.
      originalForm: match.verdict === 'paraphrase' ? match.matchedText || undefined : undefined,
    } as unknown as ValidatedLearningObservation;

    validatedObservations.push(observation);
  }

  return {
    validatedObservations,
    taskOutcome: proposal.taskOutcome || 'unknown',
    rejectedProposals
  };
}

/**
 * Deterministic assessment used when the hosted assessor is unavailable, and as
 * the only thing that can write evidence when it is.
 *
 * Applies the same provenance, equivalence and exposure rules as the validator,
 * so a failed network call never produces a more generous record than a
 * successful one.
 */
export function buildLocalObservations(input: {
  sessionId: string;
  attemptId: string;
  passages: Passage[];
  supportExposures: SupportExposure[];
  candidates: Array<{ id: string; form: string; meaning: string }>;
  isColdAttempt: boolean;
  isRehearsalAttempt: boolean;
}): { observations: ValidatedLearningObservation[]; ambiguous: number } {
  const { sessionId, attemptId, passages, supportExposures, candidates, isColdAttempt, isRehearsalAttempt } =
    input;

  const userPassages = passages.filter(p => p.speaker === 'user');
  const observations: ValidatedLearningObservation[] = [];
  const seen = new Set<string>();
  let ambiguous = 0;

  for (const phrase of candidates) {
    for (const passage of userPassages) {
      if (seen.has(`${passage.id}:${phrase.id}`)) continue;

      const match = matchPhraseInText(phrase.form, passage.text);

      if (match.verdict === 'ambiguous') {
        ambiguous += 1;
        continue;
      }
      if (match.verdict === 'none') continue;

      seen.add(`${passage.id}:${phrase.id}`);

      const relevantExposures = supportExposures.filter(exp =>
        isPhraseProductionSupportRelevant({
          exposure: exp,
          phraseId: phrase.id,
          passage,
          attemptId,
        })
      );

      const isSpoken = passage.modality === 'spoken';

      // Target and timing relevance was already decided against this passage.
      const hadFormExposure = relevantExposures.length > 0;
      const modeledRecently = relevantExposures.some(
        exp => exp.kind === 'model_phrase_audio'
      );

      let retrieval: RetrievalType;
      if (hadFormExposure || modeledRecently || !isColdAttempt || isRehearsalAttempt) {
        retrieval = 'assisted';
      } else if (isSpoken) {
        retrieval = 'unassisted';
      } else {
        // Spontaneous typing is written retrieval: real recall, but not
        // evidence of spoken production, so it is recorded as unknown rather
        // than downgraded to assisted.
        retrieval = 'unknown';
      }

      observations.push({
        observationId: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sessionId,
        attemptId,
        sourceTurnId: passage.id,
        sourceRevision: passage.revisionKey || 'rev-1',
        itemId: phrase.id,
        candidateForm: phrase.form,
        meaning: phrase.meaning,
        quote: match.matchedText || passage.text,
        modality: passage.modality,
        retrieval,
        taskOutcome: 'achieved',
        rehearsal: isRehearsalAttempt,
        supportExposureIds: relevantExposures.map(e => e.id),
        recordedAt: new Date().toISOString(),
        category: classifyEvidence({
          retrieval,
          modality: passage.modality,
          exposures: relevantExposures,
          modelingWithinWindow: modeledRecently,
          attemptedButFailed: false,
          wasCorrected: match.verdict === 'paraphrase',
        }),
        originalForm: match.verdict === 'paraphrase' ? match.matchedText || undefined : undefined,
      } as ValidatedLearningObservation);
    }
  }

  return { observations, ambiguous };
}

export function validateDrillReview(input: {
  phrase: PhraseItem;
  quote: string;
  modality: 'spoken' | 'typed';
  unassisted: boolean;
  now?: string;
}): ValidatedLearningObservation | null {
  const quote = input.quote.trim();
  if (!quote) return null;

  const match = matchPhraseInText(input.phrase.form, quote);
  if (match.verdict === 'none' || match.verdict === 'ambiguous') return null;

  const now = input.now ?? new Date().toISOString();
  const retrieval: RetrievalType =
    input.unassisted && input.modality === 'spoken'
      ? 'unassisted'
      : input.unassisted
        ? 'unknown'
        : 'assisted';

  return {
    observationId: `drill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sessionId: 'drill',
    attemptId: 'drill',
    sourceTurnId: `drill-${Date.now()}`,
    sourceRevision: 'rev-drill',
    itemId: input.phrase.id,
    candidateForm: input.phrase.form,
    meaning: input.phrase.meaning,
    quote: match.matchedText || quote,
    modality: input.modality,
    retrieval,
    taskOutcome: 'achieved',
    rehearsal: false,
    supportExposureIds: [],
    recordedAt: now,
    category: classifyEvidence({
      retrieval,
      modality: input.modality,
      exposures: [],
      modelingWithinWindow: false,
      attemptedButFailed: false,
      wasCorrected: match.verdict === 'paraphrase',
    }),
    originalForm: match.verdict === 'paraphrase' ? match.matchedText || undefined : undefined,
    correctedForm: match.verdict === 'paraphrase' ? input.phrase.form : undefined,
  } as unknown as ValidatedLearningObservation;
}

/**
 * Pure projection: Recomputes a phrase's recall status and scheduling interval
 * from its historical ledger of validated observations.
 */
export function projectPhraseState(
  currentPhrase: PhraseItem,
  allObservationsForPhrase: LearningObservation[]
): PhraseItem {
  const activeObs = allObservationsForPhrase.filter(o => !o.hidden && !o.userDisputed);

  if (activeObs.length === 0) {
    return {
      ...currentPhrase,
      recallStatus: 'new',
      scheduling: {
        ...currentPhrase.scheduling,
        due: true
      },
      stats: {
        assistedCount: 0,
        unassistedCount: 0,
        spokenCount: 0,
        typedCount: 0
      }
    };
  }

  const assistedCount = activeObs.filter(o => o.retrieval === 'assisted').length;
  const unassistedCount = activeObs.filter(o => o.retrieval === 'unassisted').length;
  const spokenCount = activeObs.filter(o => o.modality === 'spoken').length;
  const typedCount = activeObs.filter(o => o.modality === 'typed').length;

  // Independent evidence, narrowed to what actually counts as spoken
  // production. A typed answer is written retrieval: real recall, but not
  // spoken production, so it cannot raise a phrase to steady on its own.
  const independentObs = activeObs.filter(countsAsIndependentEvidence);

  const unassistedSessions = new Set(independentObs.map(o => o.sessionId));

  // Steady requires recall across distinct sessions *and* a real time span, so
  // two attempts in one sitting cannot present as durable recall.
  const independentTimes = independentObs
    .map(o => new Date(o.recordedAt).getTime())
    .filter(t => Number.isFinite(t))
    .sort((a, b) => a - b);

  const spanDays =
    independentTimes.length >= 2
      ? (independentTimes[independentTimes.length - 1] - independentTimes[0]) / 86_400_000
      : 0;

  const meetsSteady =
    unassistedSessions.size >= LEARNING_POLICY.steadyMinSessions &&
    spanDays >= LEARNING_POLICY.steadyMinSpanDays;

  let newRecallStatus: RecallStatus = 'new';
  if (meetsSteady) {
    newRecallStatus = 'steady';
  } else if (unassistedCount >= 1) {
    newRecallStatus = 'growing';
  } else if (assistedCount >= 1) {
    newRecallStatus = 'supported';
  }

  const intervalDays = LEARNING_POLICY.intervals[newRecallStatus];

  const latestObs = activeObs.reduce((latest, obs) => {
    return new Date(obs.recordedAt) > new Date(latest.recordedAt) ? obs : latest;
  }, activeObs[0]);

  const lastPracticedAt = latestObs.recordedAt;
  const nextReviewTime = new Date(new Date(lastPracticedAt).getTime() + intervalDays * 86400000);
  const isDue = nextReviewTime.getTime() <= Date.now();

  return {
    ...currentPhrase,
    recallStatus: newRecallStatus,
    scheduling: {
      nextReviewAt: nextReviewTime.toISOString(),
      due: isDue,
      intervalDays,
      modalityHistory: activeObs.map(o => o.modality),
      contexts: currentPhrase.scheduling.contexts
    },
    stats: {
      assistedCount,
      unassistedCount,
      spokenCount,
      typedCount,
      lastPracticedAt
    }
  };
}
