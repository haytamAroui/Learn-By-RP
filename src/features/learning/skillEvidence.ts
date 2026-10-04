import {
  isAncestorSkill,
  isDirectlyEvidencedSkill,
  isKnownCommunicativeSkill,
} from '../../content/skills';
import { getScene } from '../../content/scenes';
import type { SkillOpportunityDefinition } from '../../contracts/scene';
import {
  qualifiedAssessedChannel,
  qualifiedEvidenceBand,
} from './opportunityQualification';
import {
  exposurePrecedesPassage,
  isSkillProductionSupportRelevant,
} from './supportScope';
import { normalizeText } from './matching';
import { deriveSkillEvidenceReasonCodes } from './evidenceReasons';
import {
  LEARNING_POLICY_VERSION,
  LEARNING_WINDOWS,
  SKILL_POLICY,
} from './policy';
import {
  CommunicativeSkillId,
  EvidenceSource,
  LearningObservation,
  MissionDefinition,
  OpportunityInstance,
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
  /** Runtime opportunity this demonstration belongs to, when already tracked. */
  opportunityInstanceId?: string;
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
  /**
   * Runtime opportunities are authoritative for failure semantics.
   *
   * If none are supplied, the validator may still accept grounded positive
   * demonstrations for backward compatibility, but it will derive no lapse.
   */
  opportunityInstances?: OpportunityInstance[];
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
    | 'skill_not_directly_evidenced'
    | 'less_specific_skill'
    | 'passage_skill_cap_exceeded'
    | 'not_in_mission'
    | 'passage_missing'
    | 'passage_not_learner'
    | 'revision_mismatch'
    | 'quote_not_in_passage'
    | 'support_reference_unknown'
    | 'support_contradicts_retrieval'
    | 'rehearsal_not_independent'
    | 'opportunity_required'
    | 'opportunity_unknown'
    | 'opportunity_not_declared'
    | 'opportunity_skill_mismatch'
    | 'opportunity_not_validated'
    | 'opportunity_not_taken'
    | 'opportunity_metadata_mismatch'
    | 'opportunity_passage_mismatch'
    | 'modality_mismatch'
    | 'opportunity_not_demonstrated';
  reason: string;
}

const VALIDATED_SKILL_EVIDENCE_BRAND = Symbol('learnbyrp.validated-skill-evidence');
const VALIDATED_SKILL_EVIDENCE_INSTANCES = new WeakSet<object>();

/**
 * Opaque archive-write capability for skill evidence.
 *
 * Only this module can construct a non-empty instance because the brand symbol is
 * private. Archive APIs accept this bundle rather than raw SkillObservation /
 * SkillLapse arrays, so a view/model result cannot be persisted by structural
 * coincidence. Runtime assertions also reject forged/cast objects.
 */
export type ValidatedSkillEvidence = Readonly<{
  observations: readonly SkillObservation[];
  lapses: readonly SkillLapse[];
  [VALIDATED_SKILL_EVIDENCE_BRAND]: true;
}>;

function validatedSkillEvidence(
  observations: readonly SkillObservation[],
  lapses: readonly SkillLapse[]
): ValidatedSkillEvidence {
  const evidence = Object.freeze({
    observations: Object.freeze([...observations]),
    lapses: Object.freeze([...lapses]),
    [VALIDATED_SKILL_EVIDENCE_BRAND]: true as const,
  });
  VALIDATED_SKILL_EVIDENCE_INSTANCES.add(evidence);
  return evidence;
}

export const EMPTY_VALIDATED_SKILL_EVIDENCE: ValidatedSkillEvidence =
  validatedSkillEvidence([], []);

export function assertValidatedSkillEvidence(
  value: unknown
): asserts value is ValidatedSkillEvidence {
  if (
    !value ||
    typeof value !== 'object' ||
    (value as Record<PropertyKey, unknown>)[VALIDATED_SKILL_EVIDENCE_BRAND] !== true ||
    !VALIDATED_SKILL_EVIDENCE_INSTANCES.has(value as object)
  ) {
    throw new Error('Skill evidence write rejected: validator-issued evidence bundle required');
  }
}

export function mergeValidatedSkillEvidence(
  bundles: readonly ValidatedSkillEvidence[]
): ValidatedSkillEvidence {
  const observations = new Map<string, SkillObservation>();
  const lapses = new Map<string, SkillLapse>();

  for (const bundle of bundles) {
    assertValidatedSkillEvidence(bundle);
    for (const observation of bundle.observations) {
      observations.set(observation.id, observation);
    }
    for (const lapse of bundle.lapses) {
      lapses.set(lapse.id, lapse);
    }
  }

  return validatedSkillEvidence(
    [...observations.values()],
    [...lapses.values()]
  );
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
  /**
   * The only non-empty skill-evidence value archive write APIs accept.
   * It contains exactly the post-validator rows above.
   */
  evidence: ValidatedSkillEvidence;
  /** The retrieval the validator settled on, which may differ from the proposal. */
  taskOutcome: TaskOutcome;
}


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

interface ValidatedSkillCandidate {
  candidate: SkillEvidenceCandidate;
  observation: SkillObservation;
}

function missionSkillPriority(
  mission: MissionDefinition,
  skillId: CommunicativeSkillId
): [tier: number, index: number, skillId: string] {
  const primaryIndex = mission.primarySkillIds.indexOf(skillId);
  if (primaryIndex >= 0) return [0, primaryIndex, skillId];

  const secondaryIndex = mission.secondarySkillIds.indexOf(skillId);
  if (secondaryIndex >= 0) return [1, secondaryIndex, skillId];

  return [2, Number.MAX_SAFE_INTEGER, skillId];
}

function compareMissionSkillPriority(
  mission: MissionDefinition,
  leftSkillId: CommunicativeSkillId,
  rightSkillId: CommunicativeSkillId
): number {
  const left = missionSkillPriority(mission, leftSkillId);
  const right = missionSkillPriority(mission, rightSkillId);

  if (left[0] !== right[0]) return left[0] - right[0];
  if (left[1] !== right[1]) return left[1] - right[1];
  return left[2].localeCompare(right[2]);
}

/**
 * Applies the V1 per-passage skill-credit cap only after every other validator
 * check has passed. Invalid candidates therefore never consume one of the slots.
 *
 * The cap is over distinct skill ids, not observations. If the same skill appears
 * more than once for one passage/revision, it occupies one slot. When there are
 * more valid skills than the policy permits, mission primary skills win before
 * secondary skills, with authored mission order as the deterministic tie-breaker.
 */
function applyPassageSkillCreditCap(input: {
  entries: ValidatedSkillCandidate[];
  mission: MissionDefinition;
  rejected: SkillValidationRejection[];
}): SkillObservation[] {
  const { entries, mission, rejected } = input;
  const byPassage = new Map<string, ValidatedSkillCandidate[]>();

  for (const entry of entries) {
    const key = `${entry.observation.sourcePassageId}::${entry.observation.sourceRevision}`;
    const group = byPassage.get(key);
    if (group) group.push(entry);
    else byPassage.set(key, [entry]);
  }

  const kept = new Set<ValidatedSkillCandidate>();

  for (const group of byPassage.values()) {
    const skillIds = [...new Set(group.map(entry => entry.observation.skillId))];

    if (skillIds.length <= SKILL_POLICY.maxSkillsCreditedPerPassage) {
      group.forEach(entry => kept.add(entry));
      continue;
    }

    const selected = new Set(
      skillIds
        .sort((left, right) => compareMissionSkillPriority(mission, left, right))
        .slice(0, SKILL_POLICY.maxSkillsCreditedPerPassage)
    );

    for (const entry of group) {
      if (selected.has(entry.observation.skillId)) {
        kept.add(entry);
        continue;
      }

      rejected.push({
        candidate: entry.candidate,
        check: 'passage_skill_cap_exceeded',
        reason:
          `Passage ${entry.observation.sourcePassageId} already supports the policy maximum of ` +
          `${SKILL_POLICY.maxSkillsCreditedPerPassage} distinct skill credits; ` +
          `${entry.observation.skillId} was outside the deterministic mission-priority selection`,
      });
    }
  }

  return entries.filter(entry => kept.has(entry)).map(entry => entry.observation);
}

function sameCommunicativeAct(
  left: SkillEvidenceCandidate,
  right: SkillEvidenceCandidate
): boolean {
  if (
    left.sourcePassageId !== right.sourcePassageId ||
    left.sourceRevision !== right.sourceRevision
  ) {
    return false;
  }

  if (
    left.opportunityInstanceId &&
    left.opportunityInstanceId === right.opportunityInstanceId
  ) {
    return true;
  }

  const leftQuote = normalizeText(left.quote);
  const rightQuote = normalizeText(right.quote);
  if (!leftQuote || !rightQuote) return false;

  return (
    leftQuote === rightQuote ||
    leftQuote.includes(rightQuote) ||
    rightQuote.includes(leftQuote)
  );
}

export function validateSkillEvidenceProposal(
  proposal: SkillEvidenceProposal,
  context: SkillValidationContext
): SkillValidationResult {
  const validatedEntries: ValidatedSkillCandidate[] = [];
  const rejected: SkillValidationRejection[] = [];
  const evidenceSource: EvidenceSource = context.evidenceSource ?? 'validated_explicit';

  const { primary, secondary } = missionSkillIds(context.mission);
  const passagesById = new Map(context.passages.map(p => [p.id, p]));
  const exposuresById = new Map(context.supportExposures.map(e => [e.id, e]));
  const opportunitiesById = new Map(
    (context.opportunityInstances ?? []).map(opportunity => [opportunity.id, opportunity])
  );

  // Support that was on screen, with timestamps, so a claim of independent recall
  // can be contradicted by the ledger.
  const allExposureIds = new Set(context.supportExposures.map(e => e.id));

  // One communicative act may not be credited to both a hierarchy parent and a
  // more-specific child. Candidate order is irrelevant: ancestors are identified
  // before validation begins, using the same passage/revision and overlapping
  // quoted learner words as the act boundary.
  const lessSpecificCandidates = new Set<SkillEvidenceCandidate>();
  for (let i = 0; i < proposal.skillItems.length; i += 1) {
    for (let j = 0; j < proposal.skillItems.length; j += 1) {
      if (i === j) continue;
      const candidate = proposal.skillItems[i];
      const other = proposal.skillItems[j];
      if (
        sameCommunicativeAct(candidate, other) &&
        isAncestorSkill(candidate.skillId, other.skillId)
      ) {
        lessSpecificCandidates.add(candidate);
      }
    }
  }

  for (const candidate of proposal.skillItems) {
    const reject = (check: SkillValidationRejection['check'], reason: string) => {
      rejected.push({ candidate, check, reason });
    };

    // 1. Is this a skill we actually have?
    if (!isKnownCommunicativeSkill(candidate.skillId)) {
      reject('unknown_skill', `"${candidate.skillId}" is not in the curated skill catalog`);
      continue;
    }

    if (lessSpecificCandidates.has(candidate)) {
      reject(
        'less_specific_skill',
        `${candidate.skillId} is an ancestor of a more-specific skill proposed for the same learner act`
      );
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

    // 3. Positive validated evidence must come from a first-class authored
    // opportunity. Mission membership alone is not enough: the scene must have
    // actually created a concrete chance to demonstrate this exact skill.
    if (evidenceSource === 'validated_explicit' && !candidate.opportunityInstanceId) {
      reject(
        'opportunity_required',
        'Validated skill evidence requires a declared runtime opportunity'
      );
      continue;
    }

    let opportunity: OpportunityInstance | undefined;
    let authoredDefinition: SkillOpportunityDefinition | undefined;
    if (candidate.opportunityInstanceId) {
      opportunity = opportunitiesById.get(candidate.opportunityInstanceId);
      if (!opportunity || opportunity.attemptId !== context.attemptId) {
        reject(
          'opportunity_unknown',
          `Opportunity ${candidate.opportunityInstanceId} is not a runtime opportunity for this attempt`
        );
        continue;
      }

      const scene = context.mission.sceneId ? getScene(context.mission.sceneId) : undefined;
      authoredDefinition = scene?.opportunityDefinitions.find(
        definition => definition.id === opportunity!.opportunityId
      );
      if (evidenceSource === 'validated_explicit' && !authoredDefinition) {
        reject(
          'opportunity_not_declared',
          `Opportunity ${opportunity.opportunityId} is not declared by scene ${context.mission.sceneId ?? 'none'}`
        );
        continue;
      }
      if (authoredDefinition) {
        const expectedModalities = [...(authoredDefinition.eligibleModalities ?? [])].sort();
        const actualModalities = [...(opportunity.eligibleModalities ?? [])].sort();
        if (
          (opportunity.evidenceBand ?? 'unknown') !== (authoredDefinition.evidenceBand ?? 'unknown') ||
          opportunity.assessedChannel !== authoredDefinition.assessedChannel ||
          JSON.stringify(actualModalities) !== JSON.stringify(expectedModalities)
        ) {
          reject(
            'opportunity_metadata_mismatch',
            `Opportunity ${opportunity.id} does not preserve its authored band, channel, or eligible modalities`
          );
          continue;
        }
      }
      if (
        authoredDefinition &&
        authoredDefinition.skillId !== opportunity.skillId
      ) {
        reject(
          'opportunity_skill_mismatch',
          `Authored opportunity ${authoredDefinition.id} belongs to ${authoredDefinition.skillId}, not ${opportunity.skillId}`
        );
        continue;
      }
      if (opportunity.skillId !== candidate.skillId) {
        reject(
          'opportunity_skill_mismatch',
          `Opportunity ${opportunity.id} belongs to ${opportunity.skillId}, not ${candidate.skillId}`
        );
        continue;
      }
      if (opportunity.detection !== 'validated') {
        reject(
          'opportunity_not_validated',
          `Opportunity ${opportunity.id} is only ${opportunity.detection}`
        );
        continue;
      }
      if (opportunity.status !== 'taken') {
        reject(
          'opportunity_not_taken',
          `Opportunity ${opportunity.id} was ${opportunity.status}, not taken`
        );
        continue;
      }
    }

    // Derived families organize more-specific skills but never receive direct
    // evidence. This check follows opportunity integrity checks deliberately:
    // malformed/invented runtime opportunity links are rejected on their own
    // authority boundary before the pedagogical hierarchy is considered.
    if (!isDirectlyEvidencedSkill(candidate.skillId)) {
      reject(
        'skill_not_directly_evidenced',
        `${candidate.skillId} is a derived/organizational skill and cannot receive direct evidence`
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
    if (candidate.modality !== passage.modality) {
      reject('modality_mismatch', `Proposal modality does not match learner passage ${passage.id}`);
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

    if (opportunity) {
      if (
        opportunity.learnerAttemptPassageId !== candidate.sourcePassageId ||
        opportunity.learnerAttemptRevision !== candidate.sourceRevision ||
        opportunity.observedModality !== passage.modality ||
        (opportunity.eligibleModalities && !opportunity.eligibleModalities.includes(passage.modality))
      ) {
        reject(
          'opportunity_passage_mismatch',
          `Opportunity ${opportunity.id} is linked to a different learner passage or revision`
        );
        continue;
      }
      if (
        evidenceSource === 'validated_explicit' &&
        opportunity.demonstration !== 'demonstrated'
      ) {
        reject(
          'opportunity_not_demonstrated',
          `Opportunity ${opportunity.id} is classified as ${opportunity.demonstration}`
        );
        continue;
      }
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
      isSkillProductionSupportRelevant({
        exposure,
        passage,
        attemptId: context.attemptId,
        skillId: candidate.skillId,
        opportunityInstanceId: candidate.opportunityInstanceId,
      })
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
    const reasonCodes = deriveSkillEvidenceReasonCodes({
      retrieval,
      modality: candidate.modality,
      evidenceSource,
      relevantSupport,
      isRehearsalAttempt: Boolean(context.isRehearsalAttempt),
    });

    // 9. A rehearsal is not independent use, whatever the proposal claims.
    if (context.isRehearsalAttempt && retrieval === 'unassisted') {
      reject('rehearsal_not_independent', 'Rehearsal attempts cannot be counted as independent');
      continue;
    }

    // 10. Scene outcome and skill demonstration are separate facts.
    //
    // A learner may demonstrate a useful capability inside a scene that is later
    // not achieved for an unrelated authored-world reason. Conversely, completing
    // a scene does not prove every declared skill. Grounding, mission membership,
    // support and opportunity checks decide the skill claim.
    const outcome = deriveOutcome({
      proposed: proposal.taskOutcome,
      retrieval,
      modality: candidate.modality,
    });

    /*
     * The band and channel an observation may carry come from the reviewed
     * qualification of the authored opportunity, not from the runtime instance.
     * The instance's copy is authoritative for integrity and may still be
     * unreviewed; projection is a claim about a learner, so it only receives
     * dimensions a qualified human accepted.
     */
    const qualifiedBand = qualifiedEvidenceBand(authoredDefinition);
    const qualifiedChannel = qualifiedAssessedChannel(authoredDefinition);

    const observation: SkillObservation = {
      id: `skill-obs-${context.sessionId}-${candidate.skillId}-${candidate.sourcePassageId}`,
      skillId: candidate.skillId,

      sessionId: context.sessionId,
      attemptId: context.attemptId,

      sourcePassageId: candidate.sourcePassageId,
      sourceRevision: candidate.sourceRevision,

      contextKey: {
        domainId: context.mission.category,
        scenarioFamilyId: context.mission.scenarioFamilyId,
        assessedChannel: qualifiedChannel,
        evidenceBand: qualifiedBand,
        scenarioId: context.mission.sceneId,
      },

      // Transitional provenance fields. Projection reads contextKey only.
      domainId: context.mission.category,
      scenarioId: context.mission.sceneId,

      modality: candidate.modality,
      assessedChannel: qualifiedChannel,
      evidenceBand: qualifiedBand,
      retrieval,
      taskOutcome: outcome,
      demonstration: 'demonstrated',
      opportunityInstanceId: opportunity?.id,

      supportExposureIds: supportReferenceIds,
      evidenceSource,
      quote: candidate.quote,
      dayKey: (passage.endedAt ?? passage.startedAt ?? new Date().toISOString()).slice(0, 10),
      reasonCode:
        evidenceSource === 'validated_explicit'
          ? 'validated_demonstration'
          : 'legacy_inferred_demonstration',
      reasonCodes,
      policyVersion: LEARNING_POLICY_VERSION,
      recordedAt: passage.endedAt ?? passage.startedAt ?? new Date().toISOString(),
    };
    validatedEntries.push({ candidate, observation });
  }

  const validated = applyPassageSkillCreditCap({
    entries: validatedEntries,
    mission: context.mission,
    rejected,
  });

  const lapses = deriveLapses(proposal, context);

  return {
    validated,
    rejected,
    lapses,
    evidence: validatedSkillEvidence(validated, lapses),
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
  _proposal: SkillEvidenceProposal,
  context: SkillValidationContext
): SkillLapse[] {
  if (context.isRehearsalAttempt) return [];

  // A lapse is only valid after a known natural completion. Missing/unknown
  // termination provenance is not licence to turn a runtime interruption into a
  // learner weakness.
  if (context.sessionEndReason !== 'completed') {
    return [];
  }

  const primary = missionSkillIds(context.mission).primary;
  if (primary.size === 0) return [];
  const scene = context.mission.sceneId ? getScene(context.mission.sceneId) : undefined;

  const passagesById = new Map(context.passages.map(passage => [passage.id, passage]));
  const lapses: SkillLapse[] = [];

  for (const opportunity of context.opportunityInstances ?? []) {
    // A declared or merely presented opportunity is not a failed attempt.
    if (opportunity.attemptId !== context.attemptId) continue;
    if (!isDirectlyEvidencedSkill(opportunity.skillId)) continue;
    if (opportunity.detection !== 'validated') continue;
    if (opportunity.status !== 'taken') continue;
    if (opportunity.demonstration !== 'attempted_not_demonstrated') continue;
    if (!primary.has(opportunity.skillId)) continue;

    // Failure evidence must use the same reviewed opportunity contract as
    // positive evidence. Runtime/client fields cannot supply a band or channel
    // that the authored scene has not qualified, and an authored-but-unreviewed
    // band cannot record a lapse either: a weakness signal needs the same review
    // as a strength signal, or one asymmetry or the other misleads the learner.
    const authoredDefinition = scene?.opportunityDefinitions.find(
      definition => definition.id === opportunity.opportunityId
    );
    const qualifiedBand = qualifiedEvidenceBand(authoredDefinition);
    const qualifiedChannel = qualifiedAssessedChannel(authoredDefinition);
    if (
      !authoredDefinition ||
      authoredDefinition.skillId !== opportunity.skillId ||
      qualifiedBand === 'unknown' ||
      !qualifiedChannel ||
      (opportunity.evidenceBand ?? 'unknown') !== authoredDefinition.evidenceBand ||
      opportunity.assessedChannel !== authoredDefinition.assessedChannel ||
      JSON.stringify([...(opportunity.eligibleModalities ?? [])].sort()) !==
        JSON.stringify([...(authoredDefinition.eligibleModalities ?? [])].sort())
    ) continue;

    // Technical uncertainty must never become a pedagogical weakness signal.
    if (opportunity.failureReason) continue;

    const passageId = opportunity.learnerAttemptPassageId;
    if (!passageId) continue;

    const passage = passagesById.get(passageId);
    if (!passage || passage.speaker !== 'user') continue;
    // Band and channel were already established as reviewed above; what remains
    // here is that the passage really is the performance being judged.
    if (
      opportunity.observedModality !== passage.modality ||
      (opportunity.eligibleModalities && !opportunity.eligibleModalities.includes(passage.modality))
    ) continue;
    if (passage.attemptId !== context.attemptId) continue;
    if (
      opportunity.learnerAttemptRevision &&
      opportunity.learnerAttemptRevision !== passage.revisionKey
    ) {
      continue;
    }

    // Until the scoped support matrix lands, use the existing conservative
    // passage-time rule: any support relevant to this exact attempt/passage means
    // the failure was not cold.
    const relevantSupport = context.supportExposures.filter(exposure =>
      isSkillProductionSupportRelevant({
        exposure,
        passage,
        attemptId: context.attemptId,
        skillId: opportunity.skillId,
        opportunityInstanceId: opportunity.id,
      })
    );
    if (relevantSupport.length > 0) continue;

    lapses.push({
      id: `skill-lapse-${context.sessionId}-${opportunity.id}`,
      skillId: opportunity.skillId,
      sessionId: context.sessionId,
      attemptId: context.attemptId,
      sourcePassageId: passage.id,
      sourceRevision: passage.revisionKey,
      contextKey: {
        domainId: context.mission.category,
        scenarioFamilyId: context.mission.scenarioFamilyId,
        assessedChannel: qualifiedChannel,
        evidenceBand: qualifiedBand,
        scenarioId: context.mission.sceneId,
      },
      assessedChannel: qualifiedChannel,
      evidenceBand: qualifiedBand,
      domainId: context.mission.category,
      scenarioId: context.mission.sceneId,
      opportunityInstanceId: opportunity.id,
      demonstration: 'attempted_not_demonstrated',
      basis: 'cold_attempt_failed',
      dayKey: (
        opportunity.recordedAt ??
        passage.endedAt ??
        passage.startedAt ??
        new Date().toISOString()
      ).slice(0, 10),
      reasonCode: 'cold_taken_opportunity_not_demonstrated',
      policyVersion: LEARNING_POLICY_VERSION,
      recordedAt:
        opportunity.recordedAt ??
        passage.endedAt ??
        passage.startedAt ??
        new Date().toISOString(),
    });
  }

  return lapses;
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
  return exposurePrecedesPassage(exposure, passage, attemptId);
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


/** True when an observation counts as independent, successful use. */
export function isIndependentSuccess(observation: SkillObservation): boolean {
  return (
    observation.demonstration === 'demonstrated' &&
    observation.retrieval === 'unassisted' &&
    observation.modality === 'spoken' &&
    observation.assessedChannel !== undefined &&
    observation.evidenceBand !== undefined &&
    observation.evidenceBand !== 'unknown'
  );
}

/**
 * Positive SkillObservation rows never represent lapses. Failed opportunities are
 * stored as SkillLapse records so scene outcome cannot be misread as competence.
 */
export function isLapse(_observation: SkillObservation): boolean {
  return false;
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
