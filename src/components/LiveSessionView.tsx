import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { categoriseProviderError, type ProviderError } from '../features/voice/lifecycle';
import {
  beginGeneration,
  invalidate as invalidateGeneration,
  isCurrent as isGenerationCurrent,
} from '../features/voice/generation';
import {
  HelpCircle,
  Keyboard,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Send,
  Volume2,
  X,
} from 'lucide-react-native';
import {
  AccommodationProfile,
  MissionDefinition,
  Mode,
  Passage,
  SessionRecord,
  SupportExposure,
  SceneState,
  LearningObservation,
  SkillObservation,
  SkillLapse,
  OpportunityInstance,
  OperationalTelemetryEvent,
  TaskOutcome,
} from '../types';
import { createVoiceTransport } from '../providers/voice';
import type { VoiceEvent, VoiceTransport } from '../providers/voice';
import { createConversationProvider } from '../providers/conversation';
import type {
  ConversationProvider,
  ConversationProviderEvent,
} from '../providers/conversation/types';
import { speakWithBestAvailable } from '../providers/voice/speechOutput';
import { useI18n } from '../features/i18n';
import {
  buildLocalObservations,
  StructuredAssessmentProposal,
  validateAssessmentProposal,
} from '../features/learning/learningCore';
import {
  SkillEvidenceCandidate,
  SkillEvidenceProposal,
  validateSkillEvidenceProposal,
} from '../features/learning/skillEvidence';
import { api } from '../lib/api';
import { SceneMirror } from '../features/roleplay/SceneMirror';
import {
  commitValidatedOpportunityDemonstrations,
  finalizeNotPresentedOpportunities,
  prepareOpportunityAssessmentView,
  syncAuthoredOpportunities,
} from '../features/roleplay/opportunityRuntime';
import { getScene } from '../content/scenes';
import { COMMUNICATIVE_SKILLS_CATALOG } from '../data/missions';
import {
  FinalizedAttemptEvidence,
  inheritSupportForRetry,
  mergeAttemptPassages,
  mergeFinalizedAttemptEvidence,
} from '../features/learning/retrySupport';
import { LEARNING_POLICY_VERSION } from '../features/learning/policy';
import {
  createModelPhraseAudioExposure,
  createTypedExampleExposure,
  mergeVisibleCaptionViewExposures,
} from '../features/learning/supportSurfaces';
import { negotiateRoleplayCapabilities } from '../features/roleplay/capabilities';
import { mayCommitActorReply } from '../features/roleplay/actorContract';
import type {
  RoleplayCheckpoint,
  SceneActionName,
  SceneCheckpointSnapshot,
} from '../contracts/scene';
import { Button, Field } from './ui';
import { Sheet } from './Sheet';
import { iconColor } from '../design/iconColor';

function toRuntimeCheckpoints(
  checkpoints: SceneState['checkpoints']
): SceneCheckpointSnapshot[] {
  return checkpoints.flatMap(checkpoint =>
    typeof checkpoint.sceneRevision === 'number'
      ? [
          {
            id: checkpoint.id,
            description: checkpoint.description,
            timestamp: checkpoint.timestamp,
            sceneRevision: checkpoint.sceneRevision,
          },
        ]
      : []
  );
}

interface LiveSessionViewProps {
  mission: MissionDefinition | null;
  initialSession: SessionRecord;
  accommodations?: AccommodationProfile;
  preferredSpeechRate?: number;
  /** Read-only prior-session briefing/recap rows used for cross-session evidence only. */
  historicalSupportExposures?: SupportExposure[];
  onEndSession: (session: SessionRecord) => void;
}

/**
 * The session's voice state, aligned with ConversationConnectionState.
 *
 * `reconnecting` and `error` are the two this list was missing. Without
 * `reconnecting`, a dropped socket has nowhere to go but `error`, so a brief network
 * blip is presented as a terminal failure. Without `error`, a genuine failure is
 * presented as silence - the learner waits for a reply that is never coming.
 */
type VoiceState =
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'muted'
  | 'paused'
  | 'idle'
  | 'ending'
  /** A retry is in flight. Not a failure, and must not read as one. */
  | 'reconnecting'
  /** Sustained failure. The typed route is still open. */
  | 'error';

const VOICE_DOT: Record<VoiceState, string> = {
  connecting: 'bg-muted',
  listening: 'bg-action',
  speaking: 'bg-accent-sage',
  muted: 'bg-muted',
  paused: 'bg-warning',
  idle: 'bg-muted',
  ending: 'bg-muted',
  // Amber rather than red: the user can still see the difference between "trying
  // again" and "failed", which is the whole reason these are separate states.
  reconnecting: 'bg-warning',
  error: 'bg-danger',
};

/** States in which the voice input control should not invite a tap. */
const VOICE_BLOCKED: ReadonlySet<VoiceState> = new Set<VoiceState>([
  'connecting',
  'reconnecting',
  'error',
  'ending',
]);

const EXPLANATION_LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  nl: 'Dutch',
};

/**
 * Coerce the hosted assessor's JSON into the proposal shape the validator
 * expects, dropping anything malformed. A malformed item is omitted; it does
 * not invalidate the rest.
 */
function normalizeAssessmentResponse(
  response: any,
  sessionId: string,
  attemptId: string
): StructuredAssessmentProposal {
  const rawItems: any[] = Array.isArray(response?.items) ? response.items : [];

  const items = rawItems
    .filter(item => item && typeof item.candidateForm === 'string' && item.candidateForm.trim())
    .map(item => ({
      itemId: typeof item.candidateItemId === 'string' ? item.candidateItemId : undefined,
      candidateForm: item.candidateForm,
      meaning: typeof item.meaning === 'string' ? item.meaning : '',
      quote: typeof item.quote === 'string' ? item.quote : '',
      sourcePassageId: typeof item.sourcePassageId === 'string' ? item.sourcePassageId : '',
      sourceRevision: typeof item.sourceRevision === 'string' ? item.sourceRevision : 'rev-1',
      modality: item.modality === 'typed' ? ('typed' as const) : ('spoken' as const),
      retrievalProposal: (['assisted', 'unassisted', 'unknown'] as const).includes(
        item.retrievalProposal
      )
        ? item.retrievalProposal
        : ('unknown' as const),
      modelConfidence: typeof item.modelConfidence === 'number' ? item.modelConfidence : undefined,
    }));

  const outcome = response?.taskOutcome;

  return {
    schemaVersion: typeof response?.schemaVersion === 'number' ? response.schemaVersion : 0,
    sessionId: typeof response?.sessionId === 'string' ? response.sessionId : sessionId,
    attemptId: typeof response?.attemptId === 'string' ? response.attemptId : attemptId,
    taskOutcome: (['achieved', 'partial', 'not_achieved', 'unknown'] as const).includes(outcome)
      ? outcome
      : 'unknown',
    outcomeReasoning:
      typeof response?.outcomeReasoning === 'string' ? response.outcomeReasoning : undefined,
    items,
    actionableFeedback: Array.isArray(response?.actionableFeedback)
      ? response.actionableFeedback.filter((f: any) => typeof f === 'string')
      : undefined,
  };
}

/**
 * Normalises the assessor's skill proposals.
 *
 * Note what the model is allowed to say: which skill, which quote, which passage,
 * which revision, and a retrieval guess. It does not get to name the session,
 * attempt, domain or scene — those come from runtime state, so there is no field
 * in which a fabricated context could arrive.
 */
function normalizeSkillItems(
  response: any,
  skillIds: string[]
): SkillEvidenceCandidate[] {
  const raw = Array.isArray(response?.skillItems) ? response.skillItems : [];

  return raw
    .filter((item: any) => item && typeof item === 'object')
    .filter((item: any) => typeof item.skillId === 'string' && skillIds.includes(item.skillId))
    .map((item: any) => ({
      skillId: item.skillId as string,
      sourcePassageId: typeof item.sourcePassageId === 'string' ? item.sourcePassageId : '',
      sourceRevision: typeof item.sourceRevision === 'string' ? item.sourceRevision : 'rev-1',
      quote: typeof item.quote === 'string' ? item.quote : '',
      modality: item.modality === 'typed' ? ('typed' as const) : ('spoken' as const),
      retrievalProposal: (['assisted', 'unassisted', 'unknown'] as const).includes(
        item.retrievalProposal
      )
        ? item.retrievalProposal
        : ('unknown' as const),
      opportunityInstanceId:
        typeof item.opportunityInstanceId === 'string' ? item.opportunityInstanceId : undefined,
      supportExposureIds: Array.isArray(item.supportExposureIds)
        ? item.supportExposureIds.filter((id: unknown): id is string => typeof id === 'string')
        : [],
    }));
}

function normalizeTargetForm(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[¿?¡!.,;:'"“”‘’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface ActiveCoachAudioTarget {
  targetSkillId: string;
  targetOpportunityId?: string;
  targetPhraseId: string;
  targetPhraseForm: string;
}

function resolveCoachTarget(
  mission: MissionDefinition,
  opportunities: OpportunityInstance[],
  attemptId: string
): {
  targetSkillId: string;
  targetOpportunityId?: string;
  targetPhraseId?: string;
  targetPhraseForm?: string;
} {
  const activeOpportunity = [...opportunities]
    .reverse()
    .find(
      opportunity =>
        opportunity.attemptId === attemptId &&
        opportunity.status === 'presented' &&
        opportunity.detection === 'validated'
    );

  const targetSkillId = activeOpportunity?.skillId ?? mission.primarySkillIds[0];
  const skill = COMMUNICATIVE_SKILLS_CATALOG.find(candidate => candidate.id === targetSkillId);
  const sampleForms = new Set(
    (skill?.samplePhrases ?? []).map(sample => normalizeTargetForm(sample))
  );
  const targetPhrase = mission.usefulPhrases.find(phrase =>
    sampleForms.has(normalizeTargetForm(phrase.form))
  );

  return {
    targetSkillId,
    targetOpportunityId: activeOpportunity?.id,
    targetPhraseId: targetPhrase?.id,
    targetPhraseForm: targetPhrase?.form,
  };
}

export const LiveSessionView: React.FC<LiveSessionViewProps> = ({
  mission,
  initialSession,
  accommodations = { enabled: [] },
  preferredSpeechRate = 1,
  historicalSupportExposures = [],
  onEndSession,
}) => {
  const { t, language } = useI18n();
  const insets = useSafeAreaInsets();

  const buildHonestSummary = (
    assessmentUnavailable: boolean,
    observationCount: number,
    hasLearnerSpeech: boolean
  ): string => {
    if (!hasLearnerSpeech) return t.live.summaryNoSpeech;
    if (assessmentUnavailable) return t.live.summaryAssessmentUnavailable;
    if (observationCount > 0) return t.live.summaryGoalsClear;
    return t.live.summaryNoTargetPhrases;
  };

  const sessionId = initialSession.id;
  const mode = initialSession.mode;
  const coldAttempt = initialSession.coldAttempt;
  const [attemptId, setAttemptId] = useState(
    () => initialSession.passages.at(-1)?.attemptId ?? 'attempt-1'
  );
  const [passages, setPassages] = useState<Passage[]>(() => initialSession.passages);
  const [supportExposures, setSupportExposures] = useState<SupportExposure[]>(
    () => initialSession.supportExposures
  );
  const [sceneState, setSceneState] = useState<SceneState>(() => initialSession.sceneState);

  const [voiceState, setVoiceState] = useState<VoiceState>('connecting');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioPlaybackEnabled, setAudioPlaybackEnabled] = useState(true);
  const [showMeaningLine, setShowMeaningLine] = useState(false);
  /** The passage the meaning was revealed for, so a re-reveal is not double counted. */
  const meaningRevealedForRef = useRef<string | null>(null);

  /**
   * Revealing a caption's meaning is support.
   *
   * This is the most-used support affordance in the product, and it used to be
   * purely visual: a learner could read the translation, repeat the phrase, and
   * have it recorded as `unassisted` because no exposure existed to contradict it.
   * That inflated both phrase and skill evidence on the most common path through
   * the app.
   *
   * Recorded once per passage. Hiding and revealing again is the same support, not
   * additional support, and a second row would only add noise to the ledger.
   */
  /**
   * Revealing a caption's meaning is support.
   *
   * This is the most-used support affordance in the product, and it used to be
   * purely visual: a learner could read the translation, repeat the phrase, and
   * have it recorded as `unassisted` because no exposure existed to contradict it.
   * That inflated both phrase and skill evidence on the most common path through
   * the app.
   *
   * Recorded once per passage. Hiding and revealing again is the same support, not
   * additional support, and a second row would only add noise to the ledger.
   */
  const handleToggleMeaning = useCallback(() => {
    if (showMeaningLine) {
      setShowMeaningLine(false);
      return;
    }

    setShowMeaningLine(true);

    // Derived here rather than reusing the render-scope value, because this
    // callback is declared before that value exists.
    const passage = [...passages].reverse().find(p => p.speaker === 'assistant');
    if (!passage?.meaning) return;
    if (meaningRevealedForRef.current === passage.id) return;
    meaningRevealedForRef.current = passage.id;

    const exposure: SupportExposure = {
      id: `exp-meaning-${passage.id}`,
      sessionId,
      attemptId,
      turnId: passage.id,
      source: 'caption',
      kind: 'meaning_of_assistant_turn',
      // A caption translation is help with the whole line, not with one curated
      // phrase, so no phrase ids are claimed.
      targetItemIds: [],
      exposure: 'visible',
      policyVersion: LEARNING_POLICY_VERSION,
      recordedAt: new Date().toISOString(),
    };

    setSupportExposures(prev =>
      prev.some(e => e.id === exposure.id) ? prev : [...prev, exposure]
    );
  }, [passages, showMeaningLine, sessionId, attemptId]);

  const typedPreferred = accommodations.enabled.includes('typed_preferred');
  const slowerSpeechDefault = accommodations.enabled.includes('slower_speech_default');
  const hapticTurnCues = accommodations.enabled.includes('haptic_turn_cues');
  const effectiveSpeechRate = slowerSpeechDefault
    ? Math.min(preferredSpeechRate, 0.8)
    : preferredSpeechRate;

  const cueLearnerTurn = useCallback(() => {
    if (!hapticTurnCues || Platform.OS === 'web') return;
    void Haptics.selectionAsync();
  }, [hapticTurnCues]);

  const [showTypedInput, setShowTypedInput] = useState(typedPreferred);
  const [typedMessage, setTypedMessage] = useState('');
  /*
    The last assistant failure, kept so recovery can be offered rather than the
    session just going quiet. Null means no failure is outstanding.
  */
  const [lastAssistantError, setLastAssistantError] = useState<ProviderError | null>(null);
  /*
    Seconds left before an inactivity end, or null when no countdown is running.

    Null rather than 0 because 0 is a real countdown value: the last second before the
    session ends. Treating "no countdown" as 0 would make the banner flash on every
    tick for a session that is perfectly healthy.
  */
  const [inactivityCountdown, setInactivityCountdown] = useState<number | null>(null);
  const [interimUserText, setInterimUserText] = useState('');
  const [sceneEventNotice, setSceneEventNotice] = useState<string | null>(null);

  const [showHelpSheet, setShowHelpSheet] = useState(false);
  const [isSceneFrozen, setIsSceneFrozen] = useState(false);
  const [activeCoachAdvice, setActiveCoachAdvice] = useState<string | null>(null);
  const [activeCoachAudioTarget, setActiveCoachAudioTarget] =
    useState<ActiveCoachAudioTarget | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  const voiceTransportRef = useRef<VoiceTransport | null>(null);
  const conversationProviderRef = useRef<ConversationProvider | null>(null);
  const sceneMirrorRef = useRef<SceneMirror | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const sceneStateRef = useRef(sceneState);
  const passagesRef = useRef(passages);
  const supportExposuresRef = useRef(supportExposures);
  const priorAttemptPassagesRef = useRef<Passage[]>([]);
  const finalizedAttemptEvidenceRef = useRef<FinalizedAttemptEvidence[]>([]);
  const finalizedAttemptIdsRef = useRef<Set<string>>(new Set());
  const opportunityInstancesRef = useRef<OpportunityInstance[]>(
    initialSession.opportunityInstances ?? []
  );
  const operationalTelemetryRef = useRef<OperationalTelemetryEvent[]>(
    initialSession.operationalTelemetry ?? []
  );
  const isMutedRef = useRef(isMuted);
  const isSceneFrozenRef = useRef(isSceneFrozen);
  const isEndingRef = useRef(false);
  const mountedRef = useRef(true);

  sceneStateRef.current = sceneState;
  passagesRef.current = passages;
  supportExposuresRef.current = supportExposures;
  isMutedRef.current = isMuted;
  isSceneFrozenRef.current = isSceneFrozen;

  useEffect(() => {
    const latestAssistant = [...passages]
      .reverse()
      .find(passage => passage.speaker === 'assistant');
    const olderVisible = latestAssistant
      ? passages.filter(passage => passage.id !== latestAssistant.id).slice(-6)
      : passages.slice(-6);
    const visiblePassages = latestAssistant
      ? [latestAssistant, ...olderVisible]
      : olderVisible;

    setSupportExposures(existing =>
      mergeVisibleCaptionViewExposures({
        existing,
        visiblePassages,
        sessionId,
        attemptId,
        recordedAt: new Date().toISOString(),
      })
    );
  }, [attemptId, passages, sessionId]);

  useEffect(() => {
    if (!mission?.sceneId) return;
    const scene = getScene(mission.sceneId);
    if (!scene || sceneState.sceneId !== scene.id) return;

    opportunityInstancesRef.current = syncAuthoredOpportunities({
      scene,
      state: {
        sceneId: sceneState.sceneId,
        sessionId,
        attemptId,
        revision: sceneState.revision,
        facts: sceneState.facts,
        actionCounts: sceneState.actionCounts ?? {},
        checkpoints: toRuntimeCheckpoints(sceneState.checkpoints),
        isFinished: sceneState.isFinished,
        outcome: sceneState.outcome,
        firedComplications: [],
      },
      existing: opportunityInstancesRef.current,
      recordedAt: new Date().toISOString(),
    });
  }, [
    attemptId,
    mission?.sceneId,
    sceneState.checkpoints,
    sceneState.facts,
    sceneState.isFinished,
    sceneState.outcome,
    sceneState.revision,
    sceneState.sceneId,
    sessionId,
  ]);

  const explanationLanguage = EXPLANATION_LANGUAGE_NAMES[language] ?? 'English';

  const buildInitialGreeting = useCallback(
    (target: MissionDefinition): { greeting: string; meaning: string } => {
      const { language: lang, category, title } = target;

      if (lang === 'fr') {
        if (category === 'problems') {
          return {
            greeting: 'Bonjour ! Bienvenue à la pharmacie. Qu’est-ce qui ne va pas aujourd’hui ?',
            meaning: 'Good morning! Welcome to the pharmacy. What seems to be the problem today?',
          };
        }
        if (category === 'transit') {
          return {
            greeting: 'Bonjour ! En quoi puis-je vous renseigner pour votre trajet ?',
            meaning: 'Hello! How can I help you with your journey?',
          };
        }
        if (category === 'cafes' && title.includes('Bistro')) {
          return {
            greeting: 'Bonsoir ! Bienvenue au Bistro. Vous êtes deux pour dîner ?',
            meaning: 'Good evening! Welcome to the Bistro. Table for two for dinner?',
          };
        }
        return {
          greeting: 'Bonjour ! Bienvenue. Qu’est-ce qui vous ferait plaisir ce matin ?',
          meaning: 'Good morning! Welcome. What can I get for you this morning?',
        };
      }

      if (lang === 'de') {
        if (category === 'problems') {
          return {
            greeting: 'Guten Tag! Willkommen in der Apotheke. Wie kann ich Ihnen helfen?',
            meaning: 'Good day! Welcome to the pharmacy. How can I help you?',
          };
        }
        if (category === 'transit') {
          return {
            greeting: 'Hallo! Suchen Sie eine Fahrkarte oder eine Verbindung?',
            meaning: 'Hello! Are you looking for a ticket or a connection?',
          };
        }
        if (category === 'cafes' && title.includes('Gasthaus')) {
          return {
            greeting: 'Guten Abend! Suchen Sie einen schönen Tisch zum Abendessen?',
            meaning: 'Good evening! Are you looking for a nice table for dinner?',
          };
        }
        return {
          greeting: 'Guten Morgen! Was darf es denn heute Frisches sein?',
          meaning: 'Good morning! What fresh items can I get for you today?',
        };
      }

      if (lang === 'it') {
        if (category === 'problems') {
          return {
            greeting: 'Buongiorno! Benvenuto in farmacia. Di cosa hai bisogno?',
            meaning: 'Good morning! Welcome to the pharmacy. What do you need?',
          };
        }
        if (category === 'transit') {
          return {
            greeting: 'Buongiorno! Dove devi andare oggi?',
            meaning: 'Good morning! Where are you traveling today?',
          };
        }
        if (category === 'cafes' && title.includes('Trattoria')) {
          return {
            greeting: 'Buonasera! Benvenuti da Mario. Volete accomodarvi all’aperto?',
            meaning: 'Good evening! Welcome to Mario’s. Would you like to sit outside?',
          };
        }
        return {
          greeting: 'Buongiorno! Prego, cosa ti porto stamattina al banco?',
          meaning: 'Good morning! Please, what can I get you this morning at the counter?',
        };
      }

      if (lang === 'ja') {
        if (category === 'problems') {
          return {
            greeting: 'こんにちは！薬局へようこそ。どのような症状でお困りですか？',
            meaning: 'Hello! Welcome to the pharmacy. What symptoms are troubling you?',
          };
        }
        if (category === 'transit') {
          return {
            greeting: 'いらっしゃいませ！JR日暮里駅です。切符や乗り換えのご案内をいたします。',
            meaning:
              'Welcome! This is JR Nippori Station. How can I assist with tickets or transfers?',
          };
        }
        if (category === 'cafes') {
          return {
            greeting: 'いらっしゃい！居酒屋まるへようこそ！何名様ですか？',
            meaning: 'Welcome! Welcome to Izakaya Maru! How many people in your party?',
          };
        }
        return {
          greeting: 'いらっしゃいませ！お弁当や温かい飲み物はいかがでしょうか？',
          meaning: 'Welcome! Would you like a lunchbox or warm drink?',
        };
      }

      if (category === 'problems') {
        return {
          greeting: 'Buenos días, bienvenido a la farmacia. ¿Qué síntomas tienes?',
          meaning: 'Good morning, welcome to the pharmacy. What symptoms do you have?',
        };
      }
      if (category === 'transit') {
        return {
          greeting: '¡Hola! ¿En qué puedo ayudarte en el metro hoy?',
          meaning: 'Hello! How can I help you in the metro today?',
        };
      }
      if (category === 'services') {
        return {
          greeting: 'Hola, buenos días. ¿Vienes a recoger o enviar un paquete?',
          meaning: 'Hello, good morning. Are you here to pick up or send a parcel?',
        };
      }
      if (category === 'social') {
        return {
          greeting: '¡Hola vecino! ¿Qué tal? ¿En qué puedo echarte una mano?',
          meaning: 'Hi neighbor! How is it going? How can I lend a hand?',
        };
      }
      if (title.includes('Terraza')) {
        return {
          greeting: '¡Buenas noches! Bienvenidos a La Terraza. ¿Buscaban mesa para cenar?',
          meaning: 'Good evening! Welcome to La Terraza. Looking for a table for dinner?',
        };
      }

      return {
        greeting: '¡Hola! Muy buenos días. ¿Qué te gustaría tomar hoy?',
        meaning: 'Hello! Good morning. What would you like to have today?',
      };
    },
    []
  );

  const handleUserMessage = useCallback(
    async (target: MissionDefinition, text: string, modality: 'spoken' | 'typed') => {
      const trimmed = text.trim();
      if (!trimmed || isEndingRef.current) return;

      // Every turn takes a token. If the session ends or a newer turn begins while
      // this reply is in flight, the response is dropped rather than committed.
      const generation = beginGeneration();

      /*
        If the last passage in the transcript is already this user turn awaiting
        a response (e.g. from a dropped connection that is now being retried),
        reuse it rather than appending a duplicate entry. This keeps retries
        from polluting the transcript and corrupting evidence counts.
      */
      const lastPassage = passagesRef.current[passagesRef.current.length - 1];
      const isRetryOfLastUnansweredTurn =
        lastPassage?.speaker === 'user' &&
        lastPassage.text.trim().toLowerCase() === trimmed.toLowerCase();

      let userPassageId: string;
      let updatedPassages: Passage[];

      if (isRetryOfLastUnansweredTurn) {
        userPassageId = lastPassage.id;
        updatedPassages = passagesRef.current;
      } else {
        userPassageId = `p-${Date.now()}`;
        const userPassage: Passage = {
          id: userPassageId,
          sessionId,
          attemptId,
          speaker: 'user',
          revisionKey: 'rev-1',
          assemblyVersion: 1,
          status: 'final',
          text: trimmed,
          modality,
          startedAt: new Date().toISOString(),
          fragments: [
            {
              id: `f-${Date.now()}`,
              passageId: userPassageId,
              origin: modality === 'spoken' ? 'asr' : 'typed',
              text: trimmed,
            },
          ],
        };
        updatedPassages = [...passagesRef.current, userPassage];
        setPassages(updatedPassages);
      }
      setVoiceState('connecting');

      try {
        const provider = conversationProviderRef.current;
        if (!provider) {
          throw new Error('Conversation provider is not initialized');
        }

        const response = await provider.respond({
          character: target.character,
          setting: target.setting,
          learnerGoal: target.learnerGoal,
          sceneFacts: sceneStateRef.current.facts,
          allowedActions:
            (target.sceneId ? getScene(target.sceneId)?.allowedActions : undefined)?.map(
              action => action.name
            ) ?? [],
          mode,
          recentPassages: updatedPassages.slice(-5),
          userMessage: trimmed,
          targetLanguage: target.language,
          explanationLanguage,
        });

        /*
          Checked here, after the await, not before the request.

          The session can end while this is in flight, and a response that arrives
          afterwards would otherwise append to passages that are no longer displayed
          and write this session's words into the next one's transcript.
        */
        if (!isGenerationCurrent(generation) || isEndingRef.current) return;

        if (response.proposedAction) {
          const actionResult = await applyProposedSceneAction(
            response.proposedAction,
            [userPassageId]
          );

          // The actor may not confirm a consequential world change until the
          // authoritative reducer accepts it. A missing mirror, network failure,
          // stale revision, or reducer rejection all suppress this actor line.
          if (!mayCommitActorReply(response.proposedAction, actionResult)) {
            setVoiceState('idle');
            return;
          }
        }

        const characterPassage: Passage = {
          id: `p-${Date.now() + 1}`,
          sessionId,
          attemptId,
          speaker: 'assistant',
          revisionKey: 'rev-1',
          assemblyVersion: 1,
          status: 'final',
          text: response.replyText,
          meaning: response.meaning,
          modality: 'spoken',
          startedAt: new Date().toISOString(),
          fragments: [
            {
              id: `f-${Date.now() + 1}`,
              passageId: `p-${Date.now() + 1}`,
              origin: 'assistant',
              text: response.replyText,
            },
          ],
        };

        setPassages([...updatedPassages, characterPassage]);

        if (audioPlaybackEnabled && !isSceneFrozenRef.current) {
          setVoiceState('speaking');
          const transport = voiceTransportRef.current;
          if (transport) {
            if (response.audioBase64) {
              await transport.playSpeech(response.replyText, {
                audioBase64: response.audioBase64,
                mimeType: response.audioMimeType,
                lang: target.language,
              });
            } else {
              await speakWithBestAvailable(transport, response.replyText, {
                language: target.language,
                speed: slowerSpeechDefault ? effectiveSpeechRate : preferredSpeechRate,
                style: target.character.voiceStyle,
              });
            }
            cueLearnerTurn();
          }
        } else {
          setVoiceState('idle');
        }
      } catch (err) {
        console.error('Actor respond error', err);

        /*
          A failed assistant turn must not look like a failed learner turn.

          The learner passage is already in the transcript - they did say it, and
          deleting it would erase evidence of something they actually did. What
          failed is the reply. So the transcript stands, the typed draft is returned
          so it can be offered back, and the voice state explains the gap.
        */
        setLastAssistantError(categoriseProviderError({
          message: err instanceof Error ? err.message : String(err),
          code: (err as { status?: number })?.status,
          isNetworkFailure: err instanceof Error && /fetch|network|abort/i.test(err.message),
        }));

        if (modality === 'typed') {
          // Hand the text back rather than leaving the field empty, which is
          // indistinguishable from losing what they typed.
          setTypedMessage(text);
          setShowTypedInput(true);
        }

        setVoiceState('reconnecting');
      }
    },
    [
      audioPlaybackEnabled,
      attemptId,
      cueLearnerTurn,
      effectiveSpeechRate,
      preferredSpeechRate,
      slowerSpeechDefault,
      explanationLanguage,
      mode,
      sessionId,
    ]
  );

  /*
    Submitting a typed turn.

    The field is cleared only on the way out, and a failed send puts the text back.
    Clearing it optimistically - which is what both call sites did - meant a network
    blip silently deleted something the learner had just typed and retyped, with no
    indication it had ever been sent.
  */
  const submitTypedMessage = useCallback(
    async (target: MissionDefinition) => {
      const text = typedMessage.trim();
      if (!text || isEndingRef.current) return;

      // Cleared here because the transcript now owns the turn; the catch in
      // handleUserMessage restores it if the assistant turn fails.
      setTypedMessage('');
      setLastAssistantError(null);
      await handleUserMessage(target, text, 'typed');
    },
    [handleUserMessage, typedMessage]
  );

  /**
   * Asks the server reducer to apply a proposed action. The client never decides
   * what is true in the scene: a rejection comes back with a reason and the
   * still-permissible options, and it is surfaced rather than swallowed.
   */
  const applyProposedSceneAction = useCallback(
    async (
      proposedAction: { name: string; payload?: Record<string, unknown> },
      sourceTurnIds: string[]
    ) => {
      const mirror = sceneMirrorRef.current;
      if (!mirror) return null;

      const result = await mirror.propose(
        attemptId,
        proposedAction.name as SceneActionName,
        proposedAction.payload ?? {},
        sourceTurnIds
      );

      if (!result) {
        setSceneEventNotice(t.live.sceneDirectorUnavailable);
        setTimeout(() => setSceneEventNotice(null), 4000);
        return null;
      }

      if (!result.accepted) {
        setSceneEventNotice(
          result.reason
            ? `${t.live.actionNotApplied}: ${result.reason}`
            : t.live.actionNotPermitted
        );
        setTimeout(() => setSceneEventNotice(null), 4000);
        return result;
      }

      const authoritative = await mirror.reconcile();
      setSceneState(prev => ({
        ...prev,
        sceneId: authoritative?.sceneId ?? prev.sceneId,
        revision: authoritative?.revision ?? result.revision,
        facts: authoritative?.facts ?? result.newFacts,
        actionCounts: authoritative?.actionCounts ?? prev.actionCounts,
        checkpoints: authoritative?.checkpoints ?? prev.checkpoints,
        isFinished: authoritative?.isFinished ?? prev.isFinished,
        outcome: authoritative?.outcome ?? prev.outcome,
        lastAction: { name: proposedAction.name, actor: mission?.character.name ?? '' },
      }));

      if (proposedAction.name === 'offer_alternative') {
        setSceneEventNotice(
          t.live.sceneAlternativeUpdated
        );
      } else if (proposedAction.name === 'confirm_takeaway') {
        setSceneEventNotice(t.live.sceneTakeawayConfirmed);
      }

      setTimeout(() => setSceneEventNotice(null), 4000);
      return result;
    },
    [attemptId, mission?.character.name, t.live]
  );

  const requestCoachHint = useCallback(
    async (
      step: 'intent_hint' | 'partial_form' | 'full_form' | 'explanation'
    ) => {
      if (!mission) return;
      setIsCoachLoading(true);
      setActiveCoachAudioTarget(null);

      const lastAssistantPassage = [...passagesRef.current]
        .reverse()
        .find(p => p.speaker === 'assistant');

      try {
        const target = resolveCoachTarget(
          mission,
          opportunityInstancesRef.current,
          attemptId
        );
        const data = await api.coachHint({
          step,
          missionId: mission.id,
          targetLanguage: mission.language,
          explanationLanguage,
          characterName: mission.character.name,
          lastAssistantLine: lastAssistantPassage?.text ?? '',
          learnerGoal: mission.learnerGoal,
          ...target,
        });
        setActiveCoachAdvice(data.hint);

        const exposure: SupportExposure = {
          id: `exp-${Date.now()}`,
          sessionId,
          attemptId,
          source: 'coach',
          kind: step,
          targetSkillId: data.targetSkillId || target.targetSkillId,
          targetOpportunityId: data.targetOpportunityId ?? target.targetOpportunityId,
          targetPhraseId: data.targetPhraseId ?? target.targetPhraseId,
          targetItemIds: (data.targetPhraseId ?? target.targetPhraseId)
            ? [data.targetPhraseId ?? target.targetPhraseId!]
            : [],
          exposure: 'visible',
          policyVersion: LEARNING_POLICY_VERSION,
          recordedAt: new Date().toISOString(),
        };
        setSupportExposures(prev => [...prev, exposure]);

        const scopedPhraseId = data.targetPhraseId ?? target.targetPhraseId;
        const scopedPhrase = scopedPhraseId
          ? mission.usefulPhrases.find(phrase => phrase.id === scopedPhraseId)
          : undefined;

        if (step === 'full_form' && scopedPhrase) {
          setActiveCoachAudioTarget({
            targetSkillId: data.targetSkillId || target.targetSkillId,
            targetOpportunityId:
              data.targetOpportunityId ?? target.targetOpportunityId,
            targetPhraseId: scopedPhrase.id,
            targetPhraseForm: scopedPhrase.form,
          });
        }
      } catch (e) {
        setActiveCoachAudioTarget(null);
        setActiveCoachAdvice('Try expressing your order in simple, clear words.');
      } finally {
        setIsCoachLoading(false);
      }
    },
    [attemptId, explanationLanguage, mission, sessionId]
  );

  useEffect(() => {
    if (!mission) return;

    isEndingRef.current = false;

    // Attach the scene mirror when this mission has a released SceneDefinition.
    // Without one the session still runs; the client just does not mirror
    // server scene truth, and no action is proposed.
    if (mission.sceneId) {
      const scene = getScene(mission.sceneId);
      const mirror = new SceneMirror(
        sessionId,
        mission.sceneId,
        scene?.version ?? 1,
        mission.id,
        mission.version
      );
      sceneMirrorRef.current = mirror;
      void mirror.begin(attemptId).then(snapshot => {
        if (!snapshot || !mountedRef.current) return;
        setSceneState(prev => ({
          ...prev,
          sceneId: snapshot.sceneId,
          revision: snapshot.revision,
          facts: snapshot.facts,
          actionCounts: snapshot.actionCounts,
          checkpoints: snapshot.checkpoints,
          isFinished: snapshot.isFinished,
          outcome: snapshot.outcome,
        }));
      });
    } else {
      sceneMirrorRef.current = null;
    }

    // Briefing support is already persisted before this route mounts. Keep that
    // exact ledger: do not infer or broaden exposure from coldAttempt.

    const transport = createVoiceTransport();
    transport.setLanguage(mission.language);
    voiceTransportRef.current = transport;

    const negotiatedCapabilities = negotiateRoleplayCapabilities(
      transport.capabilities,
      {
        wantsSlowSpeech: slowerSpeechDefault,
        wantsLongThinkingTime: false,
        wantsScriptedLineInjection: true,
        requiresBlockingToolCalls: Boolean(mission.sceneId),
        needsTranscriptRevisions: true,
      }
    );
    for (const degradation of negotiatedCapabilities.degradations) {
      console.info('Roleplay capability degradation', {
        transportId: transport.id,
        ...degradation,
      });

      const id = [
        'capability',
        transport.id,
        degradation.capability,
        degradation.fallback,
      ].join(':');
      if (!operationalTelemetryRef.current.some(event => event.id === id)) {
        operationalTelemetryRef.current.push({
          id,
          kind: 'capability_degradation',
          providerId: transport.id,
          capability: degradation.capability,
          fallback: degradation.fallback,
          recordedAt: new Date().toISOString(),
        });
      }
    }

    const conversationProvider = createConversationProvider();
    conversationProviderRef.current = conversationProvider;
    const unsubscribeConversation = conversationProvider.subscribe(
      (event: ConversationProviderEvent) => {
        if (isEndingRef.current) return;
        switch (event.type) {
          case 'response_started':
            setVoiceState('connecting');
            break;
          case 'disconnected':
            setVoiceState('reconnecting');
            break;
          default:
            break;
        }
      }
    );
    void conversationProvider.connect?.().catch(error => {
      console.warn('Conversation provider preconnect failed:', error);
    });

    const unsubscribe = transport.subscribe((event: VoiceEvent) => {
      switch (event.type) {
        case 'listening_start':
          setVoiceState('listening');
          break;
        case 'listening_end':
          setVoiceState(prev => (prev === 'speaking' ? prev : 'idle'));
          break;
        case 'audio_level':
          setAudioLevel(event.payload);
          break;
        case 'speech_result':
          if (event.payload.isFinal) {
            setInterimUserText('');
            void handleUserMessage(mission, event.payload.transcript, 'spoken');
          } else {
            setInterimUserText(event.payload.transcript);
          }
          break;
        case 'playback_start':
          setVoiceState('speaking');
          break;
        case 'playback_end':
          setVoiceState('idle');
          if (!isSceneFrozenRef.current && !isMutedRef.current && !isEndingRef.current) {
            transport.startListening();
          }
          break;
        case 'interrupted':
          break;
        case 'error':
          /*
            A refused microphone is not a connection failure. It routes to typed
            input and reports `idle`, because the voice path is still available -
            the learner can grant permission and carry on.

            Anything else is a real failure, and it previously had no state to move
            to: the dot stayed on whatever it last showed while the session silently
            stopped responding. It now surfaces as `error` with the typed route open,
            so the learner can see the difference and keep working.
          */
          if (event.payload === 'mic_denied') {
            setShowTypedInput(true);
            setVoiceState('idle');
          } else {
            setShowTypedInput(true);
            setVoiceState('error');
          }
          break;
      }
    });

    const startInitialTurn = async () => {
      const { greeting, meaning } = buildInitialGreeting(mission);
      const now = Date.now();

      const initialPassage: Passage = {
        id: `p-${now}`,
        sessionId,
        attemptId: 'attempt-1',
        speaker: 'assistant',
        revisionKey: 'rev-1',
        assemblyVersion: 1,
        status: 'final',
        text: greeting,
        meaning,
        modality: 'spoken',
        startedAt: new Date().toISOString(),
        fragments: [
          { id: `f-${now}`, passageId: `p-${now}`, origin: 'assistant', text: greeting },
        ],
      };

      setPassages([initialPassage]);
      setVoiceState('speaking');

      await speakWithBestAvailable(transport, greeting, {
        language: mission.language,
        speed: effectiveSpeechRate,
        style: mission.character.voiceStyle,
      });
      cueLearnerTurn();
    };

    void startInitialTurn();

    return () => {
      isEndingRef.current = true;
      mountedRef.current = false;
      unsubscribe();
      unsubscribeConversation();
      transport.dispose();
      voiceTransportRef.current = null;
      conversationProvider.dispose();
      conversationProviderRef.current = null;
      void sceneMirrorRef.current?.close();
      sceneMirrorRef.current = null;
    };
  }, [
    mission,
    sessionId,
    coldAttempt,
    buildInitialGreeting,
    cueLearnerTurn,
    effectiveSpeechRate,
    preferredSpeechRate,
    slowerSpeechDefault,
    handleUserMessage,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [passages, interimUserText]);

  useEffect(() => {
    setShowMeaningLine(false);
  }, [passages.length]);


  const toggleFreezeScene = () => {
    if (!isSceneFrozen) {
      voiceTransportRef.current?.stopPlayback();
      voiceTransportRef.current?.stopListening();
      setIsSceneFrozen(true);
      setVoiceState('paused');
    } else {
      setIsSceneFrozen(false);
      setActiveCoachAdvice(null);
      setActiveCoachAudioTarget(null);
      setVoiceState('idle');
      voiceTransportRef.current?.startListening();
    }
  };

  const finalizeAttemptBeforeRetry = useCallback(
    async (parentAttemptId: string, allPassages: Passage[]) => {
      if (!mission || finalizedAttemptIdsRef.current.has(parentAttemptId)) return;

      const attemptPassages = allPassages.filter(
        passage => passage.attemptId === parentAttemptId
      );
      const learnerPassages = attemptPassages.filter(
        passage => passage.speaker === 'user' && passage.status === 'final'
      );
      if (learnerPassages.length === 0) {
        finalizedAttemptEvidenceRef.current.push({
          attemptId: parentAttemptId,
          observations: [],
          skillObservations: [],
          skillLapses: [],
        });
        finalizedAttemptIdsRef.current.add(parentAttemptId);
        return;
      }

      const evidenceSupportExposures = [
        ...historicalSupportExposures,
        ...supportExposuresRef.current,
      ];
      const isRehearsalAttempt = parentAttemptId !== 'attempt-1';
      let lastAssessmentResponse: unknown = null;
      let proposal: StructuredAssessmentProposal | null = null;

      try {
        const response = await api.assessment({
          sessionId,
          attemptId: parentAttemptId,
          missionId: mission.id,
          passages: attemptPassages,
          supportExposures: evidenceSupportExposures,
          usefulPhrases: mission.usefulPhrases,
          language: mission.language,
          opportunityInstances: opportunityInstancesRef.current
            .filter(
              opportunity =>
                opportunity.attemptId === parentAttemptId &&
                opportunity.detection === 'validated' &&
                (opportunity.status === 'presented' || opportunity.status === 'taken')
            )
            .map(opportunity => ({
              id: opportunity.id,
              opportunityId: opportunity.opportunityId,
              skillId: opportunity.skillId,
              status: opportunity.status,
              detection: opportunity.detection,
            })),
        });
        lastAssessmentResponse = response;
        proposal = normalizeAssessmentResponse(
          response,
          sessionId,
          parentAttemptId
        );
      } catch (error) {
        console.warn(
          'Could not remotely assess parent attempt before retry; preserving grounded local phrase evidence only',
          error
        );
      }

      let phraseObservations: LearningObservation[] = [];
      let proposedOutcome: TaskOutcome = 'unknown';

      if (proposal) {
        const validated = validateAssessmentProposal(
          proposal,
          attemptPassages,
          evidenceSupportExposures,
          isRehearsalAttempt
        );
        phraseObservations = validated.validatedObservations;
        proposedOutcome = validated.taskOutcome;
      }

      const local = buildLocalObservations({
        sessionId,
        attemptId: parentAttemptId,
        passages: attemptPassages,
        supportExposures: evidenceSupportExposures,
        candidates: mission.usefulPhrases,
        isColdAttempt: coldAttempt,
        isRehearsalAttempt,
      });
      const phraseKeys = new Set(
        phraseObservations.map(
          observation => `${observation.sourceTurnId}::${observation.itemId}`
        )
      );
      phraseObservations = [
        ...phraseObservations,
        ...local.observations.filter(
          observation =>
            !phraseKeys.has(
              `${observation.sourceTurnId}::${observation.itemId}`
            )
        ),
      ];

      const missionSkillIds = [
        ...mission.primarySkillIds,
        ...mission.secondarySkillIds,
      ];
      const normalizedSkillItems = normalizeSkillItems(
        lastAssessmentResponse,
        missionSkillIds
      );
      const skillProposal: SkillEvidenceProposal = {
        schemaVersion: proposal?.schemaVersion ?? 1,
        sessionId,
        attemptId: parentAttemptId,
        taskOutcome: proposedOutcome,
        skillItems: normalizedSkillItems,
      };
      const opportunityAssessmentView = prepareOpportunityAssessmentView({
        existing: opportunityInstancesRef.current,
        candidates: normalizedSkillItems,
        passages: attemptPassages,
      });
      const skillValidation = validateSkillEvidenceProposal(skillProposal, {
        sessionId,
        attemptId: parentAttemptId,
        mission,
        passages: allPassages,
        supportExposures: evidenceSupportExposures,
        opportunityInstances: opportunityAssessmentView,
        isRehearsalAttempt,
        // A retry is an explicit continuation, not a natural completed failure.
        // Positive grounded evidence is preserved, but no lapse is derived here.
        sessionEndReason: 'user_ended',
        evidenceSource: 'validated_explicit',
      });

      opportunityInstancesRef.current =
        commitValidatedOpportunityDemonstrations({
          existing: opportunityInstancesRef.current,
          validated: skillValidation.validated,
          passages: attemptPassages,
        });

      finalizedAttemptEvidenceRef.current.push({
        attemptId: parentAttemptId,
        observations: phraseObservations,
        skillObservations: skillValidation.validated,
        skillLapses: skillValidation.lapses,
      });
      finalizedAttemptIdsRef.current.add(parentAttemptId);
    },
    [coldAttempt, historicalSupportExposures, mission, sessionId]
  );

  const handleRetryCheckpoint = async () => {
    const currentPassages = passagesRef.current;
    const mirror = sceneMirrorRef.current;
    if (currentPassages.length <= 1 || !mirror) return;

    voiceTransportRef.current?.stopPlayback();
    voiceTransportRef.current?.stopListening();

    const authoritative = mirror.snapshot;
    const currentRevision =
      authoritative?.revision ?? sceneStateRef.current.revision;
    const runtimeCheckpoints = (
      authoritative?.checkpoints ?? sceneStateRef.current.checkpoints
    )
      .filter(
        checkpoint =>
          typeof checkpoint.sceneRevision === 'number' &&
          checkpoint.sceneRevision < currentRevision
      )
      .sort(
        (a, b) =>
          (a.sceneRevision ?? 0) - (b.sceneRevision ?? 0)
      );

    // Never invent an authored checkpoint. If no prior checkpoint exists, the
    // only synthetic restore point is the deterministic initial scene revision.
    const selected = runtimeCheckpoints.at(-1);
    let passageIndex = 0;
    if (selected) {
      const checkpointTime = Date.parse(selected.timestamp);
      for (let index = 0; index < currentPassages.length; index += 1) {
        const passageTime = Date.parse(currentPassages[index].startedAt);
        if (
          Number.isFinite(checkpointTime) &&
          Number.isFinite(passageTime) &&
          passageTime <= checkpointTime
        ) {
          passageIndex = index;
        }
      }
    }

    const checkpoint: RoleplayCheckpoint = {
      id: selected?.id ?? 'scene-start',
      sceneRevision: selected?.sceneRevision ?? 1,
      passageIndex,
      // This is intentionally captured at retry time, not checkpoint time.
      // Support shown after the scene checkpoint remains known to the learner.
      supportLedgerHighWaterMark: supportExposuresRef.current.length,
    };

    // Freeze the parent attempt's grounded evidence before any scene/passages are
    // rewound. Failure to reach the assessor never blocks Retry; the local phrase
    // fallback still preserves grounded production.
    try {
      await finalizeAttemptBeforeRetry(attemptId, currentPassages);
    } catch (error) {
      console.warn('Could not finalize parent attempt evidence before retry', error);
    }

    // The server verifies checkpoint id + revision against replayed authoritative parent state; semantic opportunity judgments never enter the restore contract.
    const forkedAttemptId = await mirror.fork(checkpoint, true);
    if (!forkedAttemptId) {
      setSceneEventNotice(t.live.sceneDirectorUnavailable);
      setTimeout(() => setSceneEventNotice(null), 4000);
      voiceTransportRef.current?.startListening();
      return;
    }

    const retryRecordedAt = new Date().toISOString();
    priorAttemptPassagesRef.current = mergeAttemptPassages(
      priorAttemptPassagesRef.current,
      currentPassages
    );

    setSupportExposures(prev => {
      const inherited = inheritSupportForRetry({
        exposures: prev,
        fromAttemptId: attemptId,
        toAttemptId: forkedAttemptId,
        supportLedgerHighWaterMark: checkpoint.supportLedgerHighWaterMark,
        recordedAt: retryRecordedAt,
      });
      supportExposuresRef.current = inherited;
      return inherited;
    });

    const forkState = mirror.snapshot;
    if (forkState) {
      setSceneState(prev => ({
        ...prev,
        sceneId: forkState.sceneId,
        revision: forkState.revision,
        facts: forkState.facts,
        actionCounts: forkState.actionCounts,
        checkpoints: forkState.checkpoints,
        isFinished: forkState.isFinished,
        outcome: forkState.outcome,
      }));
    }

    setAttemptId(forkedAttemptId);
    setPassages(currentPassages.slice(0, checkpoint.passageIndex + 1));
    setIsSceneFrozen(false);
    setActiveCoachAdvice(null);
    setActiveCoachAudioTarget(null);
    setSceneEventNotice(t.live.rehearsalRestored);
    setTimeout(() => setSceneEventNotice(null), 4000);
    voiceTransportRef.current?.startListening();
  };

  /**
   * Ends the session and assesses it.
   *
   * `reason` matters for evidence: a session the learner walked away from is not a
   * failed attempt, and must not produce a lapse. The inactivity controller passes
   * `time_limit` when it ends a conversation; every other caller reaches a natural
   * conclusion and is `completed`.
   */
  const handleFinishConversation = useCallback(
    async (endReason: SessionRecord['endReason'] = 'completed') => {
    if (!mission || isEndingRef.current) return;
    isEndingRef.current = true;

    /*
      Invalidate anything already in flight before writing the transcript.

      A reply that is on its way right now still holds a reference to this session's
      passages. Without this it can land after the record has been written, appending
      to a list that is no longer rendered and, worse, writing this session's words
      into the next one's transcript. The check belongs at commit time for exactly
      that reason: a request valid five seconds ago can be invalid now.
    */
    invalidateGeneration();

    conversationProviderRef.current?.cancel?.();
    voiceTransportRef.current?.stopPlayback();
    voiceTransportRef.current?.stopListening();
    setVoiceState('ending');

    // Assessment only sees the current attempt. The archive keeps every prior
    // attempt so retry never erases learner evidence or transcript provenance.
    const visiblePassages = passagesRef.current;
    const currentAttemptPassages = visiblePassages.filter(
      passage => passage.attemptId === attemptId
    );
    const evidenceSupportExposures = [
      ...historicalSupportExposures,
      ...supportExposures,
    ];
    const archivedPassages = mergeAttemptPassages(
      priorAttemptPassagesRef.current,
      visiblePassages
    );
    const finalSceneState = sceneStateRef.current;
    const wasRehearsal = attemptId !== 'attempt-1';

    let finalOpportunityInstances = opportunityInstancesRef.current;
    const authoredScene = mission.sceneId ? getScene(mission.sceneId) : undefined;
    if (authoredScene && finalSceneState.sceneId === authoredScene.id) {
      const authoritativeSnapshot = {
        sceneId: finalSceneState.sceneId,
        sessionId,
        attemptId,
        revision: finalSceneState.revision,
        facts: finalSceneState.facts,
        actionCounts: finalSceneState.actionCounts ?? {},
        checkpoints: toRuntimeCheckpoints(finalSceneState.checkpoints),
        isFinished: finalSceneState.isFinished,
        outcome: finalSceneState.outcome,
        firedComplications: [] as string[],
      };

      finalOpportunityInstances = syncAuthoredOpportunities({
        scene: authoredScene,
        state: authoritativeSnapshot,
        existing: finalOpportunityInstances,
        recordedAt: new Date().toISOString(),
      });
      finalOpportunityInstances = finalizeNotPresentedOpportunities({
        scene: authoredScene,
        state: authoritativeSnapshot,
        existing: finalOpportunityInstances,
        recordedAt: new Date().toISOString(),
      });
      opportunityInstancesRef.current = finalOpportunityInstances;
    }

    // The assessor proposes; the deterministic core decides. If the model is
    // unreachable we fall back to the same local rules rather than a looser
    // path, so a network failure can never overstate what was produced.
    let proposal: StructuredAssessmentProposal | null = null;
    let assessmentUnavailable = false;
    // Held so the skill proposals can be read even when phrase normalisation has
    // already discarded something. Both come from the same model response.
    let lastAssessmentResponse: unknown = null;

    try {
      const response = await api.assessment({
        sessionId,
        attemptId,
        // Lets the server tell the model which skills are creditable. Membership is
        // still validated client-side; this only narrows what is offered.
        missionId: mission.id,
        passages: currentAttemptPassages,
        supportExposures: evidenceSupportExposures,
        usefulPhrases: mission.usefulPhrases,
        language: mission.language,
        opportunityInstances: finalOpportunityInstances
          .filter(
            opportunity =>
              opportunity.attemptId === attemptId &&
              opportunity.detection === 'validated' &&
              (opportunity.status === 'presented' || opportunity.status === 'taken')
          )
          .map(opportunity => ({
            id: opportunity.id,
            opportunityId: opportunity.opportunityId,
            skillId: opportunity.skillId,
            status: opportunity.status,
            detection: opportunity.detection,
          })),
      });
      lastAssessmentResponse = response;
      proposal = normalizeAssessmentResponse(response, sessionId, attemptId);
    } catch (fetchErr) {
      assessmentUnavailable = true;
      console.warn('Remote assessment unavailable, using local grounded evaluation:', fetchErr);
    }

    let finalObservations: LearningObservation[] = [];
    let rejectedCount = 0;
    let ambiguousCount = 0;
    let proposedOutcome: TaskOutcome = 'unknown';

    if (proposal) {
      const validated = validateAssessmentProposal(
        proposal,
        currentAttemptPassages,
        evidenceSupportExposures,
        wasRehearsal
      );
      finalObservations = validated.validatedObservations;
      rejectedCount = validated.rejectedProposals.length;
      proposedOutcome = validated.taskOutcome;
    }

    /**
     * Skill evidence.
     *
     * The view does not decide what the learner demonstrated. It hands the model's
     * proposals plus the real runtime facts to the validator and persists only what
     * survived, so the same checks apply whether the evidence came from a live
     * session or from a test.
     *
     * The context identifiers below come from the mission and this attempt, never
     * from the model, so a proposal cannot relocate evidence into a situation the
     * learner was never in.
     */
    const missionSkillIds = [...mission.primarySkillIds, ...mission.secondarySkillIds];
    const normalizedSkillItems = normalizeSkillItems(lastAssessmentResponse, missionSkillIds);
    const skillProposal: SkillEvidenceProposal = {
      schemaVersion: proposal?.schemaVersion ?? 1,
      sessionId,
      attemptId,
      taskOutcome: proposedOutcome,
      skillItems: normalizedSkillItems,
    };

    const opportunityAssessmentView = prepareOpportunityAssessmentView({
      existing: finalOpportunityInstances,
      candidates: normalizedSkillItems,
      passages: currentAttemptPassages,
    });

    const skillValidation = validateSkillEvidenceProposal(skillProposal, {
      sessionId,
      attemptId,
      mission,
      passages: archivedPassages,
      supportExposures: evidenceSupportExposures,
      opportunityInstances: opportunityAssessmentView,
      isRehearsalAttempt: wasRehearsal,
      sessionEndReason: endReason,
      // A live session only ever writes validated evidence. `legacy_inferred` is
      // produced solely by migration/backfill.
      evidenceSource: 'validated_explicit',
    });

    const validatedSkillObservations = skillValidation.validated;
    const skillEvidenceIssues = skillValidation.rejected;
    const skillLapses = skillValidation.lapses;

    finalOpportunityInstances = commitValidatedOpportunityDemonstrations({
      existing: finalOpportunityInstances,
      validated: validatedSkillObservations,
      passages: currentAttemptPassages,
    });
    opportunityInstancesRef.current = finalOpportunityInstances;

    if (skillEvidenceIssues.length > 0) {
      console.warn(
        `Skill evidence: ${skillEvidenceIssues.length} proposal(s) rejected`,
        skillEvidenceIssues.map(i => `${i.check}:${i.candidate.skillId}`)
      );
    }

    // Always cross-check the model's claims against the transcript. This catches
    // a model that validated fine on paper but matched nothing the learner said.
    const local = buildLocalObservations({
      sessionId,
      attemptId,
      passages: currentAttemptPassages,
      supportExposures: evidenceSupportExposures,
      candidates: mission.usefulPhrases,
      isColdAttempt: coldAttempt,
      isRehearsalAttempt: wasRehearsal,
    });
    ambiguousCount = local.ambiguous;

    const validatedIds = new Set(finalObservations.map(o => `${o.sourceTurnId}:${o.itemId}`));
    const extraVerified = local.observations.filter(
      o => !validatedIds.has(`${o.sourceTurnId}:${o.itemId}`)
    );
    finalObservations = [...finalObservations, ...extraVerified];

    if (rejectedCount > 0) {
      console.warn(
        `Assessment: ${rejectedCount} proposal(s) rejected, ${ambiguousCount} ambiguous, ${extraVerified.length} confirmed locally`
      );
    }

    const userPassages = currentAttemptPassages.filter(p => p.speaker === 'user');
    const hasLearnerSpeech = userPassages.length > 0;

    const mergedEvidence = mergeFinalizedAttemptEvidence({
      finalizedAttempts: finalizedAttemptEvidenceRef.current,
      current: {
        observations: finalObservations,
        skillObservations: validatedSkillObservations,
        skillLapses,
      },
    });

    // Map the assessor's scene-level outcome onto the receipt's vocabulary.
    // `unknown` is preserved rather than collapsed into a flattering label.
    let resolvedOutcome: SessionRecord['taskOutcome'];
    if (!hasLearnerSpeech) {
      // Silence is not a lapse, and it is not evidence of success either.
      resolvedOutcome = 'unknown';
    } else {
      switch (proposedOutcome) {
        case 'achieved':
          resolvedOutcome = 'completed';
          break;
        case 'partial':
          resolvedOutcome = 'partly_completed';
          break;
        case 'not_achieved':
          resolvedOutcome = 'changed_direction';
          break;
        default:
          resolvedOutcome = 'unknown';
      }
    }

    onEndSession({
      id: sessionId,
      missionId: mission.id,
      missionVersion: mission.version,
      language: mission.language,
      mode,
      coldAttempt,
      state: 'recap_ready',
      startedAt: initialSession.startedAt,
      endedAt: new Date().toISOString(),
      endReason,
      passages: archivedPassages,
      supportExposures,
      opportunityInstances: finalOpportunityInstances,
      observations: mergedEvidence.observations,
      // Only validated evidence reaches the archive, written in the same
      // transaction as the transcript it cites.
      skillObservations: mergedEvidence.skillObservations,
      skillLapses: mergedEvidence.skillLapses,
      taskOutcome: resolvedOutcome,
      sceneState: finalSceneState,
      summary: proposal?.outcomeReasoning ?? buildHonestSummary(assessmentUnavailable, mergedEvidence.observations.length, hasLearnerSpeech),
      actionableFeedback: proposal?.actionableFeedback ?? [
        ...(mergedEvidence.observations.length > 0
          ? [t.live.feedbackGoodEngagement]
          : []),
        t.live.feedbackReviewDue,
      ],
      operationalTelemetry: operationalTelemetryRef.current,
    });
  }, [
    attemptId,
    coldAttempt,
    initialSession.startedAt,
    mission,
    mode,
    onEndSession,
    t.live,
    sessionId,
    supportExposures,
    historicalSupportExposures,
  ]);

  if (!mission) return null;

  const latestAssistantPassage = [...passages].reverse().find(p => p.speaker === 'assistant');
  const olderPassages = latestAssistantPassage
    ? passages.filter(passage => passage.id !== latestAssistantPassage.id).slice(-6)
    : passages.slice(-6);
  const voiceLabel = isSceneFrozen
    ? t.live.pausedTag
    : voiceState === 'connecting'
      ? t.live.connecting
      : voiceState === 'listening'
        ? t.live.listening
        : voiceState === 'speaking'
          ? t.live.characterSpeaking
          : voiceState === 'muted'
            ? t.live.voiceMuted
            : voiceState === 'paused'
              ? t.live.pausedTag
              : voiceState === 'ending'
                ? t.live.ending
                : voiceState === 'reconnecting'
                  ? t.live.reconnecting
                  : voiceState === 'error'
                    ? t.live.voiceFailed
                    : t.live.tapToSpeak;

  const recordAssistantAudioExposure = useCallback(
    (passage: Passage, kind: 'assistant_audio_replay' | 'assistant_audio_slow') => {
      const exposure: SupportExposure = {
        id: `exp-${kind}-${passage.id}-${Date.now()}`,
        sessionId,
        attemptId,
        turnId: passage.id,
        source: 'actor',
        kind,
        targetItemIds: [],
        exposure: 'played',
        policyVersion: LEARNING_POLICY_VERSION,
        recordedAt: new Date().toISOString(),
      };
      setSupportExposures(prev => [...prev, exposure]);
    },
    [attemptId, sessionId]
  );

  const replayAssistantLine = useCallback(
    async (passage: Passage, speed = 1) => {
      const transport = voiceTransportRef.current;
      if (!transport) return;

      recordAssistantAudioExposure(
        passage,
        speed < 1 ? 'assistant_audio_slow' : 'assistant_audio_replay'
      );

      await speakWithBestAvailable(transport, passage.text, {
        language: mission.language,
        speed,
        style: mission.character.voiceStyle,
      });
    },
    [mission.character.voiceStyle, mission.language, recordAssistantAudioExposure]
  );

  const playCoachModelPhrase = useCallback(async () => {
    if (!activeCoachAudioTarget) return;
    const transport = voiceTransportRef.current;
    if (!transport) return;

    transport.stopPlayback();
    await speakWithBestAvailable(
      transport,
      activeCoachAudioTarget.targetPhraseForm,
      {
        language: mission.language,
        speed: effectiveSpeechRate,
        style: mission.character.voiceStyle,
      }
    );

    const exposure = createModelPhraseAudioExposure({
      sessionId,
      attemptId,
      targetSkillId: activeCoachAudioTarget.targetSkillId,
      targetOpportunityId: activeCoachAudioTarget.targetOpportunityId,
      targetPhraseId: activeCoachAudioTarget.targetPhraseId,
      recordedAt: new Date().toISOString(),
    });
    setSupportExposures(prev => [...prev, exposure]);
  }, [
    activeCoachAudioTarget,
    attemptId,
    effectiveSpeechRate,
    mission.character.voiceStyle,
    mission.language,
    sessionId,
  ]);

  const useCoachTypedExample = useCallback(() => {
    if (!activeCoachAudioTarget) return;

    const exposure = createTypedExampleExposure({
      sessionId,
      attemptId,
      targetSkillId: activeCoachAudioTarget.targetSkillId,
      targetOpportunityId: activeCoachAudioTarget.targetOpportunityId,
      targetPhraseId: activeCoachAudioTarget.targetPhraseId,
      recordedAt: new Date().toISOString(),
    });

    setSupportExposures(prev =>
      prev.some(existing => existing.id === exposure.id) ? prev : [...prev, exposure]
    );
    setTypedMessage(activeCoachAudioTarget.targetPhraseForm);
    setShowTypedInput(true);
  }, [activeCoachAudioTarget, attemptId, sessionId]);

  const requestSupport = (
    kind: 'intent_hint' | 'partial_form' | 'full_form' | 'explanation'
  ) => {
    voiceTransportRef.current?.stopPlayback();
    voiceTransportRef.current?.stopListening();
    setIsSceneFrozen(true);
    setVoiceState('paused');
    void requestCoachHint(kind);
    setShowHelpSheet(false);
  };

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView edges={['top']} className="bg-canvas">
        <View className="w-full self-center flex-row items-center gap-3 px-3 py-2" style={{ maxWidth: 900 }}>
          <Pressable
            onPress={() => void handleFinishConversation('user_ended')}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
            className="h-12 w-12 items-center justify-center rounded-full border border-transparent bg-surface-soft hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
          >
            <X size={21} color={iconColor('ink')} />
          </Pressable>

          <View className="min-w-0 flex-1 items-center">
            <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
              {mission.character.name}
            </Text>
            <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
              {mission.title}
            </Text>
          </View>

          <Pressable
            onPress={toggleFreezeScene}
            accessibilityRole="button"
            accessibilityLabel={isSceneFrozen ? t.common.resumeScene : t.common.freezeScene}
            className={`h-12 w-12 items-center justify-center rounded-full border ${
              isSceneFrozen
                ? 'border-primary bg-card-warm'
                : 'border-transparent bg-surface-soft'
            } hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus`}
          >
            {isSceneFrozen ? (
              <Play size={20} color={iconColor('brand')} fill={iconColor('brand')} />
            ) : (
              <Pause size={20} color={iconColor('ink')} />
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      <View accessibilityLiveRegion="polite" accessible={false}>
        {inactivityCountdown !== null ? (
          <View className="bg-warning-soft px-4 py-2">
            <Text className="text-center text-sm font-semibold text-ink">
              {t.live.sessionEndingSoon} · {inactivityCountdown}
            </Text>
          </View>
        ) : null}
      </View>

      {sceneEventNotice ? (
        <View className="bg-card-warm px-4 py-2">
          <Text className="text-center text-xs font-medium text-primary">{sceneEventNotice}</Text>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingTop: 28,
          paddingBottom: 28,
          gap: 24,
        }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {latestAssistantPassage ? (
          <View className="gap-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-sm font-semibold text-primary">
                {mission.character.name}
              </Text>
              {latestAssistantPassage.meaning ? (
                <Pressable
                  onPress={handleToggleMeaning}
                  accessibilityRole="button"
                  accessibilityLabel={t.common.showTranslation}
                  className="min-h-12 justify-center rounded-full border border-transparent px-3 hover:bg-surface-hover focus:border-2 focus:border-focus"
                >
                  <Text className="text-xs font-semibold text-primary">
                    {t.common.showTranslation}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <Text className="text-[26px] font-medium leading-[35px] tracking-tight text-ink">
              {latestAssistantPassage.text}
            </Text>
          </View>
        ) : null}

        {interimUserText ? (
          <View className="self-end max-w-[88%] rounded-[22px] bg-card-warm px-4 py-3">
            <Text className="text-xs font-semibold text-primary">{t.common.hearingYou}</Text>
            <Text className="mt-1 text-[15px] italic leading-[22px] text-ink">
              {interimUserText}…
            </Text>
          </View>
        ) : null}

        {olderPassages.length > 0 ? (
          <View className="gap-3 pt-4">
            {olderPassages.map(passage => {
              const isUser = passage.speaker === 'user';
              return (
                <View
                  key={passage.id}
                  className={isUser ? 'items-end' : 'items-start'}
                >
                  <View
                    className={`max-w-[84%] rounded-[20px] px-4 py-3 ${
                      isUser ? 'bg-action' : 'bg-surface-soft'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        isUser ? 'text-action-text/80' : 'text-muted'
                      }`}
                    >
                      {isUser ? t.common.you : mission.character.name}
                    </Text>
                    <Text
                      className={`mt-1 text-sm leading-5 ${
                        isUser ? 'text-action-text' : 'text-ink'
                      }`}
                    >
                      {passage.text}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      {isSceneFrozen ? (
        <View className="border-t border-primary/20 bg-card-warm px-4 py-3">
          <View className="w-full self-center gap-3" style={{ maxWidth: 720 }}>
            <View className="flex-row items-start gap-2">
              <Pause size={17} color={iconColor('brand')} style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-primary">{t.live.frozenTag}</Text>
                <Text className="mt-1 text-sm leading-5 text-ink">
                  {isCoachLoading
                    ? t.live.coachAsking
                    : activeCoachAdvice || t.live.pausedTag}
                </Text>
              </View>
            </View>

            {activeCoachAudioTarget && !isCoachLoading ? (
              <View className="gap-2 rounded-2xl border border-primary/20 bg-surface px-3 py-3">
                <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t.common.targetPhrase}
                </Text>
                <Text className="text-sm font-medium leading-5 text-ink">
                  {activeCoachAudioTarget.targetPhraseForm}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <Button
                    label={t.common.listen}
                    onPress={() => void playCoachModelPhrase()}
                    size="sm"
                    variant="ghost"
                    icon={<Volume2 size={15} color={iconColor('brand')} />}
                  />
                  <Button
                    label={t.live.useTypedExample}
                    onPress={useCoachTypedExample}
                    size="sm"
                    variant="secondary"
                  />
                </View>
              </View>
            ) : null}

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  label={t.common.resumeScene}
                  onPress={toggleFreezeScene}
                  variant="secondary"
                />
              </View>
              <View className="flex-1">
                <Button
                  label={t.common.retryTurn}
                  onPress={handleRetryCheckpoint}
                  variant="secondary"
                  icon={<RotateCcw size={16} color={iconColor('muted')} />}
                />
              </View>
            </View>
          </View>
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        {showTypedInput ? (
          <View className="border-t border-border-subtle bg-surface px-4 py-3">
            <View className="w-full self-center gap-2" style={{ maxWidth: 720 }}>
              {lastAssistantError ? (
                <View className="gap-2 rounded-2xl bg-warning-soft p-3">
                  <Text className="text-sm font-medium text-ink">
                    {lastAssistantError.userMessage}
                  </Text>
                  {lastAssistantError.retryable ? (
                    <Button
                      label={t.live.retryConnection}
                      onPress={() => {
                        setLastAssistantError(null);
                        setVoiceState('connecting');
                        if (typedMessage.trim()) {
                          void submitTypedMessage(mission);
                        } else {
                          voiceTransportRef.current?.startListening();
                          setVoiceState('listening');
                        }
                      }}
                      size="sm"
                      className="self-start"
                    />
                  ) : null}
                </View>
              ) : null}

              <View className="flex-row items-end gap-2">
                <View className="flex-1">
                  <Field
                    placeholder={t.live.typePlaceholder}
                    value={typedMessage}
                    onChangeText={setTypedMessage}
                    autoCapitalize="none"
                    returnKeyType="send"
                    onSubmitEditing={() => void submitTypedMessage(mission)}
                    accessibilityLabel={t.live.typePlaceholder}
                  />
                </View>
                <Pressable
                  onPress={() => void submitTypedMessage(mission)}
                  disabled={!typedMessage.trim()}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !typedMessage.trim() }}
                  accessibilityLabel={t.live.send}
                  className={`h-12 w-12 items-center justify-center rounded-xl bg-action ${
                    typedMessage.trim() ? '' : 'opacity-40'
                  } focus:border-2 focus:border-brand-on`}
                >
                  <Send size={17} color={iconColor('brandText')} />
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        <View
          className="border-t border-border-subtle bg-surface px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="w-full self-center gap-3" style={{ maxWidth: 720 }}>
            <View className="flex-row items-center justify-center gap-2">
              <View className={`h-2.5 w-2.5 rounded-full ${VOICE_DOT[voiceState]}`} />
              <Text className="text-xs font-semibold capitalize text-muted">
                {voiceLabel}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                if (VOICE_BLOCKED.has(voiceState)) return;
                if (voiceState === 'listening') {
                  voiceTransportRef.current?.stopListening();
                } else {
                  voiceTransportRef.current?.startListening();
                }
              }}
              disabled={VOICE_BLOCKED.has(voiceState)}
              accessibilityRole="button"
              accessibilityState={{ disabled: VOICE_BLOCKED.has(voiceState) }}
              accessibilityLabel={
                voiceState === 'listening'
                  ? t.live.listening
                  : voiceState === 'reconnecting'
                    ? t.live.reconnecting
                    : voiceState === 'error'
                      ? t.live.voiceFailed
                      : t.live.tapToSpeak
              }
              className={`min-h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-action px-4 ${
                VOICE_BLOCKED.has(voiceState) ? 'opacity-40' : ''
              } active:bg-action-pressed focus:border-2 focus:border-brand-on`}
            >
              <View
                className="h-2.5 w-2.5 rounded-full bg-action-text/60"
                style={{
                  opacity: voiceState === 'listening' ? 0.4 + audioLevel * 0.6 : 0.3,
                  transform: [{ scale: 1 + audioLevel * 0.6 }],
                }}
              />
              {voiceState === 'error' ? (
                <MicOff size={19} color={iconColor('brandText')} />
              ) : (
                <Mic size={19} color={iconColor('brandText')} />
              )}
              <Text className="text-sm font-semibold text-action-text" numberOfLines={1}>
                {voiceState === 'listening'
                  ? t.live.listening
                  : voiceState === 'reconnecting'
                    ? t.live.reconnecting
                    : voiceState === 'error'
                      ? t.live.voiceFailed
                      : t.live.tapToSpeak}
              </Text>
            </Pressable>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowHelpSheet(true)}
                accessibilityRole="button"
                accessibilityLabel={t.common.help}
                className="min-h-12 flex-1 items-center justify-center rounded-xl border border-border-interactive bg-surface hover:bg-surface-hover active:opacity-75 focus:border-2 focus:border-focus"
              >
                <HelpCircle size={18} color={iconColor('brand')} />
                <Text className="mt-1 text-xs font-semibold text-ink">{t.common.help}</Text>
              </Pressable>

              <Pressable
                onPress={() => setShowTypedInput(prev => !prev)}
                accessibilityRole="button"
                accessibilityState={{ selected: showTypedInput }}
                accessibilityLabel={t.live.typeInstead}
                className={`min-h-12 flex-1 items-center justify-center rounded-xl border ${
                  showTypedInput
                    ? 'border-primary bg-card-warm'
                    : 'border-border-interactive bg-surface'
                } hover:bg-surface-hover active:opacity-75 focus:border-2 focus:border-focus`}
              >
                <Keyboard size={18} color={showTypedInput ? iconColor('brand') : iconColor('ink')} />
                <Text className="mt-1 text-xs font-semibold text-ink" numberOfLines={1}>
                  {t.live.typeInstead}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => void handleFinishConversation()}
                accessibilityRole="button"
                accessibilityLabel={t.common.endConversation}
                className="min-h-12 flex-1 items-center justify-center rounded-xl border border-danger/30 bg-danger-soft hover:opacity-90 active:opacity-75 focus:border-2 focus:border-focus"
              >
                <X size={18} color={iconColor('danger')} />
                <Text className="mt-1 text-xs font-semibold text-danger" numberOfLines={1}>
                  {t.common.endConversation}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Sheet
        visible={showHelpSheet}
        onClose={() => setShowHelpSheet(false)}
        title={t.live.coachDrawerTitle}
        size="compact"
      >
        <Text className="text-sm leading-6 text-body">
          {t.live.coachStepIntent}
        </Text>
        <View className="gap-2">
          <Button
            label={t.live.coachStepIntent}
            onPress={() => requestSupport('intent_hint')}
            variant="secondary"
          />
          <Button
            label={t.live.coachStepPartial}
            onPress={() => requestSupport('partial_form')}
            variant="secondary"
          />
          <Button
            label={t.live.coachStepFull}
            onPress={() => requestSupport('full_form')}
            variant="secondary"
          />
          <Button
            label={t.live.coachStepExpl}
            onPress={() => requestSupport('explanation')}
            variant="secondary"
          />
          <Button
            label={t.common.listen}
            onPress={() => {
              if (latestAssistantPassage) {
                void replayAssistantLine(latestAssistantPassage, 1);
              }
              setShowHelpSheet(false);
            }}
            variant="ghost"
          />
          <Button
            label={t.settings.speedSlower}
            onPress={() => {
              if (latestAssistantPassage) {
                void replayAssistantLine(latestAssistantPassage, 0.75);
              }
              setShowHelpSheet(false);
            }}
            variant="ghost"
          />
        </View>
      </Sheet>

      <Sheet
        visible={showMeaningLine && Boolean(latestAssistantPassage?.meaning)}
        onClose={() => setShowMeaningLine(false)}
        title={t.common.meaning}
        size="compact"
      >
        <Text className="text-lg font-medium leading-7 text-ink">
          {latestAssistantPassage?.meaning}
        </Text>
      </Sheet>
    </View>
  );
};
