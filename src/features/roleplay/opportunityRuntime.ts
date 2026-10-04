import { SceneDefinition, SceneStateSnapshot } from '../../contracts/scene';
import { OpportunityInstance, Passage, SkillDemonstration } from '../../types';
import { evaluatePredicate } from './sceneReducer';

/**
 * Synchronise first-class authored opportunities from authoritative scene state.
 *
 * This function never performs semantic detection. If the authored predicate is
 * true, the opportunity is runtime-validated and may be presented. If it is
 * false, nothing is inferred about the learner.
 */
export function syncAuthoredOpportunities(input: {
  scene: SceneDefinition;
  state: SceneStateSnapshot;
  existing: OpportunityInstance[];
  recordedAt: string;
}): OpportunityInstance[] {
  const { scene, state, recordedAt } = input;
  if (state.sceneId !== scene.id) {
    throw new Error(`Scene state ${state.sceneId} does not match definition ${scene.id}`);
  }

  const byDefinition = new Map(
    input.existing
      .filter(instance => instance.attemptId === state.attemptId)
      .map(instance => [instance.opportunityId, instance])
  );
  const next = [...input.existing];

  for (const definition of scene.opportunityDefinitions) {
    if (byDefinition.has(definition.id)) continue;
    // Repair challenges must be actually delivered before their opportunity is
    // presented. A true scene predicate alone must never manufacture confusion.
    if (definition.communicationChallengeId) continue;
    if (!evaluatePredicate(definition.sceneCondition, state.facts, state.actionCounts)) continue;

    next.push({
      id: opportunityInstanceId(state.attemptId, definition.id),
      attemptId: state.attemptId,
      opportunityId: definition.id,
      skillId: definition.skillId,
      assessedChannel: definition.assessedChannel,
      evidenceBand: definition.evidenceBand,
      eligibleModalities: definition.eligibleModalities,
      status: 'presented',
      detection: 'validated',
      demonstration: 'unknown',
      recordedAt,
    });
  }

  return next;
}

/**
 * Materialise the opportunity owned by one explicit authored communication
 * challenge after the Director/provider has actually delivered that challenge.
 *
 * This operation is deterministic and idempotent. It never classifies what the
 * learner did and therefore never creates evidence by itself.
 */
export function presentAuthoredCommunicationChallenge(input: {
  scene: SceneDefinition;
  state: SceneStateSnapshot;
  existing: OpportunityInstance[];
  challengeId: string;
  recordedAt: string;
  presentedAtPassageId?: string;
}): OpportunityInstance[] {
  const { scene, state, challengeId, recordedAt, presentedAtPassageId } = input;
  if (state.sceneId !== scene.id) {
    throw new Error(`Scene state ${state.sceneId} does not match definition ${scene.id}`);
  }

  const challenge = scene.communicationChallenges.find(item => item.id === challengeId);
  if (!challenge) {
    throw new Error(`Unknown communication challenge ${challengeId}`);
  }
  if (!evaluatePredicate(challenge.trigger, state.facts, state.actionCounts)) {
    throw new Error(`Communication challenge ${challengeId} is not available in current scene state`);
  }

  const definition = scene.opportunityDefinitions.find(
    item => item.id === challenge.opportunityId
  );
  if (
    !definition ||
    definition.communicationChallengeId !== challenge.id ||
    definition.skillId !== challenge.targetSkillId
  ) {
    throw new Error(`Communication challenge ${challengeId} has an invalid opportunity binding`);
  }

  const existingInstance = input.existing.find(
    instance =>
      instance.attemptId === state.attemptId &&
      instance.opportunityId === definition.id
  );
  if (existingInstance) return input.existing;

  return [
    ...input.existing,
    {
      id: opportunityInstanceId(state.attemptId, definition.id),
      attemptId: state.attemptId,
      opportunityId: definition.id,
      skillId: definition.skillId,
      assessedChannel: definition.assessedChannel,
      evidenceBand: definition.evidenceBand,
      eligibleModalities: definition.eligibleModalities,
      status: 'presented',
      detection: 'validated',
      demonstration: 'unknown',
      ...(presentedAtPassageId ? { presentedAtPassageId } : {}),
      recordedAt,
    },
  ];
}

/**
 * Link a real learner passage to a presented opportunity.
 *
 * Merely having an authored opportunity present is not evidence. A concrete final
 * learner passage is required before it can become `taken`.
 */
export function takeOpportunity(
  instance: OpportunityInstance,
  passage: Passage
): OpportunityInstance {
  if (instance.status !== 'presented') {
    throw new Error(`Opportunity ${instance.id} is ${instance.status}, not presented`);
  }
  if (passage.attemptId !== instance.attemptId) {
    throw new Error(`Passage ${passage.id} belongs to a different attempt`);
  }
  if (passage.speaker !== 'user' || passage.status !== 'final') {
    throw new Error('A taken opportunity requires a final learner passage');
  }
  if (instance.eligibleModalities && !instance.eligibleModalities.includes(passage.modality)) {
    throw new Error(`Opportunity ${instance.id} does not accept ${passage.modality} delivery`);
  }

  return {
    ...instance,
    status: 'taken',
    learnerAttemptPassageId: passage.id,
    learnerAttemptRevision: passage.revisionKey,
    observedModality: passage.modality,
  };
}

/**
 * Apply an assessor classification only after a real taken opportunity exists.
 * The evidence validator still decides whether any resulting observation/lapse is
 * admissible.
 */
export function classifyOpportunity(
  instance: OpportunityInstance,
  demonstration: SkillDemonstration
): OpportunityInstance {
  if (instance.status !== 'taken') {
    throw new Error(`Opportunity ${instance.id} must be taken before classification`);
  }
  return { ...instance, demonstration };
}

export function declineOpportunity(instance: OpportunityInstance): OpportunityInstance {
  if (instance.status !== 'presented') {
    throw new Error(`Opportunity ${instance.id} is ${instance.status}, not presented`);
  }
  return { ...instance, status: 'declined', demonstration: 'unknown' };
}

/**
 * At attempt end, materialise authored definitions that were never reachable as
 * `not_presented`. This is useful audit provenance and is explicitly not a
 * weakness signal.
 */
export function finalizeNotPresentedOpportunities(input: {
  scene: SceneDefinition;
  state: SceneStateSnapshot;
  existing: OpportunityInstance[];
  recordedAt: string;
}): OpportunityInstance[] {
  const byDefinition = new Map(
    input.existing
      .filter(instance => instance.attemptId === input.state.attemptId)
      .map(instance => [instance.opportunityId, instance])
  );
  const next = [...input.existing];

  for (const definition of input.scene.opportunityDefinitions) {
    if (byDefinition.has(definition.id)) continue;
    next.push({
      id: opportunityInstanceId(input.state.attemptId, definition.id),
      attemptId: input.state.attemptId,
      opportunityId: definition.id,
      skillId: definition.skillId,
      assessedChannel: definition.assessedChannel,
      evidenceBand: definition.evidenceBand,
      eligibleModalities: definition.eligibleModalities,
      status: 'not_presented',
      detection: 'validated',
      demonstration: 'unknown',
      recordedAt: input.recordedAt,
    });
  }

  return next;
}

export function opportunityInstanceId(attemptId: string, opportunityId: string): string {
  return `opportunity:${attemptId}:${opportunityId}`;
}


export interface OpportunityAssessmentCandidate {
  opportunityInstanceId?: string;
  sourcePassageId: string;
  sourceRevision: string;
}

/**
 * Build a temporary assessment view in which model-proposed links can be checked
 * by the deterministic evidence validator.
 *
 * Nothing returned here should be persisted directly. A proposal may be wrong;
 * only `commitValidatedOpportunityDemonstrations` turns accepted observations
 * into durable opportunity state.
 */
export function prepareOpportunityAssessmentView(input: {
  existing: OpportunityInstance[];
  candidates: OpportunityAssessmentCandidate[];
  passages: Passage[];
}): OpportunityInstance[] {
  const candidatesByOpportunity = new Map(
    input.candidates
      .filter(candidate => Boolean(candidate.opportunityInstanceId))
      .map(candidate => [candidate.opportunityInstanceId as string, candidate])
  );
  const passagesById = new Map(input.passages.map(passage => [passage.id, passage]));

  return input.existing.map(instance => {
    const candidate = candidatesByOpportunity.get(instance.id);
    if (!candidate || instance.status !== 'presented' || instance.detection !== 'validated') {
      return instance;
    }

    const passage = passagesById.get(candidate.sourcePassageId);
    if (
      !passage ||
      passage.revisionKey !== candidate.sourceRevision ||
      passage.attemptId !== instance.attemptId ||
      passage.speaker !== 'user' ||
      passage.status !== 'final' ||
      (instance.eligibleModalities && !instance.eligibleModalities.includes(passage.modality))
    ) {
      return instance;
    }

    return classifyOpportunity(takeOpportunity(instance, passage), 'demonstrated');
  });
}

/**
 * Commit only opportunity demonstrations that survived evidence validation.
 * Rejected assessor proposals leave the original runtime opportunity untouched.
 */
export function commitValidatedOpportunityDemonstrations(input: {
  existing: OpportunityInstance[];
  validated: Array<{
    opportunityInstanceId?: string;
    sourcePassageId: string;
    sourceRevision: string;
  }>;
  passages: Passage[];
}): OpportunityInstance[] {
  const acceptedByOpportunity = new Map(
    input.validated
      .filter(item => Boolean(item.opportunityInstanceId))
      .map(item => [item.opportunityInstanceId as string, item])
  );
  const passagesById = new Map(input.passages.map(passage => [passage.id, passage]));

  return input.existing.map(instance => {
    const accepted = acceptedByOpportunity.get(instance.id);
    if (!accepted || instance.status !== 'presented') return instance;

    const passage = passagesById.get(accepted.sourcePassageId);
    if (
      !passage ||
      passage.revisionKey !== accepted.sourceRevision ||
      passage.attemptId !== instance.attemptId ||
      passage.speaker !== 'user' ||
      passage.status !== 'final' ||
      (instance.eligibleModalities && !instance.eligibleModalities.includes(passage.modality))
    ) {
      return instance;
    }

    return classifyOpportunity(takeOpportunity(instance, passage), 'demonstrated');
  });
}
