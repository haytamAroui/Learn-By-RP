/**
 * Opportunity qualification gate.
 *
 * `evidenceBand`, `assessedChannel` and `eligibleModalities` are authored
 * judgements about one specific opportunity. Authoring them is not the same as
 * having them accepted: an unreviewed band is a claim nobody has checked, and
 * promotion is a claim about a person.
 *
 * So the two acts are separated here, in one place, rather than in every reader:
 * content may carry an authored qualification, and only a reviewed one is
 * allowed to qualify a learner's evidence. Everything downstream — positive
 * observations, lapses, projection partitions — reads the band and channel
 * through these functions and therefore fails closed by construction.
 *
 * The metadata itself stays faithful on the runtime `OpportunityInstance`. A
 * mismatch between the instance and its authored definition is an integrity
 * failure and is checked as one; this module decides what those faithful values
 * are allowed to mean.
 */

import type { SkillOpportunityDefinition } from '../../contracts/scene';
import {
  OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
} from '../../contracts/scene';
import type { EvidenceBand, Modality, SkillModality } from '../../types';

export { OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION };

export type OpportunityQualificationStatus = 'undecided' | 'authored_pending_review' | 'reviewed';

/**
 * Whether this opportunity's authored dimensions may qualify evidence.
 *
 * Requires the current rubric version, the reviewed status, and a named reviewer.
 * Every one of those is load-bearing: a reviewer id with no status is an
 * in-progress record, and a status with no id is an unverified claim.
 */
export function isOpportunityQualificationReviewed(
  definition: Pick<SkillOpportunityDefinition, 'qualification'> | undefined | null
): boolean {
  const qualification = definition?.qualification;
  if (!qualification) return false;
  if (qualification.rubricVersion !== OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION) return false;
  if (qualification.status !== 'reviewed') return false;
  return typeof qualification.reviewerId === 'string' && qualification.reviewerId.trim().length > 0;
}

export function opportunityQualificationStatus(
  definition: Pick<SkillOpportunityDefinition, 'qualification'> | undefined | null
): OpportunityQualificationStatus {
  if (!definition?.qualification) return 'undecided';
  return isOpportunityQualificationReviewed(definition) ? 'reviewed' : 'authored_pending_review';
}

/**
 * The band that evidence from this opportunity may carry.
 *
 * `unknown` is not a low band. It means the band is not established, and every
 * consumer already treats `unknown` as incapable of promoting or backfilling.
 */
export function qualifiedEvidenceBand(
  definition: Pick<SkillOpportunityDefinition, 'evidenceBand' | 'qualification'> | undefined | null
): EvidenceBand {
  if (!isOpportunityQualificationReviewed(definition)) return 'unknown';
  return definition?.evidenceBand ?? 'unknown';
}

/** The channel evidence may be attributed to, or undefined when unqualified. */
export function qualifiedAssessedChannel(
  definition: Pick<SkillOpportunityDefinition, 'assessedChannel' | 'qualification'> | undefined | null
): SkillModality | undefined {
  if (!isOpportunityQualificationReviewed(definition)) return undefined;
  return definition?.assessedChannel;
}

/**
 * Eligible delivery modalities.
 *
 * Deliberately not gated on review: modality eligibility is an integrity
 * constraint that decides whether a passage can satisfy the opportunity at all,
 * not a competence claim. Reading it as a competence claim is what would let an
 * unreviewed draft quietly narrow or widen what a learner may be assessed on.
 */
export function authoredEligibleModalities(
  definition: Pick<SkillOpportunityDefinition, 'eligibleModalities'> | undefined | null
): Modality[] | undefined {
  return definition?.eligibleModalities;
}

/** Human-readable summary used by the review generator and the readiness report. */
export interface OpportunityQualificationSummary {
  status: OpportunityQualificationStatus;
  band: EvidenceBand | 'unauthored';
  channel: SkillModality | 'unauthored';
  modalities: Modality[] | null;
  rationale: string | null;
  reviewerId: string | null;
  reviewedAt: string | null;
  rubricVersion: number | null;
  /**
   * True when authored dimensions exist and no accepted review releases them.
   * Distinct from `status`: an unreviewed band is held back, not rejected.
   */
  blocksQualification: boolean;
}

export function summarizeOpportunityQualification(
  definition: SkillOpportunityDefinition | undefined | null
): OpportunityQualificationSummary {
  const qualification = definition?.qualification;
  const reviewed = isOpportunityQualificationReviewed(definition);
  const hasAnyValue =
    definition?.evidenceBand !== undefined || definition?.assessedChannel !== undefined;

  return {
    status: opportunityQualificationStatus(definition),
    band: definition?.evidenceBand ?? 'unauthored',
    channel: definition?.assessedChannel ?? 'unauthored',
    modalities: definition?.eligibleModalities ?? null,
    rationale: qualification?.rationale ?? null,
    reviewerId: qualification?.reviewerId ?? null,
    reviewedAt: qualification?.reviewedAt ?? null,
    rubricVersion: qualification?.rubricVersion ?? null,
    blocksQualification: hasAnyValue && !reviewed,
  };
}