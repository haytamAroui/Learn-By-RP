import { COMMUNICATIVE_SKILLS_CATALOG } from '../../data/missions';
import { normalizeText } from './matching';
import { LEARNING_WINDOWS, SKILL_POLICY } from './policy';
import {
  CommunicativeSkillId,
  EvidenceSource,
  LearningObservation,
  MissionDefinition,
  Passage,
  RetrievalType,
  SkillLapse,
  SkillObservation,
  SupportExposure,
  TaskOutcome,
} from '../../types';

/**
 * Skill evidence validation.
 *
 * A skill is a communicative capability, not a memorised string. So the model is
 * allowed to propose that the learner demonstrated one, and is not allowed to
 * decide it: every proposal is checked against curated mission membership, the
 * learner's own recorded words, the transcript revision they spoke under, and the
 * support that was on screen at the time.
 *
 * The same quote-provenance rule that phrase validation already uses applies here.
 * A claim about what the learner can do must be anchored to what they actually
 * said, or it is not evidence of anything.
 */

export interface SkillEvidenceCandidate {
  skillId: CommunicativeSkillId;
  sourcePassageId: string;
  sourceRevision: string;
  quote: string;
  modality: 'spoken' | 'typed';
  retrievalProposal: RetrievalType;
  supportExposureIds?: string[];
}

export interface SkillEvidenceProposal {
  schemaVersion: number;
  sessionId: string;
  attemptId: string;
  taskOutcome: TaskOutcome;
  skillItems: SkillEvidenceCandidate[];
}

export interface SkillValidationContext {
  sessionId: string;
  /**
   * The attempt currently being assessed.
   *
   * Authoritative. Taken from runtime state rather than the proposal, because a
   * proposal that names its own attempt could label a retry as a first attempt and
   * inherit independence it never earned.
   */
  attemptId: string;
  mission: MissionDefinition;
  passages: Passage[];
  supportExposures: SupportExposure[];
  isRehearsalAttempt?: boolean;
  /**
   * How the session ended, when known.
   *
   * A lapse is a claim that the learner failed to recall something unaided. A
   * session that ended because the learner walked away, ran out of time, or lost
   * the network is not that, so these endings must not produce a lapse. Written
   * down now, before the inactivity controller exists, so the rule is enforced by
   * the validator rather than remembered by whoever builds it.
   */
  sessionEndReason?: 'completed' | 'user_ended' | 'time_limit' | 'error';
  /** Defaults to validated. Only migration code passes legacy. */
  evidenceSource?: EvidenceSource;
}

export interface SkillValidationRejection {
  candidate: SkillEvidenceCandidate;
  /** The check that failed. Stable, so it can be tested and displayed. */
  check:
    | 'unknown_skill'
    | 'not_in_mission'
    | 'passage_missing'
    | 'passage_not_learner'
    | 'revision_mismatch'
    | 'quote_not_in_passage'
    | 'support_reference_unknown'
    | 'support_contradicts_retrieval'
    | 'rehearsal_not_independent'
    | 'outcome_incompatible';
  reason: string;
}

export interface SkillValidationResult {
  validated: SkillObservation[];
  rejected: SkillValidationRejection[];
  /**
   * Cold failures, derived rather than proposed.
   *
   * The model is never asked to name a skill it failed at: an unprompted guess
   * about a failure is exactly as unreliable as an unprompted guess about a
   * success, and a false lapse demotes a skill the learner has actually shown.
   */
  lapses: SkillLapse[];
  /** The retrieval the validator settled on, which may differ from the proposal. */
  taskOutcome: TaskOutcome;
}

const KNOWN_SKILL_IDS = new Set(COMMUNICATIVE_SKILLS_CATALOG.map(skill => skill.id));

/** Skills a mission is allowed to produce evidence for. */
export function missionSkillIds(mission: MissionDefinition): {
  primary: Set<CommunicativeSkillId>;
  secondary: Set<CommunicativeSkillId>;
} {
  return {
    primary: new Set(mission.primarySkillIds),
    secondary: new Set(mission.secondarySkillIds),
  };
}

export function validateSkillEvidenceProposal(
  proposal: SkillEvidenceProposal,
  context: SkillValidationContext
): SkillValidationResult {
  const validated: SkillObservation[] = [];
  const rejected: SkillValidationRejection[] = [];
  const evidenceSource: EvidenceSource = context.evidenceSource ?? 'validated_explicit';

  const { primary, secondary } = missionSkillIds(context.mission);
  const passagesById = new Map(context.passages.map(p => [p.id, p]));
  const exposuresById = new Map(context.supportExposures.map(e => [e.id, e]));

  // Support that was on screen, with timestamps, so a claim of independent recall
  // can be contradicted by the ledger.
  const allExposureIds = new Set(context.supportExposures.map(e => e.id));

  for (const candidate of proposal.skillItems) {
    const reject = (check: SkillValidationRejection['check'], reason: string) => {
      rejected.push({ candidate, check, reason });
    };

    // 1. Is this a skill we actually have?
    if (!KNOWN_SKILL_IDS.has(candidate.skillId)) {
      reject('unknown_skill', `"${candidate.skillId}" is not in the curated skill catalog`);
      continue;
    }

    // 2. Does this mission teach that skill? Without this check the model could
    //    credit any catalogued skill from any successful turn, which is the exact
    //    failure mode this contract exists to prevent.
    const isPrimary = primary.has(candidate.skillId);
    const isSecondary = secondary.has(candidate.skillId);
    if (!isPrimary && !isSecondary) {
      reject(
        'not_in_mission',
        `${context.mission.id} does not declare ${candidate.skillId} ` +
          `(primary: ${[...primary].join(', ') || 'none'}; secondary: ${[...secondary].join(', ') || 'none'})`
      );
      continue;
    }

    // 3. Does the cited passage exist?
    const passage = passagesById.get(candidate.sourcePassageId);
    if (!passage) {
      reject('passage_missing', `No passage ${candidate.sourcePassageId} in this session`);
      continue;
    }

    // 4. Only the learner's own words can evidence the learner.
    if (passage.speaker !== 'user') {
      reject('passage_not_learner', `Passage ${passage.id} is the ${passage.speaker}, not the learner`);
      continue;
    }

    // 5. Is the transcript revision still the one that was read?
    if (passage.revisionKey !== candidate.sourceRevision) {
      reject(
        'revision_mismatch',
        `Passage ${passage.id} is at revision ${passage.revisionKey}, proposal cites ${candidate.sourceRevision}`
      );
      continue;
    }

    // 6. Is the quoted text actually in that passage?
    if (!quoteAppearsIn(candidate.quote, passage.text)) {
      reject(
        'quote_not_in_passage',
        `Quote "${truncate(candidate.quote)}" is not present in passage ${passage.id}`
      );
      continue;
    }

    // 7. Do the cited supports exist? Citation is checked but never trusted.
    const supportIds = candidate.supportExposureIds ?? [];
    const unknownSupport = supportIds.filter(id => !allExposureIds.has(id));
    if (unknownSupport.length > 0) {
      reject(
        'support_reference_unknown',
        `Cited support not in the ledger: ${unknownSupport.join(', ')}`
      );
      continue;
    }

    // 8. Determine relevant support from the ledger, not from the proposal.
    //
    //    The model does not see the support ledger, so it cannot reliably cite it:
    //    asking it which support was shown yields confident and wrong answers, and
    //    an empty citation would look like a clean cold attempt. Relevance is
    //    therefore computed here from timestamps — support recorded before the end
    //    of the cited passage, within the same attempt.
    const relevantSupport = context.supportExposures.filter(exposure =>
      isRelevantToPassage(exposure, passage, context.attemptId)
    );
    const hadSupport = relevantSupport.length > 0;
    const retrieval = deriveRetrieval({
      proposed: candidate.retrievalProposal,
      hadSupport,
      modality: candidate.modality,
    });

    if (candidate.retrievalProposal === 'unassisted' && hadSupport) {
      rejected.push({
        candidate,
        check: 'support_contradicts_retrieval',
        reason: `Proposed unaided but ${relevantSupport.length} support exposure(s) were shown before this passage ended`,
      });
      // Recorded as assisted rather than discarded: it is still real evidence,
      // just not evidence of independent recall.
    }

    // Persist the ledger's answer, not the model's citation.
    const supportReferenceIds = relevantSupport.map(e => e.id);

    // 9. A rehearsal is not independent use, whatever the proposal claims.
    if (context.isRehearsalAttempt && retrieval === 'unassisted') {
      reject('rehearsal_not_independent', 'Rehearsal attempts cannot be counted as independent');
      continue;
    }

    // 10. A failed task cannot be evidence of a successful demonstration.
    const outcome = deriveOutcome({
      proposed: proposal.taskOutcome,
      retrieval,
      modality: candidate.modality,
    });
    if (!isCompatibleOutcome(outcome, retrieval)) {
      reject(
        'outcome_incompatible',
        `Outcome "${outcome}" cannot evidence a skill demonstrated with retrieval "${retrieval}"`
      );
      continue;
    }

    validated.push({
      id: `skill-obs-${context.sessionId}-${candidate.skillId}-${candidate.sourcePassageId}`,
      skillId: candidate.skillId,

      sessionId: context.sessionId,
      attemptId: context.attemptId,

      sourcePassageId: candidate.sourcePassageId,
      sourceRevision: candidate.sourceRevision,

      contextKey: {
        domainId: context.mission.category,
        scenarioFamilyId: context.mission.scenarioFamilyId,
        scenarioId: context.mission.sceneId,
      },

      // Transitional provenance fields. Projection reads contextKey only.
      domainId: context.mission.category,
      scenarioId: context.mission.sceneId,

      modality: candidate.modality,
      retrieval,
      taskOutcome: outcome,

      supportExposureIds: supportReferenceIds,
      evidenceSource,
      quote: candidate.quote,
      recordedAt: passage.endedAt ?? passage.startedAt ?? new Date().toISOString(),
    });
  }

  return {
    validated,
    rejected,
    lapses: deriveLapses(proposal, context),
    taskOutcome: proposal.taskOutcome,
  };
}

/**
 * Derives cold-attempt failures.
 *
 * A lapse needs a genuine opportunity to fail: the learner spoke, no support was
 * shown, the task did not succeed, and it was not a rehearsal. Every one of those
 * is checked rather than assumed, because the cost of a false lapse is that a real
 * capability gets flagged as needing review.
 *
 * Lapses are attached to the mission's primary skills, since those are the ones
 * the session was actually attempting.
 */
export function deriveLapses(
  proposal: SkillEvidenceProposal,
  context: SkillValidationContext
): SkillLapse[] {
  if (proposal.taskOutcome !== 'not_achieved') return [];
  if (context.isRehearsalAttempt) return [];

  // A session that ended early did not demonstrate a failure to recall. Silence is
  // not a lapse, and neither is a network drop or a learner who simply left.
  if (
    context.sessionEndReason &&
    context.sessionEndReason !== 'completed'
  ) {
    return [];
  }

  const learnerPassages = context.passages.filter(p => p.speaker === 'user');
  if (learnerPassages.length === 0) return [];

  // Support anywhere in the session means this was not a cold attempt.
  if (context.supportExposures.length > 0) return [];

  const primary = missionSkillIds(context.mission).primary;
  if (primary.size === 0) return [];

  // The most recent learner passage is where the failure landed.
  const passage = [...learnerPassages].sort((a, b) =>
    (a.endedAt ?? a.startedAt ?? '').localeCompare(b.endedAt ?? b.startedAt ?? '')
  )[learnerPassages.length - 1];

  return [...primary].map(skillId => ({
    id: `skill-lapse-${context.sessionId}-${skillId}`,
    skillId,
    sessionId: context.sessionId,
    attemptId: context.attemptId,
    sourcePassageId: passage.id,
    sourceRevision: passage.revisionKey,
    domainId: context.mission.category,
    scenarioId: context.mission.sceneId,
    basis: 'cold_attempt_failed' as const,
    recordedAt: passage.endedAt ?? passage.startedAt ?? new Date().toISOString(),
  }));
}

/**
 * Whether an exposure counts as support for a given learner passage.
 *
 * Same attempt, and shown no later than the moment the learner finished speaking.
 * An exposure after the fact did not help produce this attempt, so counting it
 * would penalise a learner for asking for help afterwards.
 */
export function isRelevantToPassage(
  exposure: SupportExposure,
  passage: Passage,
  attemptId: string
): boolean {
  if (exposure.attemptId && exposure.attemptId !== attemptId) return false;

  const passageEnd = Date.parse(passage.endedAt ?? passage.startedAt ?? '');
  const shownAt = Date.parse(exposure.recordedAt);

  if (!Number.isFinite(passageEnd) || !Number.isFinite(shownAt)) {
    // Without usable timestamps, an exposure in this session cannot be ruled out,
    // and assuming it did not happen would overstate independent recall.
    return true;
  }

  return shownAt <= passageEnd;
}

/**
 * Whether a quoted span really came from the passage.
 *
 * Normalised containment rather than exact match: the transcript is normalised
 * before storage, so punctuation and spacing legitimately differ. The coverage
 * floor stops a proposal from smuggling in most of a sentence that was never said.
 */
export function quoteAppearsIn(quote: string, passageText: string): boolean {
  const normalizedQuote = normalizeText(quote);
  if (!normalizedQuote) return false;
  if (normalizeText(passageText).includes(normalizedQuote)) return true;

  const words = normalizedQuote.split(' ').filter(Boolean);
  if (words.length < 3) return false;

  const haystack = new Set(normalizeText(passageText).split(' '));
  const found = words.filter(word => haystack.has(word)).length;

  return found / words.length >= LEARNING_WINDOWS.minQuoteCoverage;
}

function truncate(text: string, max = 48): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * The retrieval the validator settled on.
 *
 * Support on screen forces assisted regardless of what was proposed. Spontaneous
 * typing is written retrieval, which is real but is not spoken production, so it
 * stays `unknown` rather than being downgraded to assisted.
 */
export function deriveRetrieval(input: {
  proposed: RetrievalType;
  hadSupport: boolean;
  modality: 'spoken' | 'typed';
}): RetrievalType {
  if (input.hadSupport) return 'assisted';
  if (input.proposed === 'unassisted') {
    return input.modality === 'spoken' ? 'unassisted' : 'unknown';
  }
  return input.proposed;
}

/**
 * An unknown outcome is not downgraded to success just because a phrase was
 * recognised. If the interaction did not establish that the task worked, the
 * observation records what is actually known.
 */
function deriveOutcome(input: {
  proposed: TaskOutcome;
  retrieval: RetrievalType;
  modality: 'spoken' | 'typed';
}): TaskOutcome {
  return input.proposed;
}

/**
 * Whether this outcome can stand as a demonstration of the skill.
 *
 * `not_achieved` is compatible only with nothing: a failed exchange is evidence
 * that the task did not succeed, not that the capability was absent or present.
 */
function isCompatibleOutcome(outcome: TaskOutcome, retrieval: RetrievalType): boolean {
  if (outcome === 'not_achieved') return false;
  if (outcome === 'unknown') return false;
  return true;
}

/** True when an observation counts as independent, successful use. */
export function isIndependentSuccess(observation: SkillObservation): boolean {
  return (
    observation.retrieval === 'unassisted' &&
    observation.modality === 'spoken' &&
    observation.taskOutcome !== 'not_achieved' &&
    observation.taskOutcome !== 'unknown'
  );
}

/** True when an observation records a genuine failed cold attempt. */
export function isLapse(observation: SkillObservation): boolean {
  return (
    observation.retrieval === 'unassisted' &&
    observation.taskOutcome === 'not_achieved' &&
    observation.supportExposureIds.length === 0
  );
}

/** The calendar day an observation falls on, in UTC. */
export function observationDay(observation: SkillObservation): string {
  return observation.recordedAt.slice(0, 10);
}

/** Days between two ISO timestamps, at least zero. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.floor((b - a) / 86_400_000));
}

export { SKILL_POLICY };