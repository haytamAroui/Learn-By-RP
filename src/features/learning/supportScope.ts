import { Passage, SessionRecord, SupportExposure } from '../../types';
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

const CROSS_SESSION_FORM_KINDS = new Set<SupportExposure['kind']>([
  'briefing_exposure',
  'recap_exposure',
]);

function isCrossSessionFormExposure(exposure: SupportExposure): boolean {
  return CROSS_SESSION_FORM_KINDS.has(exposure.kind);
}

function utcDayKey(value: string): string | null {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : null;
}

export function isProductionFormExposure(exposure: SupportExposure): boolean {
  return PRODUCTION_FORM_KINDS.has(exposure.kind);
}

/**
 * Pull only historical briefing/recap rows that could affect one new mission.
 *
 * The original exposure objects are returned unchanged so their session and
 * attempt provenance remains intact. They are read-only evidence inputs and are
 * never copied into the new session's durable ledger.
 */
export function selectHistoricalCrossSessionSupport(input: {
  sessions: SessionRecord[];
  currentSessionId: string;
  targetPhraseIds: readonly string[];
  currentSessionStartedAt: string;
}): SupportExposure[] {
  const targetIds = new Set(input.targetPhraseIds);
  const currentDay = utcDayKey(input.currentSessionStartedAt);
  const currentStart = Date.parse(input.currentSessionStartedAt);
  if (!currentDay || !Number.isFinite(currentStart) || targetIds.size === 0) return [];

  const byId = new Map<string, SupportExposure>();
  for (const session of input.sessions) {
    if (session.id === input.currentSessionId) continue;

    for (const exposure of session.supportExposures ?? []) {
      if (!isCrossSessionFormExposure(exposure)) continue;
      const shownAt = Date.parse(exposure.recordedAt);
      if (!Number.isFinite(shownAt) || shownAt > currentStart) continue;
      if (utcDayKey(exposure.recordedAt) !== currentDay) continue;

      const shownIds = new Set([
        ...(exposure.targetPhraseId ? [exposure.targetPhraseId] : []),
        ...(exposure.targetItemIds ?? []),
      ]);
      if (![...shownIds].some(id => targetIds.has(id))) continue;

      byId.set(exposure.id, exposure);
    }
  }

  return [...byId.values()].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

export function exposurePrecedesPassage(
  exposure: SupportExposure,
  passage: Passage,
  attemptId: string
): boolean {
  if (
    !isCrossSessionFormExposure(exposure) &&
    exposure.attemptId &&
    exposure.attemptId !== attemptId
  ) {
    return false;
  }

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

  if (isCrossSessionFormExposure(exposure)) {
    const shownDay = utcDayKey(exposure.recordedAt);
    const passageDay = utcDayKey(passage.endedAt ?? passage.startedAt ?? '');
    return Boolean(shownDay && passageDay && shownDay === passageDay);
  }

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
export function isPhraseProductionSupportRelevant(input: {
  exposure: SupportExposure;
  phraseId: string;
  passage?: Passage;
  attemptId?: string;
}): boolean {
  const { exposure, phraseId, passage, attemptId } = input;
  if (!isProductionFormExposure(exposure)) return false;

  if (passage && attemptId) {
    if (!exposurePrecedesPassage(exposure, passage, attemptId)) return false;
    if (!isWithinProductionSupportWindow(exposure, passage)) return false;
  }

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
