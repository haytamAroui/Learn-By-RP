/**
 * Shared contracts between the client and the backend.
 *
 * The client validates against these; the server produces against them. One
 * definition, so a shape drift is a type error rather than a runtime surprise.
 * Bump SCENE_CONTRACT_VERSION when a shape changes incompatibly.
 */

export const SCENE_CONTRACT_VERSION = 1;

/** Allowlisted action names. Anything else is rejected without being evaluated. */
export type SceneActionName =
  | 'confirm_order_item'
  | 'offer_alternative'
  | 'confirm_takeaway'
  | 'confirm_for_here'
  | 'ask_about_ingredient'
  | 'complete_scene';

/** Who may propose or trigger an action. */
export type SceneActionActor = 'character' | 'director';

export type Predicate =
  /** A fact must be present and truthy. */
  | { fact: string }
  /** A fact must be absent or falsy. */
  | { notFact: string }
  /** A fact must equal a value. */
  | { fact: string; equals: unknown }
  /** Every listed predicate must hold. */
  | { all: Predicate[] }
  /** At least one listed predicate must hold. */
  | { any: Predicate[] };

export type Mutation =
  /** Set a fact to a payload field, defaulting when the field is absent. */
  | { set: string; from?: string; default?: unknown }
  /** Remove a fact. */
  | { unset: string }
  /** Merge a payload object into a fact object, keeping existing sibling keys. */
  | { merge: string; from?: string }
  /** Set a dotted path inside a fact object, e.g. "order.item". */
  | { setPath: string; from?: string; default?: unknown };

export interface AllowedAction {
  name: SceneActionName;
  actor: SceneActionActor;
  description: string;
  /** Every predicate must hold before the action may be applied. */
  preconditions: Predicate[];
  /** The only fact changes this action is permitted to make. */
  effects: Mutation[];
}

/** A field-level shape check, deliberately smaller than JSON Schema. */
export interface PayloadSchema {
  type: 'object';
  required: string[];
  properties: Record<
    string,
    { type: 'string' | 'number' | 'boolean' | 'object' | 'array'; enum?: unknown[] }
  >;
  additionalProperties: boolean;
}

export interface CompletionPredicate {
  name: 'achieved' | 'partial';
  predicate: Predicate;
}

export interface Complication {
  id: string;
  description: string;
  /** Facts that make this complication available. */
  trigger: Predicate;
  /** Authored complications fire at most once, and never more than this many. */
  maxPerScene: 1;
  practiceVariation?: boolean;
}

export interface SceneDefinition {
  id: string;
  version: number;
  missionId: string;
  language: string;
  characters: Array<{
    id: string;
    name: string;
    role: string;
    voiceStyle: string;
    knowledgeBoundary: string[];
    /** What this character may know about scenes the learner has not reached. */
    mayKnowAboutPriorScenes: string[];
  }>;
  initialFacts: Record<string, unknown>;
  learnerKnows: string[];
  characterKnows: Record<string, string[]>;
  allowedActions: AllowedAction[];
  actionSchemas: Record<string, PayloadSchema>;
  complication?: Complication;
  completion: CompletionPredicate[];
  checkpoints: Array<{ id: string; description: string; after: Predicate }>;
  /** Curated mappings only. Never model-generated. */
  phraseIds: string[];
  skillIds: string[];
  reviewStatus: 'draft' | 'reviewed' | 'released';
}

/**
 * What the client or the model proposes. The reducer decides.
 */
export interface SceneActionProposal {
  actionId: string;
  sessionId: string;
  attemptId: string;
  expectedSceneRevision: number;
  action: string;
  payload: unknown;
  sourceTurnIds: string[];
}

export interface SceneActionResult {
  actionId: string;
  accepted: boolean;
  /** Present on rejection, and always accompanied by what is still possible. */
  reason?: string;
  permissibleOptions?: SceneActionName[];
  newFacts: Record<string, unknown>;
  revision: number;
  /** True when this actionId had already been applied; the prior result is returned. */
  deduplicated: boolean;
  appliedAt: string;
}

export interface SceneStateSnapshot {
  sceneId: string;
  sessionId: string;
  attemptId: string;
  revision: number;
  facts: Record<string, unknown>;
  checkpoints: Array<{ id: string; description: string; timestamp: string }>;
  isFinished: boolean;
  outcome: 'achieved' | 'partial' | 'not_achieved' | 'unknown';
  firedComplications: string[];
}

export interface SceneForkRequest {
  checkpointId: string;
  /** Set when the learner already saw the answer, so the attempt is rehearsal. */
  rehearsal: boolean;
}

export interface SceneForkResult {
  attemptId: string;
  parentAttemptId: string;
  checkpointId: string;
  rehearsal: boolean;
  /** Transcripts after the checkpoint that the earlier attempt still owns. */
  supersededTurnIds: string[];
}
