/**
 * Scene reducer: the only component allowed to change scene facts.
 *
 * Checks, in order: session ownership · allowlist (by mission version) · payload
 * schema · preconditions · expected scene revision. A duplicate `actionId`
 * returns the prior result rather than applying the transition twice.
 *
 * A rejected action returns a reason and the actions that are still permissible.
 * Actor speech cannot override a rejection.
 */

import {
  AllowedAction,
  Mutation,
  Predicate,
  PayloadSchema,
  SceneActionProposal,
  SceneActionName,
  SceneActionResult,
  SceneDefinition,
  SceneStateSnapshot,
  SCENE_CONTRACT_VERSION,
} from '../../contracts/scene';

export function createInitialScene(
  scene: SceneDefinition,
  sessionId: string,
  attemptId: string
): SceneStateSnapshot {
  return {
    sceneId: scene.id,
    sessionId,
    attemptId,
    revision: 1,
    facts: { ...scene.initialFacts },
    checkpoints: [],
    isFinished: false,
    outcome: 'unknown',
    firedComplications: [],
  };
}

// ------------------------------------------------------------------ predicates

export function evaluatePredicate(predicate: Predicate, facts: Record<string, unknown>): boolean {
  if ('all' in predicate) {
    return predicate.all.every(child => evaluatePredicate(child, facts));
  }
  if ('any' in predicate) {
    return predicate.any.some(child => evaluatePredicate(child, facts));
  }
  if ('notFact' in predicate) {
    return !truthy(facts[predicate.notFact]);
  }
  if ('equals' in predicate) {
    return facts[predicate.fact] === predicate.equals;
  }
  if ('fact' in predicate) {
    return truthy(facts[predicate.fact]);
  }
  return false;
}

function truthy(value: unknown): boolean {
  return value !== undefined && value !== null && value !== false && value !== '';
}

// ------------------------------------------------------------------- mutations

function applyMutation(
  mutation: Mutation,
  facts: Record<string, unknown>,
  payload: Record<string, unknown>
): Record<string, unknown> {
  if ('set' in mutation) {
    const from = mutation.from;
    const value = from && from in payload ? payload[from] : mutation.default;
    return { ...facts, [mutation.set]: value };
  }
  if ('unset' in mutation) {
    const next = { ...facts };
    delete next[mutation.unset];
    return next;
  }
  if ('merge' in mutation) {
    const from = mutation.from;
    // `merge: 'order'` with no `from` merges the whole payload into the fact.
    // With `from: 'item'`, the payload's `item` object is merged into it, so
    // sibling keys on the target survive an update.
    const incoming =
      from && from in payload
        ? (payload[from] as Record<string, unknown>)
        : (payload as Record<string, unknown>);

    if (typeof incoming !== 'object' || incoming === null || Array.isArray(incoming)) {
      return { ...facts, [mutation.merge]: incoming };
    }

    const existing = facts[mutation.merge];
    const base =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? (existing as Record<string, unknown>)
        : {};
    return { ...facts, [mutation.merge]: { ...base, ...incoming } };
  }
  if ('setPath' in mutation) {
    const segments = mutation.setPath.split('.');
    const leaf = segments.pop();
    if (!leaf) return facts;

    const from = mutation.from;
    const value = from && from in payload ? payload[from] : mutation.default;

    const root = segments[0];
    const existing = facts[root];
    const base =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? (existing as Record<string, unknown>)
        : {};

    // Rebuild the nested path, cloning only the nodes along it.
    let nested: Record<string, unknown> = { ...base, [leaf]: value };
    for (let i = segments.length - 1; i >= 1; i -= 1) {
      nested = { [segments[i - 1]]: nested };
    }
    return { ...facts, [root]: nested };
  }
  return facts;
}

// --------------------------------------------------------------------- schema

export function validatePayload(
  schema: PayloadSchema | undefined,
  payload: unknown
): { valid: boolean; reason?: string } {
  if (!schema) {
    return { valid: true };
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { valid: false, reason: 'Payload must be an object' };
  }

  const record = payload as Record<string, unknown>;

  for (const field of schema.required) {
    if (!(field in record) || record[field] === undefined || record[field] === null) {
      return { valid: false, reason: `Payload is missing required field "${field}"` };
    }
  }

  for (const [field, rule] of Object.entries(schema.properties)) {
    if (!(field in record)) continue;
    const value = record[field];

    if (rule.enum && !rule.enum.includes(value)) {
      return {
        valid: false,
        reason: `Field "${field}" must be one of: ${rule.enum.join(', ')}`,
      };
    }

    const actualType = Array.isArray(value) ? 'array' : typeof value;
    const expected = rule.type === 'array' ? 'object' : rule.type;
    if (expected === 'object' && actualType !== 'object') {
      return { valid: false, reason: `Field "${field}" must be a ${rule.type}` };
    }
    if (expected !== 'object' && actualType !== expected) {
      return { valid: false, reason: `Field "${field}" must be a ${rule.type}` };
    }
  }

  if (!schema.additionalProperties) {
    const allowed = new Set(Object.keys(schema.properties));
    const extra = Object.keys(record).filter(key => !allowed.has(key));
    if (extra.length > 0) {
      return { valid: false, reason: `Payload has unsupported field(s): ${extra.join(', ')}` };
    }
  }

  return { valid: true };
}

/** Actions whose preconditions currently hold. Returned with every rejection. */
export function permissibleOptions(
  scene: SceneDefinition,
  facts: Record<string, unknown>
): SceneActionName[] {
  return scene.allowedActions
    .filter(action => action.preconditions.every(predicate => evaluatePredicate(predicate, facts)))
    .map(action => action.name);
}

// --------------------------------------------------------------------- reducer

export interface ReducerInput {
  scene: SceneDefinition;
  state: SceneStateSnapshot;
  proposal: SceneActionProposal;
  /** Prior results keyed by actionId, for idempotency. */
  appliedResults?: Map<string, SceneActionResult>;
}

export function reduceSceneAction(input: ReducerInput): SceneActionResult {
  const { scene, state, proposal, appliedResults } = input;

  // 1. Session ownership. A proposal naming another session is never evaluated.
  if (proposal.sessionId !== state.sessionId) {
    return reject(state, proposal.actionId, 'Proposal does not belong to this session', scene, appliedResults);
  }
  if (proposal.attemptId !== state.attemptId) {
    return reject(
      state,
      proposal.actionId,
      'Proposal belongs to a different attempt; fork the scene before retrying',
      scene,
      appliedResults
    );
  }

  // 2. Idempotency. A repeated request returns the original outcome rather than
  //    applying the transition a second time.
  const prior = appliedResults?.get(proposal.actionId);
  if (prior) {
    return { ...prior, deduplicated: true };
  }

  // 3. Allowlist, by this scene version.
  const action: AllowedAction | undefined = scene.allowedActions.find(
    candidate => candidate.name === proposal.action
  );
  if (!action) {
    return reject(state, proposal.actionId, `Action "${proposal.action}" is not permitted in this scene`, scene, appliedResults);
  }

  // 4. Payload schema.
  const schemaCheck = validatePayload(scene.actionSchemas[action.name], proposal.payload);
  if (!schemaCheck.valid) {
    return reject(state, proposal.actionId, schemaCheck.reason ?? 'Invalid payload', scene, appliedResults);
  }

  // 5. Expected revision. A stale proposal triggers reconciliation rather than
  //    silently overwriting newer state.
  if (proposal.expectedSceneRevision !== state.revision) {
    return reject(
      state,
      proposal.actionId,
      `Stale scene revision: expected ${proposal.expectedSceneRevision}, current is ${state.revision}`,
      scene,
      appliedResults
    );
  }

  // 6. Preconditions.
  const failed = action.preconditions.find(
    predicate => !evaluatePredicate(predicate, state.facts)
  );
  if (failed) {
    return reject(
      state,
      proposal.actionId,
      `Precondition not met for "${action.name}"`,
      scene,
      appliedResults
    );
  }

  const payload = (proposal.payload ?? {}) as Record<string, unknown>;
  let facts = state.facts;
  for (const mutation of action.effects) {
    facts = applyMutation(mutation, facts, payload);
  }

  return {
    actionId: proposal.actionId,
    accepted: true,
    newFacts: facts,
    revision: state.revision + 1,
    deduplicated: false,
    appliedAt: new Date().toISOString(),
  };
}

function reject(
  state: SceneStateSnapshot,
  actionId: string,
  reason: string,
  scene: SceneDefinition,
  appliedResults?: Map<string, SceneActionResult>
): SceneActionResult {
  return {
    actionId,
    accepted: false,
    reason,
    permissibleOptions: permissibleOptions(scene, state.facts),
    newFacts: state.facts,
    revision: state.revision,
    deduplicated: false,
    appliedAt: new Date().toISOString(),
  };
}

export function evaluateCompletion(
  scene: SceneDefinition,
  facts: Record<string, unknown>
): SceneStateSnapshot['outcome'] {
  const achieved = scene.completion.find(entry => entry.name === 'achieved');
  if (achieved && evaluatePredicate(achieved.predicate, facts)) {
    return 'achieved';
  }
  const partial = scene.completion.find(entry => entry.name === 'partial');
  if (partial && evaluatePredicate(partial.predicate, facts)) {
    return 'partial';
  }
  return 'unknown';
}

/**
 * Applies an accepted result to produce the next authoritative state.
 *
 * Takes the scene because the result carries facts and a revision but not the
 * checkpoint list, which is derived from the scene definition. Recomputing here
 * keeps the client mirror and the server identical instead of letting the two
 * drift by whatever the result happened to include.
 */
export function applyResult(
  scene: SceneDefinition,
  state: SceneStateSnapshot,
  result: SceneActionResult
): SceneStateSnapshot {
  if (!result.accepted) return state;

  const facts = result.newFacts;
  const outcome = evaluateCompletion(scene, facts);

  const checkpoints = [...state.checkpoints];
  for (const checkpoint of scene.checkpoints) {
    if (checkpoints.some(existing => existing.id === checkpoint.id)) continue;
    if (evaluatePredicate(checkpoint.after, facts)) {
      checkpoints.push({
        id: checkpoint.id,
        description: checkpoint.description,
        timestamp: result.appliedAt,
      });
    }
  }

  return {
    ...state,
    facts,
    revision: result.revision,
    outcome,
    isFinished: outcome === 'achieved' || outcome === 'partial',
    checkpoints,
  };
}

export { SCENE_CONTRACT_VERSION };
