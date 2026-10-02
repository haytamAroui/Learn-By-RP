import { Passage, SupportExposure } from '../../types';
import { LEARNING_POLICY_VERSION } from './policy';

/**
 * Ledger the assistant captions that are actually rendered in the live RP view.
 *
 * Caption text is comprehension context, not production-form help. The exposure
 * is still durable because future comprehension evidence needs to know whether
 * the learner could read the character turn. IDs are deterministic per
 * attempt+passage so ordinary React re-renders cannot duplicate the ledger.
 */
export function mergeVisibleCaptionViewExposures(input: {
  existing: SupportExposure[];
  visiblePassages: Passage[];
  sessionId: string;
  attemptId: string;
  recordedAt: string;
}): SupportExposure[] {
  const existingIds = new Set(input.existing.map(exposure => exposure.id));
  const additions: SupportExposure[] = [];

  for (const passage of input.visiblePassages) {
    if (passage.speaker !== 'assistant' || passage.status !== 'final') continue;

    const id = `exp-caption-view-${input.attemptId}-${passage.id}`;
    if (existingIds.has(id)) continue;
    existingIds.add(id);

    additions.push({
      id,
      sessionId: input.sessionId,
      attemptId: input.attemptId,
      turnId: passage.id,
      source: 'caption',
      kind: 'caption_view',
      targetItemIds: [],
      exposure: 'visible',
      policyVersion: LEARNING_POLICY_VERSION,
      recordedAt: input.recordedAt,
    });
  }

  return additions.length > 0 ? [...input.existing, ...additions] : input.existing;
}

/**
 * Exact production-form exposure created only after the learner explicitly plays
 * the scoped coach model phrase.
 */
export function createModelPhraseAudioExposure(input: {
  sessionId: string;
  attemptId: string;
  targetSkillId: string;
  targetOpportunityId?: string;
  targetPhraseId: string;
  recordedAt: string;
}): SupportExposure {
  return {
    id: `exp-model-phrase-audio-${input.attemptId}-${input.targetPhraseId}-${input.recordedAt}`,
    sessionId: input.sessionId,
    attemptId: input.attemptId,
    source: 'coach',
    kind: 'model_phrase_audio',
    targetSkillId: input.targetSkillId,
    targetOpportunityId: input.targetOpportunityId,
    targetPhraseId: input.targetPhraseId,
    targetItemIds: [input.targetPhraseId],
    exposure: 'played',
    policyVersion: LEARNING_POLICY_VERSION,
    recordedAt: input.recordedAt,
  };
}
