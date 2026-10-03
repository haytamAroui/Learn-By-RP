/**
 * Shared contracts between the client and the backend.
 *
 * The client validates against these; the server produces against them. One
 * definition, so a shape drift is a type error rather than a runtime surprise.
 * Bump SCENE_CONTRACT_VERSION when a shape changes incompatibly.
 */

export const SCENE_CONTRACT_VERSION = 7;

/** Allowlisted action names. Anything else is rejected without being evaluated. */
export type SceneActionName =
  | 'confirm_order_item'
  | 'offer_alternative'
  | 'offer_substitute'
  | 'confirm_takeaway'
  | 'confirm_for_here'
  | 'ask_about_ingredient'
  | 'provide_reference'
  | 'ask_specification'
  | 'propose_arrangement'
  | 'confirm_arrangement'
  | 'ask_wayfinding'
  | 'report_issue'
  | 'request_service'
  | 'request_substitute'
  | 'request_seating'
  | 'ask_recommendation'
  | 'confirm_selection'
  | 'complete_scene';

/** Who may propose or trigger an action. */
export type SceneActionActor = 'character' | 'director';

export type SceneFactValue = boolean | string | number;

export type SceneFactDefinition =
  | { type: 'boolean' }
  | { type: 'enum'; values: string[] }
  | { type: 'bounded_integer'; min: number; max: number };

export type SceneFactSchema = Record<string, SceneFactDefinition>;

export type Predicate =
  | { op: 'eq'; fact: string; value: SceneFactValue }
  | { op: 'neq'; fact: string; value: SceneFactValue }
  | { op: 'in'; fact: string; values: SceneFactValue[] }
  | { op: 'and'; predicates: Predicate[] }
  | { op: 'or'; predicates: Predicate[] }
  | { op: 'not'; predicate: Predicate }
  | { op: 'exists'; fact: string }
  | { op: 'lte'; fact: string; value: number }
  | { op: 'gte'; fact: string; value: number }
  | {
      op: 'countOf';
      action: SceneActionName;
      comparator: 'eq' | 'lte' | 'gte';
      value: number;
    };

/**
 * Finite scene effect language.
 *
 * Free-form payload values are deliberately not writable into facts. Payloads
 * may contain natural-language details for the actor/event log, while the
 * authoritative state changes only through finite authored values.
 */
export type Mutation = {
  set: string;
  value: SceneFactValue;
};

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

/**
 * Authored chance to demonstrate exactly one communicative skill.
 *
 * Opportunity availability comes only from deterministic scene facts. Semantic
 * interpretation may later classify what the learner did with the opportunity,
 * but it may never invent the opportunity itself.
 */
export type CommunicationChallengeType =
  | 'fast_speech'
  | 'unknown_word'
  | 'unclear_detail'
  | 'scripted_mishearing'
  | 'unexpected_followup';

export type RoleplayPressureLevel = 'manageable' | 'standard' | 'stretch';

/** Reviewed speech variety. The runtime may realize the label, never invent it. */
export type SpeechVariety = 'standard' | 'light_colloquial' | 'colloquial';

export type PressureVariantKind =
  | 'faster_speech'
  | 'more_concise'
  | 'one_interruption'
  | 'unexpected_followup'
  | 'time_pressure';

export interface SkillOpportunityDefinition {
  /** Stable content id; never reuse a retired id for a different challenge. */
  id: string;
  /** Exactly one most-specific communicative skill. */
  skillId: string;
  /** Facts that make this opportunity available to the learner. */
  sceneCondition: Predicate;
  /** Reviewer examples for assessor guidance; never executable scene logic. */
  positiveExamples: string[];
  negativeExamples: string[];
  /** Authored world actions that can satisfy or advance this opportunity. */
  relevantActionIds?: SceneActionName[];
  /** Mission/actor semantic intents relevant to this opportunity. */
  relevantIntentIds?: string[];
  /**
   * Explicit authored repair challenge that owns presentation of this
   * opportunity. Challenge-linked opportunities are never auto-presented from
   * scene facts alone.
   */
  communicationChallengeId?: string;
}

/**
 * Deliberate, opt-in communication variation that creates a repair opportunity.
 *
 * A challenge is content, not evidence. It may make an opportunity available,
 * but only a real learner passage linked to the resulting OpportunityInstance
 * can establish a demonstration or lapse.
 */
export interface CommunicationChallengeDefinition {
  /** Stable reviewed content id. */
  id: string;
  type: CommunicationChallengeType;
  /** Exactly one most-specific repair child skill. */
  targetSkillId: string;
  /** Opportunity presented only after this challenge is actually delivered. */
  opportunityId: string;
  /** Authoritative scene state in which the challenge may be offered. */
  trigger: Predicate;
  /** Reviewed actor/director instruction; not learner evidence. */
  actorInstruction: string;
  /** Repair practice is explicit and may never be sprung on the learner. */
  requiresLearnerOptIn: true;
  /** Skipping the twist has no learning penalty. */
  skippable: true;
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

/**
 * Optional authored conversation-pressure variation.
 *
 * Pressure is never model-generated and never creates a new context identity.
 * Branches are opt-in/skippable content instructions; they do not mutate facts
 * or create learning evidence by themselves.
 */
export interface PressureBranchDefinition {
  id: string;
  variantKind: PressureVariantKind;
  level: RoleplayPressureLevel;
  trigger: Predicate;
  actorInstruction: string;
  requiresLearnerOptIn: true;
  skippable: true;
}

export interface SceneDefinition {
  id: string;
  version: number;
  missionId: string;
  language: string;
  /** Reviewed production/comprehension variety; required by release validation for Dutch scenes. */
  speechVariety?: SpeechVariety;
  characters: Array<{
    id: string;
    name: string;
    role: string;
    voiceStyle: string;
    knowledgeBoundary: string[];
    /** What this character may know about scenes the learner has not reached. */
    mayKnowAboutPriorScenes: string[];
  }>;
  /** Finite declaration of every executable scene fact. */
  factSchema: SceneFactSchema;
  /** Must contain exactly the declared facts and valid finite values. */
  initialFacts: Record<string, SceneFactValue>;
  learnerKnows: string[];
  characterKnows: Record<string, string[]>;
  allowedActions: AllowedAction[];
  actionSchemas: Record<string, PayloadSchema>;
  complication?: Complication;
  /**
   * Authored repair variations. Director/provider execution is responsible for
   * delivering one selected compatible challenge; ordinary opportunity sync
   * must not manufacture these from scene facts.
   */
  communicationChallenges: CommunicationChallengeDefinition[];
  /** Reviewed optional pressure variants; empty means no pressure branch. */
  pressureBranches: PressureBranchDefinition[];
  completion: CompletionPredicate[];
  checkpoints: Array<{ id: string; description: string; after: Predicate }>;
  /** Curated mappings only. Never model-generated. */
  phraseIds: string[];
  skillIds: string[];
  /**
   * First-class authored communicative opportunities. Runtime instances are
   * derived from these definitions plus authoritative scene state.
   */
  opportunityDefinitions: SkillOpportunityDefinition[];
  reviewStatus: 'draft' | 'reviewed' | 'released';
}

/**
 * What the client or the model proposes. The reducer decides.
 */
export interface SceneActionProposal {
  actionId: string;
  sessionId: string;
  attemptId: string;
  /** Hosted-runtime identity pins. Required by HTTP/realtime ingress. */
  missionId?: string;
  missionVersion?: number;
  sceneId?: string;
  sceneVersion?: number;
  providerCallId?: string;
  connectionGeneration?: number;
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
  newFacts: Record<string, SceneFactValue>;
  /** Accepted action, used for deterministic countOf predicates. */
  appliedAction?: SceneActionName;
  revision: number;
  /** True when this actionId had already been applied; the prior result is returned. */
  deduplicated: boolean;
  appliedAt: string;
}

export interface SceneCheckpointSnapshot {
  id: string;
  description: string;
  timestamp: string;
  /** Authoritative revision at which the authored checkpoint became true. */
  sceneRevision: number;
}

export interface SceneStateSnapshot {
  sceneId: string;
  sessionId: string;
  attemptId: string;
  revision: number;
  facts: Record<string, SceneFactValue>;
  actionCounts: Partial<Record<SceneActionName, number>>;
  checkpoints: SceneCheckpointSnapshot[];
  isFinished: boolean;
  outcome: 'achieved' | 'partial' | 'not_achieved' | 'unknown';
  firedComplications: string[];
}

/**
 * Conversation-level checkpoint metadata supplied when a retry forks.
 *
 * Only the authored checkpoint id + authoritative scene revision may identify
 * world state. Passage/support positions are learner-history coordinates and are
 * deliberately not used to mutate scene truth.
 *
 * Semantic judgments (for example opportunity completion/demonstration) do not
 * belong in this contract. They are validated separately against transcript and
 * runtime opportunity records and may never become restore-point authority.
 */
export interface RoleplayCheckpoint {
  id: string;
  sceneRevision: number;
  passageIndex: number;
  /** Highest support-ledger position visible before the retry began. Never rewound. */
  supportLedgerHighWaterMark: number;
}

export interface SceneForkRequest {
  checkpoint: RoleplayCheckpoint;
  /** Set when the learner already saw the answer, so the attempt is rehearsal. */
  rehearsal: boolean;
}

export interface SceneForkResult {
  attemptId: string;
  parentAttemptId: string;
  checkpoint: RoleplayCheckpoint;
  rehearsal: boolean;
  /** Transcripts after the checkpoint that the earlier attempt still owns. */
  supersededTurnIds: string[];
}
