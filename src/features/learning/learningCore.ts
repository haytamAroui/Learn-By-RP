import {
  LearningObservation,
  Passage,
  PhraseItem,
  RecallStatus,
  RetrievalType,
  SupportExposure,
  TaskOutcome
} from '../../types';

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
  validatedObservations: LearningObservation[];
  taskOutcome: TaskOutcome;
  rejectedProposals: { candidate: AssessmentCandidate; reason: string }[];
} {
  const validatedObservations: LearningObservation[] = [];
  const rejectedProposals: { candidate: AssessmentCandidate; reason: string }[] = [];

  const userPassages = passages.filter(p => p.speaker === 'user');
  const allUserText = userPassages.map(p => p.text.toLowerCase()).join(' ');

  for (const candidate of proposal.items) {
    // 1. Passage & revision check
    const matchingPassage = userPassages.find(
      p => p.id === candidate.sourcePassageId && p.revisionKey === candidate.sourceRevision
    );

    // If exact passage ID match not found, check if quote is in user transcript
    const quoteClean = (candidate.quote || '').trim().toLowerCase();
    if (!quoteClean) {
      rejectedProposals.push({ candidate, reason: 'Empty transcript quote in proposal' });
      continue;
    }

    const passageText = matchingPassage ? matchingPassage.text.toLowerCase() : allUserText;
    if (!passageText.includes(quoteClean)) {
      // Lenient substring check: at least 70% of quote words match
      const quoteWords = quoteClean.split(/\s+/).filter(w => w.length > 2);
      const matchesWordCount = quoteWords.filter(w => passageText.includes(w)).length;
      if (quoteWords.length > 0 && matchesWordCount / quoteWords.length < 0.6) {
        rejectedProposals.push({
          candidate,
          reason: `Quote "${candidate.quote}" not verified in learner transcript`
        });
        continue;
      }
    }

    // 2. Exposure ledger reclassification:
    // Check if the learner had any support exposure for this item or phrase prior to this turn
    const relevantExposures = supportExposures.filter(exp => {
      if (!candidate.itemId) return true;
      return exp.targetItemIds.length === 0 || exp.targetItemIds.includes(candidate.itemId);
    });

    let finalRetrieval: RetrievalType = candidate.retrievalProposal || 'unknown';

    // If there were any hint exposures (briefing, coach hint, meaning line)
    const hadDirectSupport = relevantExposures.some(
      exp => exp.kind === 'full_form' || exp.kind === 'partial_form' || exp.source === 'briefing'
    );

    if (hadDirectSupport) {
      finalRetrieval = 'assisted';
    } else if (isRehearsalAttempt) {
      finalRetrieval = 'assisted';
    }

    // Spontaneous typing is valid written retrieval, but distinct from spoken
    const finalModality = candidate.modality || 'spoken';

    const observation: LearningObservation = {
      observationId: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sessionId: proposal.sessionId,
      attemptId: proposal.attemptId,
      sourceTurnId: candidate.sourcePassageId || 'turn-1',
      sourceRevision: candidate.sourceRevision || 'rev-1',
      itemId: candidate.itemId || `phrase-custom-${Math.random().toString(36).slice(2, 6)}`,
      candidateForm: candidate.candidateForm,
      meaning: candidate.meaning,
      quote: candidate.quote,
      modality: finalModality,
      retrieval: finalRetrieval,
      taskOutcome: proposal.taskOutcome || 'achieved',
      rehearsal: isRehearsalAttempt,
      supportExposureIds: relevantExposures.map(e => e.id),
      recordedAt: new Date().toISOString()
    };

    validatedObservations.push(observation);
  }

  return {
    validatedObservations,
    taskOutcome: proposal.taskOutcome || 'completed',
    rejectedProposals
  };
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

  // Distinct contexts (sessions) where unassisted retrieval occurred
  const unassistedSessions = new Set(
    activeObs.filter(o => o.retrieval === 'unassisted').map(o => o.sessionId)
  );

  let newRecallStatus: RecallStatus = 'new';
  if (unassistedSessions.size >= 2) {
    newRecallStatus = 'steady';
  } else if (unassistedCount >= 1) {
    newRecallStatus = 'growing';
  } else if (assistedCount >= 1) {
    newRecallStatus = 'supported';
  }

  // Versioned scheduling policy:
  // - supported / new: 1 day interval
  // - growing: 4 days interval
  // - steady: 14 days interval
  let intervalDays = 1;
  if (newRecallStatus === 'steady') {
    intervalDays = 14;
  } else if (newRecallStatus === 'growing') {
    intervalDays = 4;
  }

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
