import { Passage, SupportExposure } from '../../types';
import { LEARNING_POLICY, LEARNING_POLICY_VERSION } from './policy';

/**
 * Support that can expose the learner's production form.
 *
 * Intent-only guidance and help understanding/replaying the character are kept in
 * the ledger for UX/audit purposes but do not downgrade production evidence.
 */
const PRODUCTION_FORM_KINDS = new Set<SupportExposure['kind']>([
  'partial_form',
  'full_form',
  'model_phrase_audio',
  'typed_example',
  'briefing_exposure',
  'recap_exposure',
]);

export function isProductionFormExposure(exposure: SupportExposure): boolean {
  return PRODUCTION_FORM_KINDS.has(exposure.kind);
}

export function exposurePrecedesPassage(
  exposure: SupportExposure,
  passage: Passage,
  attemptId: string
): boolean {
  if (exposure.attemptId && exposure.attemptId !== attemptId) return false;

  const passageEnd = Date.parse(passage.endedAt ?? passage.startedAt ?? '');
  const shownAt = Date.parse(exposure.recordedAt);

  if (!Number.isFinite(passageEnd) || !Number.isFinite(shownAt)) {
    // Preserve the conservative historical rule when timestamps are unusable.
    return true;
  }

  return shownAt <= passageEnd;
}

/**
 * Versioned temporal relevance for production-form support.
 *
 * Newly recorded support uses the current policy. Older persisted support keeps
 * conservative behavior when no policy version exists, so migration never makes
 * historical evidence look more independent than it originally was.
 */
export function isWithinProductionSupportWindow(
  exposure: SupportExposure,
  passage: Passage
): boolean {
  const passageEnd = Date.parse(passage.endedAt ?? passage.startedAt ?? '');
  const shownAt = Date.parse(exposure.recordedAt);

  if (!Number.isFinite(passageEnd) || !Number.isFinite(shownAt)) return true;
  if (shownAt > passageEnd) return false;

  if (exposure.policyVersion === undefined) return true;

  const elapsed = passageEnd - shownAt;
  const version = exposure.policyVersion;
  const windowMs =
    version >= LEARNING_POLICY_VERSION
      ? LEARNING_POLICY.modeledFormWindowMs
      : LEARNING_POLICY.modeledFormWindowMs;

  return elapsed <= windowMs;
}

/**
 * Exact phrase relevance for production evidence.
 *
 * Newly created support is scoped by targetPhraseId. targetItemIds is a legacy
 * multi-target representation retained for old archives. A support record scoped
 * only to a skill/opportunity does not automatically expose every phrase.
 */
export function isPhraseProductionSupportRelevant(
  exposure: SupportExposure,
  phraseId: string
): boolean {
  if (!isProductionFormExposure(exposure)) return false;

  if (exposure.targetPhraseId) return exposure.targetPhraseId === phraseId;
  if (exposure.targetItemIds.length > 0) return exposure.targetItemIds.includes(phraseId);

  if (exposure.targetSkillId || exposure.targetOpportunityId) return false;

  // Unscoped historical form support remains conservative for backward
  // compatibility; new runtime support always carries an explicit scope.
  return true;
}

/**
 * Exact skill/opportunity relevance for production evidence.
 *
 * Opportunity scope wins when present. A phrase-only support record is not enough
 * to downgrade every demonstration of the skill; new coach support carries the
 * target skill alongside an optional target phrase.
 */
export function isSkillProductionSupportRelevant(input: {
  exposure: SupportExposure;
  passage: Passage;
  attemptId: string;
  skillId: string;
  opportunityInstanceId?: string;
}): boolean {
  const { exposure, passage, attemptId, skillId, opportunityInstanceId } = input;
  if (!exposurePrecedesPassage(exposure, passage, attemptId)) return false;
  if (!isProductionFormExposure(exposure)) return false;
  if (!isWithinProductionSupportWindow(exposure, passage)) return false;

  if (exposure.targetOpportunityId) {
    return Boolean(
      opportunityInstanceId && exposure.targetOpportunityId === opportunityInstanceId
    );
  }
  if (exposure.targetSkillId) return exposure.targetSkillId === skillId;

  if (exposure.targetPhraseId || exposure.targetItemIds.length > 0) {
    // Phrase-only support is deliberately not broadened into every skill use.
    return false;
  }

  // Legacy unscoped production-form support stays conservative.
  return true;
}
