import { SceneDefinition, SceneStateSnapshot } from '../../contracts/scene';
import { OpportunityInstance } from '../../types';
import { evaluatePredicate } from './sceneReducer';

export type DirectorDecision =
  | {
      kind: 'trigger_complication';
      complicationId: string;
      reason: 'authored_trigger_true';
    }
  | {
      kind: 'present_opportunity';
      opportunityId: string;
      skillId: string;
      reason: 'authored_opportunity_available';
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
 */
export function decideDirector(input: {
  scene: SceneDefinition;
  state: SceneStateSnapshot;
  opportunities: OpportunityInstance[];
}): DirectorDecision {
  const { scene, state, opportunities } = input;

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

  const alreadyMaterialised = new Set(
    opportunities
      .filter(instance => instance.attemptId === state.attemptId)
      .map(instance => instance.opportunityId)
  );

  for (const definition of scene.opportunityDefinitions) {
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
