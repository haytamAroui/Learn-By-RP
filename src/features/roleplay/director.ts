import {
  CommunicationChallengeType,
  PressureVariantKind,
  RoleplayPressureLevel,
  SceneDefinition,
  SceneStateSnapshot,
} from '../../contracts/scene';
import { OpportunityInstance } from '../../types';
import { evaluatePredicate } from './sceneReducer';

export type DirectorDecision =
  | {
      kind: 'trigger_complication';
      complicationId: string;
      reason: 'authored_trigger_true';
    }
  | {
      kind: 'present_communication_challenge';
      challengeId: string;
      challengeType: CommunicationChallengeType;
      opportunityId: string;
      skillId: string;
      actorInstruction: string;
      reason: 'authored_communication_challenge_available';
    }
  | {
      kind: 'present_opportunity';
      opportunityId: string;
      skillId: string;
      reason: 'authored_opportunity_available';
    }
  | {
      kind: 'present_pressure_branch';
      pressureBranchId: string;
      variantKind: PressureVariantKind;
      pressureLevel: RoleplayPressureLevel;
      actorInstruction: string;
      reason: 'authored_pressure_branch_available';
    }
  | {
      kind: 'prepare_completion';
      reason: 'scene_partial_or_achieved';
    }
  | {
      kind: 'none';
      reason: 'no_authored_directive';
    };

/**
 * Deterministic Director V1.
 *
 * It may select only authored content already present in the scene definition.
 * It cannot mutate facts, create evidence, invent skill IDs, or interpret free
 * text. Semantic interpretation belongs to a separate bounded candidate layer.
 *
 * Communication challenges are additionally gated by negotiated provider
 * capability types and optional target repair skill. At most one authored
 * communication challenge is selected per attempt.
 */
export function decideDirector(input: {
  scene: SceneDefinition;
  state: SceneStateSnapshot;
  opportunities: OpportunityInstance[];
  availableCommunicationChallenges?: readonly CommunicationChallengeType[];
  targetChallengeSkillId?: string;
  pressurePolicy?: {
    enabled: boolean;
    allowedLevels: readonly RoleplayPressureLevel[];
    allowedVariantKinds?: readonly PressureVariantKind[];
  };
}): DirectorDecision {
  const {
    scene,
    state,
    opportunities,
    availableCommunicationChallenges = [],
    targetChallengeSkillId,
    pressurePolicy,
  } = input;

  if (state.sceneId !== scene.id) {
    throw new Error(
      `Director scene mismatch: state=${state.sceneId}, definition=${scene.id}`
    );
  }

  const complication = scene.complication;
  if (
    complication &&
    !state.firedComplications.includes(complication.id) &&
    evaluatePredicate(
      complication.trigger,
      state.facts,
      state.actionCounts
    )
  ) {
    return {
      kind: 'trigger_complication',
      complicationId: complication.id,
      reason: 'authored_trigger_true',
    };
  }

  const attemptOpportunities = opportunities.filter(
    instance => instance.attemptId === state.attemptId
  );
  const alreadyMaterialised = new Set(
    attemptOpportunities.map(instance => instance.opportunityId)
  );
  const challengeOpportunityIds = new Set(
    scene.communicationChallenges.map(challenge => challenge.opportunityId)
  );
  const challengeAlreadyPresented = attemptOpportunities.some(instance =>
    challengeOpportunityIds.has(instance.opportunityId)
  );

  if (!challengeAlreadyPresented && availableCommunicationChallenges.length > 0) {
    const allowedTypes = new Set(availableCommunicationChallenges);
    for (const challenge of scene.communicationChallenges) {
      if (!allowedTypes.has(challenge.type)) continue;
      if (
        targetChallengeSkillId &&
        challenge.targetSkillId !== targetChallengeSkillId
      ) {
        continue;
      }
      if (alreadyMaterialised.has(challenge.opportunityId)) continue;
      if (
        !evaluatePredicate(
          challenge.trigger,
          state.facts,
          state.actionCounts
        )
      ) {
        continue;
      }

      return {
        kind: 'present_communication_challenge',
        challengeId: challenge.id,
        challengeType: challenge.type,
        opportunityId: challenge.opportunityId,
        skillId: challenge.targetSkillId,
        actorInstruction: challenge.actorInstruction,
        reason: 'authored_communication_challenge_available',
      };
    }
  }

  for (const definition of scene.opportunityDefinitions) {
    if (definition.communicationChallengeId) continue;
    if (alreadyMaterialised.has(definition.id)) continue;
    if (
      evaluatePredicate(
        definition.sceneCondition,
        state.facts,
        state.actionCounts
      )
    ) {
      return {
        kind: 'present_opportunity',
        opportunityId: definition.id,
        skillId: definition.skillId,
        reason: 'authored_opportunity_available',
      };
    }
  }

  if (pressurePolicy?.enabled) {
    const allowedLevels = new Set(pressurePolicy.allowedLevels);
    const allowedKinds = pressurePolicy.allowedVariantKinds
      ? new Set(pressurePolicy.allowedVariantKinds)
      : null;

    for (const branch of scene.pressureBranches) {
      if (!allowedLevels.has(branch.level)) continue;
      if (allowedKinds && !allowedKinds.has(branch.variantKind)) continue;
      if (
        !evaluatePredicate(
          branch.trigger,
          state.facts,
          state.actionCounts
        )
      ) {
        continue;
      }

      return {
        kind: 'present_pressure_branch',
        pressureBranchId: branch.id,
        variantKind: branch.variantKind,
        pressureLevel: branch.level,
        actorInstruction: branch.actorInstruction,
        reason: 'authored_pressure_branch_available',
      };
    }
  }

  if (state.outcome === 'partial' || state.outcome === 'achieved') {
    return {
      kind: 'prepare_completion',
      reason: 'scene_partial_or_achieved',
    };
  }

  return { kind: 'none', reason: 'no_authored_directive' };
}

export interface SemanticDirectorCandidate {
  intentId?: string;
  confidence?: number;
  unknown: boolean;
}

/**
 * AI may propose a semantic candidate, but unknown can never mutate scene state.
 * This helper deliberately returns no executable decision.
 */
export function acceptSemanticCandidate(
  candidate: SemanticDirectorCandidate
): { accepted: false; reason: 'unknown_or_non_executable' } {
  void candidate;
  return { accepted: false, reason: 'unknown_or_non_executable' };
}


/**
 * Runtime events visible to the Director cadence gate.
 *
 * Low-level transport progress is represented explicitly so the gate can reject
 * it deterministically rather than relying on callers to remember which callbacks
 * are safe. Only completed semantic/scene boundaries may run the Director.
 */
export type DirectorRuntimeEvent =
  | { type: 'learner_turn_completed'; turnId: string }
  | { type: 'actor_turn_completed'; turnId: string }
  | { type: 'scene_action_accepted'; actionId: string }
  | { type: 'opportunity_resolved'; opportunityInstanceId: string }
  | { type: 'checkpoint_restored'; checkpointId: string }
  | { type: 'audio_level' }
  | { type: 'interim_transcript' }
  | { type: 'response_text_delta' };

const DIRECTOR_BOUNDARY_EVENTS = new Set<DirectorRuntimeEvent['type']>([
  'learner_turn_completed',
  'actor_turn_completed',
  'scene_action_accepted',
  'opportunity_resolved',
  'checkpoint_restored',
]);

export function isDirectorBoundaryEvent(event: DirectorRuntimeEvent): boolean {
  return DIRECTOR_BOUNDARY_EVENTS.has(event.type);
}

/**
 * Event/turn-driven cadence for deterministic Director V1.
 *
 * One authoritative scene revision is evaluated at most once per attempt. Audio
 * frames, interim ASR and streaming text deltas never consume a cadence slot and
 * never call decideDirector().
 */
export class DirectorCadence {
  private readonly evaluatedRevisions = new Set<string>();
  private readonly emittedDirectives = new Set<string>();

  evaluate(input: {
    event: DirectorRuntimeEvent;
    scene: SceneDefinition;
    state: SceneStateSnapshot;
    opportunities: OpportunityInstance[];
    availableCommunicationChallenges?: readonly CommunicationChallengeType[];
    targetChallengeSkillId?: string;
    pressurePolicy?: {
      enabled: boolean;
      allowedLevels: readonly RoleplayPressureLevel[];
      allowedVariantKinds?: readonly PressureVariantKind[];
    };
  }): DirectorDecision | null {
    if (!isDirectorBoundaryEvent(input.event)) return null;

    const revisionKey =
      `${input.state.attemptId}:${input.state.revision}`;
    if (this.evaluatedRevisions.has(revisionKey)) return null;
    this.evaluatedRevisions.add(revisionKey);

    const decision = decideDirector({
      scene: input.scene,
      state: input.state,
      opportunities: input.opportunities,
      availableCommunicationChallenges:
        input.availableCommunicationChallenges,
      targetChallengeSkillId: input.targetChallengeSkillId,
      pressurePolicy: input.pressurePolicy,
    });

    const directiveKey =
      decision.kind === 'trigger_complication'
        ? `complication:${decision.complicationId}`
        : decision.kind === 'present_communication_challenge'
          ? `challenge:${decision.challengeId}`
          : decision.kind === 'present_opportunity'
            ? `opportunity:${decision.opportunityId}`
            : decision.kind === 'present_pressure_branch'
              ? `pressure:${decision.pressureBranchId}`
              : decision.kind === 'prepare_completion'
                ? 'completion'
                : null;

    if (directiveKey) {
      const attemptDirectiveKey =
        `${input.state.attemptId}:${directiveKey}`;
      if (this.emittedDirectives.has(attemptDirectiveKey)) return null;
      this.emittedDirectives.add(attemptDirectiveKey);
    }

    return decision;
  }

  resetAttempt(attemptId: string): void {
    for (const key of [...this.evaluatedRevisions]) {
      if (key.startsWith(`${attemptId}:`)) {
        this.evaluatedRevisions.delete(key);
      }
    }
    for (const key of [...this.emittedDirectives]) {
      if (key.startsWith(`${attemptId}:`)) {
        this.emittedDirectives.delete(key);
      }
    }
  }
}
