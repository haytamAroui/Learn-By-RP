export type LanguageCode = 'es' | 'fr' | 'de' | 'it' | 'ja';

export type Mode = 'immersion' | 'guided' | 'focused';

export type RecallStatus = 'new' | 'supported' | 'growing' | 'steady';

export type Modality = 'spoken' | 'typed';

export type RetrievalType = 'assisted' | 'unassisted' | 'unknown';

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
}

export interface PhraseItem {
  id: string;
  language: LanguageCode;
  form: string;
  meaning: string;
  usageNote: string;
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
