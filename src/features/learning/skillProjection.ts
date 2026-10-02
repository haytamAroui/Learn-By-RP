import { COMMUNICATIVE_SKILLS_CATALOG, isDirectlyEvidencedSkill } from '../../content/skills';
import { SKILL_POLICY } from './policy';
import { matchPhraseInText } from './matching';
import { isIndependentSuccess, observationDay } from './skillEvidence';
import {
  CommunicativeSkillId,
  LearningObservation,
  SkillLapse,
  SkillObservation,
  SkillProjectionV2,
  SkillStatus,
} from '../../types';

/**
 * Skill projection.
 *
 * Reads validated skill evidence, not phrase text. A skill is promoted only by
 * independent, successful use across distinct situations and distinct days, which
 * is a harder bar than phrase recall and deliberately so: the phrase view can
 * honestly say "you used this word twice", while the skill view is making a claim
 * about a capability.
 */

/**
 * Whether a lapse was recorded inside the review window relative to `now`.
 *
 * Lapses arrive as their own durable records rather than as observations, so a
 * failure is never silently reclassified as positive evidence and never has to be
 * discarded just because it cannot be one.
 */
function recentLapseCount(
  lapses: SkillLapse[],
  skillId: CommunicativeSkillId,
  now: number
): number {
  return lapses.filter(lapse => {
    if (lapse.skillId !== skillId) return false;
    const at = Date.parse(lapse.recordedAt);
    if (!Number.isFinite(at)) return false;
    const ageDays = (now - at) / 86_400_000;
    return ageDays >= 0 && ageDays <= SKILL_POLICY.lapseReviewWindowDays;
  }).length;
}


/**
 * Canonical transfer identity.
 *
 * scenarioId, sessionId, locale and pressure variants are deliberately excluded:
 * they may describe different executions without representing a genuinely new
 * communicative situation.
 */
export function skillContextIdentity(observation: SkillObservation): string {
  const { domainId, scenarioFamilyId } = observation.contextKey;
  return `${domainId}::${scenarioFamilyId}`;
}

export function projectSkill(
  skillId: CommunicativeSkillId,
  observations: SkillObservation[],
  lapses: SkillLapse[] = [],
  now: number = Date.now()
): SkillProjectionV2 {
  const mine = observations.filter(o => o.skillId === skillId);

  const independent = mine.filter(isIndependentSuccess);
  const assisted = mine.filter(
    o => o.retrieval === 'assisted' || o.retrieval === 'unknown'
  );

  const independentContexts = [...new Set(independent.map(skillContextIdentity))];
  const independentDays = [...new Set(independent.map(observationDay))].sort();

  const validatedIndependent = independent.filter(
    o => o.evidenceSource === 'validated_explicit'
  );
  const legacyIndependent = independent.filter(
    o => o.evidenceSource === 'legacy_inferred'
  );

  const recentLapses = recentLapseCount(lapses, skillId, now);
  const reviewDue = recentLapses > 0;
  const revisit = recentLapses >= SKILL_POLICY.revisitMinRecentLapses;
  const lastIndependentUseAt = independent
    .map(observation => observation.recordedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  const status = deriveStatus({
    independentContexts: independentContexts.length,
    independentDays: independentDays.length,
    hasAnyEvidence: mine.length > 0,
    hasAssistedOnly: independent.length === 0 && assisted.length > 0,
    validatedCount: validatedIndependent.length,
    legacyOnly: legacyIndependent.length > 0 && validatedIndependent.length === 0,
  });

  return {
    skillId,
    status,
    independentContexts,
    independentDays,
    assistedCount: assisted.length,
    validatedCount: validatedIndependent.length,
    legacyInferredCount: legacyIndependent.length,
    reviewDue,
    revisit,
    lastIndependentUseAt,
    explanation: explain(status, {
      independentContexts: independentContexts.length,
      independentDays: independentDays.length,
      legacyOnly: legacyIndependent.length > 0 && validatedIndependent.length === 0,
    }),
  };
}

/**
 * Promotion rules.
 *
 * Steady additionally requires validated evidence. A history reconstructed by
 * substring inference is kept and shown, but guessing is not the same as having
 * observed the learner, so it cannot be the thing that establishes a capability.
 */
function deriveStatus(input: {
  independentContexts: number;
  independentDays: number;
  hasAnyEvidence: boolean;
  hasAssistedOnly: boolean;
  validatedCount: number;
  legacyOnly: boolean;
}): SkillStatus {
  if (!input.hasAnyEvidence) return 'new';
  if (input.hasAssistedOnly) return 'supported';

  const growing =
    input.independentContexts >= SKILL_POLICY.growingMinContexts &&
    input.independentDays >= SKILL_POLICY.growingMinDays;

  if (input.independentContexts > 0 && !growing) return 'supported';

  const steady =
    input.independentContexts >= SKILL_POLICY.steadyMinContexts &&
    input.independentDays >= SKILL_POLICY.steadyMinDays &&
    input.validatedCount >= SKILL_POLICY.steadyMinValidatedObservations;

  if (steady && !input.legacyOnly) return 'steady';
  if (growing) return 'growing';
  return 'supported';
}

function explain(
  status: SkillStatus,
  counts: { independentContexts: number; independentDays: number; legacyOnly: boolean }
): string {
  switch (status) {
    case 'new':
      return 'No evidence yet.';
    case 'supported':
      return counts.independentContexts > 0
        ? `Independent use in ${counts.independentContexts} situation(s), not yet across enough days.`
        : 'Used with help so far.';
    case 'growing':
      return `Used independently in ${counts.independentContexts} situations across ${counts.independentDays} days.`;
    case 'steady':
      return `Used independently in ${counts.independentContexts} situations across ${counts.independentDays} days.`;
  }
}

/** Every catalogued skill, whether or not it has evidence. */
export function projectSkillsV2(
  observations: SkillObservation[],
  lapses: SkillLapse[] = [],
  now: number = Date.now()
): SkillProjectionV2[] {
  return COMMUNICATIVE_SKILLS_CATALOG
    .filter(skill => isDirectlyEvidencedSkill(skill.id))
    .map(skill => projectSkill(skill.id, observations, lapses, now));
}

/**
 * Reconstruct skill evidence from historical phrase observations.
 *
 * Substring matching against a skill's sample phrasings is not a sound way to
 * decide what someone can do, and it is kept only so that sessions recorded before
 * the evidence contract existed are not silently discarded. Everything it produces
 * is marked `legacy_inferred`, which cannot reach steady on its own.
 */
export function inferLegacySkillEvidence(
  observations: LearningObservation[]
): SkillObservation[] {
  const inferred: SkillObservation[] = [];

  for (const observation of observations) {
    const quote = observation.quote || observation.candidateForm || '';
    if (!quote.trim()) continue;

    for (const skill of COMMUNICATIVE_SKILLS_CATALOG) {
      if (!isDirectlyEvidencedSkill(skill.id)) continue;
      if (!matchesAnySample(quote, skill.samplePhrases)) continue;

      inferred.push({
        id: `legacy-${observation.observationId}-${skill.id}`,
        skillId: skill.id,
        sessionId: observation.sessionId,
        attemptId: observation.attemptId,
        sourcePassageId: observation.sourceTurnId,
        sourceRevision: observation.sourceRevision,
        // Historical phrase observations did not persist a reviewed scenario
        // family. Keep them in one conservative legacy context rather than
        // manufacturing transfer from different session ids.
        contextKey: {
          domainId: 'legacy',
          scenarioFamilyId: 'legacy-unknown',
        },
        modality: observation.modality,
        retrieval: observation.retrieval,
        taskOutcome: observation.taskOutcome,
        demonstration: 'demonstrated',
        supportExposureIds: observation.supportExposureIds,
        evidenceSource: 'legacy_inferred',
        quote,
        recordedAt: observation.recordedAt,
      });
    }
  }

  return inferred;
}

function matchesAnySample(quote: string, samples: string[]): boolean {
  return samples.some(sample => matchPhraseInText(sample, quote).verdict !== 'none');
}