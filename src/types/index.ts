export type LanguageCode = 'es' | 'fr' | 'de' | 'it' | 'ja';

export type Mode = 'immersion' | 'guided' | 'focused';

export type RecallStatus = 'new' | 'supported' | 'growing' | 'steady';

export type Modality = 'spoken' | 'typed';

export type RetrievalType = 'assisted' | 'unassisted' | 'unknown';

/**
 * Evidence categories (§10.2). These are never collapsed into a single
 * "learned" flag: each says something different about what happened, and
 * `unknown` is a real answer rather than a failure to decide.
 */
export type EvidenceCategory =
  /** The phrase appeared in learner or assistant speech. */
  | 'encountered'
  /** Used after a hint, visible meaning, copied support, or recent modeling. */
  | 'assisted'
  /** Used or recalled with no recent modeling and no visible support. */
  | 'independent'
  /** Attempted in a cold opportunity but could not be retrieved or used. */
  | 'lapse'
  /** Original and corrected forms both retained, with provenance. */
  | 'corrected'
  /** Not enough evidence to say. Silence is not a lapse. */
  | 'unknown';

/** What the scene task itself achieved. Independent of learner ability. */
export type TaskOutcome = 'achieved' | 'partial' | 'not_achieved' | 'unknown';

export type SessionState =
  | 'preflight'
  | 'connecting'
  | 'live'
  | 'paused'
  | 'reconnecting'
  | 'ending'
  | 'ended'
  | 'recap_pending'
  | 'recap_ready'
  | 'recap_unavailable';

export interface CharacterDefinition {
  name: string;
  role: string;
  voiceStyle: string;
  personality: string;
  knowledgeBoundary: string[];
}

export interface AllowedAction {
  name: string;
  actor: 'character' | 'director';
  description: string;
  preconditions: string[];
  effects: string[];
}

export interface UsefulPhrase {
  id: string;
  form: string;
  meaning: string;
  usageNote: string;
  difficulty: 'beginner' | 'elementary' | 'intermediate';
}

export interface MissionDefinition {
  id: string;
  version: number;
  language: LanguageCode;
  /** The authored SceneDefinition this mission runs, if one is released. */
  sceneId?: string;
  /**
   * Reviewer-defined pedagogical context family.
   *
   * Transfer is counted across families, never across session ids or cosmetic
   * mission variants. Language/locale/pressure variants may share the same family.
   */
  scenarioFamilyId: string;
  /**
   * Skills this mission exists to practise. Explicit, curated membership.
   *
   * This is the only way a skill can gain validated evidence: the assessor may
   * not credit a skill the mission does not declare, which is what stops a model
   * from inventing competence out of any successful turn.
   */
  primarySkillIds: CommunicativeSkillId[];
  /** Exercised along the way, but not the point of the mission. */
  secondarySkillIds: CommunicativeSkillId[];
  levelRange: 'A1' | 'A2' | 'B1';
  title: string;
  category: 'cafes' | 'services' | 'transit' | 'lodging' | 'social' | 'problems';
  neighborhood: string;
  setting: string;
  aiRole: string;
  character: CharacterDefinition;
  learnerGoal: string;
  stretchGoal: string;
  targetIntents: string[];
  usefulPhrases: UsefulPhrase[];
  supportPolicy: {
    hintLadderAvailable: boolean;
    correctionStyle: 'gentle' | 'none' | 'after_turn';
    allowSlowing: boolean;
  };
  completionSignals: string[];
  estimatedMinutes: number;
  tags: string[];
  nextMissionId?: string;
  transferPattern?: string;
  transferReason?: string;
}

export interface SceneState {
  sceneId: string;
  revision: number;
  facts: Record<string, any>;
  learnerKnows: string[];
  characterKnows: string[];
  checkpoints: { id: string; description: string; timestamp: string }[];
  lastAction?: { name: string; actor: string; payload?: any };
  isFinished: boolean;
  outcome: TaskOutcome;
}

export interface SupportExposure {
  id: string;
  sessionId: string;
  attemptId: string;
  turnId?: string;
  source: 'briefing' | 'actor' | 'coach' | 'caption' | 'retry';
  kind: 'intent_hint' | 'meaning' | 'partial_form' | 'full_form' | 'repeat';
  targetItemIds: string[];
  exposure: 'visible' | 'played' | 'partial' | 'uncertain';
  recordedAt: string;
}

export interface Fragment {
  id: string;
  passageId: string;
  origin: 'asr' | 'typed' | 'assistant' | 'learner_edit';
  text: string;
  meaningVisible?: boolean;
}

export interface Passage {
  id: string;
  sessionId: string;
  attemptId: string;
  speaker: 'user' | 'assistant';
  revisionKey: string;
  assemblyVersion: number;
  status: 'partial' | 'final';
  text: string;
  meaning?: string;
  modality: Modality;
  audioUrl?: string;
  startedAt: string;
  endedAt?: string;
  fragments: Fragment[];
}

export interface LearningObservation {
  observationId: string;
  sessionId: string;
  attemptId: string;
  sourceTurnId: string;
  sourceRevision: string;
  itemId: string;
  candidateForm: string;
  meaning: string;
  quote: string;
  modality: Modality;
  retrieval: RetrievalType;
  taskOutcome: TaskOutcome;
  rehearsal: boolean;
  supportExposureIds: string[];
  recordedAt: string;
  hidden?: boolean;
  userDisputed?: boolean;
  /**
   * How this observation is filed (§10.2). Derived from retrieval, modality and
   * the exposure ledger, never from the model's own claim.
   */
  category?: EvidenceCategory;
  /** The learner's original wording, when it differed from the curated form. */
  originalForm?: string;
  /** The curated form, when the learner's own wording was corrected. */
  correctedForm?: string;
}

/**
 * A lemma or word, as distinct from a curated phrase (§10.1).
 *
 * A phrase cannot identify every request that uses a given verb, so lexical
 * coverage is tracked separately and never drives scheduling on its own.
 */
export interface LexicalItem {
  id: string;
  language: LanguageCode;
  lemma: string;
  meaning: string;
  /** Curated phrase ids that instantiate this lemma. */
  phraseIds: string[];
}

/** A curated communicative ability, observed across contexts (§10.1). */
export interface SkillItem {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Phrases or lemmas whose use evidences this skill. */
  evidencePhraseIds: string[];
  /** Sample phrasings, used to match observations to this skill. */
  samplePhrases: string[];
  /** Distinct mission ids this skill appears in. */
  associatedMissions: string[];
}

export interface SkillProjection {
  skillId: string;
  /** Distinct session-day pairs with evidence. */
  evidenceKeys: string[];
  contexts: string[];
  unassistedCount: number;
  /** Below the threshold, nothing is claimed beyond "emerging". */
  status: 'emerging' | 'demonstrated' | 'steady' | 'insufficient_evidence';
}

/**
 * A curated communicative skill id, e.g. `skill-communicative-repair`.
 *
 * Kept as a string alias rather than a union of the catalog: the catalog is
 * content that grows, and a closed union would make adding a skill a type error
 * in every file that switches on it. Uniqueness is enforced by the catalog test.
 */
export type CommunicativeSkillId = string;

export type DomainId = string;
export type ScenarioId = string;
export type ScenarioFamilyId = string;
export type ExamProgramId = string;
export type ExamTaskId = string;

/**
 * Stable pedagogical context identity for communicative-skill evidence.
 *
 * A new session, retry, locale variant or pressure variant is not a new context.
 * Transfer requires a different domain and/or reviewer-defined scenario family.
 */
export interface SkillContextKey {
  domainId: DomainId;
  scenarioFamilyId: ScenarioFamilyId;
  /** Informational provenance only; it does not create transfer credit by itself. */
  scenarioId?: ScenarioId;
  /** Exam tasks may supply a specific task id while still belonging to a family. */
  examTaskId?: ExamTaskId;
}

/**
 * How an observation came to exist.
 *
 * `validated_explicit` was proposed by the model and then accepted by the
 * deterministic validator against curated mission membership and the recorded
 * transcript. `legacy_inferred` was reconstructed by matching historical
 * observations against a skill's sample phrasings.
 *
 * Legacy inference is kept so existing histories are not thrown away, but it is
 * not the same kind of claim: it may inform review and may never on its own
 * promote a skill to steady.
 */
export type EvidenceSource = 'validated_explicit' | 'legacy_inferred';

/**
 * A single validated instance of a learner demonstrating a communicative skill.
 *
 * A skill is a capability, not a memorised string. "Could you explain that
 * again?" and "Could you clarify that?" are the same capability, which is why
 * skill evidence points at a curated skill id plus a quote in the learner's own
 * passage rather than at an exact phrase match.
 */
export interface SkillObservation {
  id: string;

  skillId: CommunicativeSkillId;

  sessionId: string;
  attemptId: string;

  /** The learner passage this was read from. */
  sourcePassageId: string;
  /** The transcript revision that passage had when it was read. */
  sourceRevision: string;

  /** Required context identity used by transfer/status projection. */
  contextKey: SkillContextKey;

  /**
   * Legacy provenance retained during migration. Projection must never use these
   * fields directly for context counting.
   */
  domainId?: DomainId;
  scenarioId?: ScenarioId;

  examProgramId?: ExamProgramId;
  examTaskId?: ExamTaskId;

  modality: 'spoken' | 'typed';

  retrieval: RetrievalType;

  taskOutcome: TaskOutcome;

  supportExposureIds: string[];

  evidenceSource: EvidenceSource;

  /** The words the learner actually produced, kept as provenance. */
  quote: string;

  recordedAt: string;
}

/**
 * A durable record that a cold attempt at a skill did not succeed.
 *
 * A lapse is deliberately not a `SkillObservation`. It can never promote a skill
 * and it can never lower one; it only makes a durable skill due for review. It is
 * stored separately so that "this learner demonstrated X" and "this learner
 * failed at X once" can never be read as the same kind of claim, and so a failure
 * is not lost merely because it cannot be positive evidence.
 *
 * Silence is not a lapse. So is a task the learner deliberately changed direction
 * on after being shown support. A lapse requires a real cold opportunity to
 * retrieve, with nothing on screen.
 */
export interface SkillLapse {
  id: string;
  skillId: CommunicativeSkillId;

  sessionId: string;
  attemptId: string;

  /** The learner passage that carried the failed attempt. */
  sourcePassageId: string;
  sourceRevision: string;

  domainId?: DomainId;
  scenarioId?: ScenarioId;

  /** Why this counts as a lapse rather than an ordinary failure. */
  basis: 'cold_attempt_failed';

  recordedAt: string;
}

/**
 * Skill states. Phrase recall and communicative skill deliberately do not share
 * these: a phrase can be steady from repeated retrieval, while a skill needs
 * transfer across situations and days before the claim is defensible.
 */
export type SkillStatus = 'new' | 'supported' | 'growing' | 'steady';

/** The v2 skill projection, replacing the phrase-derived one. */
export interface SkillProjectionV2 {
  skillId: CommunicativeSkillId;

  status: SkillStatus;

  /** Canonical domain + scenario-family identities with qualifying independent evidence. */
  independentContexts: string[];
  /** Distinct calendar days with qualifying independent evidence. */
  independentDays: string[];

  /** Evidence of any kind, including assisted. */
  assistedCount: number;

  /** Split by provenance, so a legacy-only history is visibly weaker. */
  validatedCount: number;
  legacyInferredCount: number;

  /**
   * True when a durable skill has since produced a lapse.
   *
   * A recent mistake schedules review; it does not erase demonstrated
   * competence. Demoting a steady skill to growing because of one bad attempt
   * would tell the learner something untrue about what they can already do.
   */
  reviewDue: boolean;

  /** Why this status, in words a developer can show. */
  explanation: string;
}

export interface PhraseItem {
  id: string;
  language: LanguageCode;
  form: string;
  meaning: string;
  usageNote: string;
  difficulty: 'beginner' | 'elementary' | 'intermediate';
  recallStatus: RecallStatus;
  scheduling: {
    nextReviewAt: string;
    due: boolean;
    intervalDays: number;
    lastLapseAt?: string;
    modalityHistory: Modality[];
    contexts: string[];
  };
  stats: {
    assistedCount: number;
    unassistedCount: number;
    spokenCount: number;
    typedCount: number;
    lastPracticedAt?: string;
  };
}

export interface CommunicativeSkill {
  id: string;
  name: string;
  description: string;
  pattern: string;
  evidenceKeysCount: number;
  contextsCount: number;
  status: 'emerging' | 'demonstrated' | 'steady';
}

export interface SessionRecord {
  id: string;
  missionId: string;
  missionVersion: number;
  language: LanguageCode;
  mode: Mode;
  coldAttempt: boolean;
  state: SessionState;
  startedAt: string;
  endedAt?: string;
  endReason?: 'completed' | 'user_ended' | 'time_limit' | 'error';
  passages: Passage[];
  supportExposures: SupportExposure[];
  observations: LearningObservation[];
  /**
   * Validated skill evidence for this session. Written by the validator, never by
   * the view: the model proposes and this is what survived validation.
   */
  skillObservations?: SkillObservation[];
  /** Cold failures recorded as review signals. Never promotional. */
  skillLapses?: SkillLapse[];
  taskOutcome: 'completed' | 'partly_completed' | 'changed_direction' | 'unknown';
  sceneState: SceneState;
  summary?: string;
  actionableFeedback?: string[];
}

export type UiLanguage = 'en' | 'fr' | 'es' | 'nl';

export interface UserPreferences {
  learningLanguage: LanguageCode;
  explanationLanguage: UiLanguage;
  comfortLevel: 'beginner' | 'elementary' | 'intermediate' | 'not_sure';
  primaryGoal: 'travel' | 'relocation' | 'work' | 'social' | 'explore';
  modeDefault: Mode;
  voiceProcessingConsent: boolean;
  savedAnalysisConsent: boolean;
  audioPlaybackEnabled: boolean;
  autoPlaySpeech: boolean;
  speechRate?: number;
}
