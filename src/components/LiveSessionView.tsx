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
  X,
} from 'lucide-react-native';
import {
  MissionDefinition,
  Mode,
  Passage,
  SessionRecord,
  SupportExposure,
  SceneState,
  LearningObservation,
  TaskOutcome,
} from '../types';
import { NativeVoiceTransport, VoiceEvent } from '../providers/voice';
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
import { SceneActionName } from '../contracts/scene';
import { Button, Field, SectionLabel } from './ui';
import { Sheet } from './Sheet';
import { iconColor } from '../design/iconColor';

interface LiveSessionViewProps {
  mission: MissionDefinition | null;
  mode: Mode;
  coldAttempt: boolean;
  onEndSession: (session: SessionRecord) => void;
  onCancel: () => void;
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
      supportExposureIds: Array.isArray(item.supportExposureIds)
        ? item.supportExposureIds.filter((id: unknown): id is string => typeof id === 'string')
        : [],
    }));
}

/** Plain-language recap copy. Never implies a level, and never implies failure. */
function buildHonestSummary(
  assessmentUnavailable: boolean,
  observationCount: number,
  hasLearnerSpeech: boolean
): string {
  if (!hasLearnerSpeech) {
    return 'No speech was captured in this conversation, so there is nothing to assess yet.';
  }
  if (assessmentUnavailable) {
    return 'Your conversation is saved. Automated review is unavailable right now, so phrases were matched directly against your transcript.';
  }
  if (observationCount > 0) {
    return 'You communicated your goals clearly in this conversation.';
  }
  return 'Your conversation is saved. No target phrases could be confirmed from what you said.';
}

export const LiveSessionView: React.FC<LiveSessionViewProps> = ({
  mission,
  mode,
  coldAttempt,
  onEndSession,
  onCancel,
}) => {
  const { t, language } = useI18n();
  const insets = useSafeAreaInsets();

  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [attemptId, setAttemptId] = useState('attempt-1');
  const [passages, setPassages] = useState<Passage[]>([]);
  const [supportExposures, setSupportExposures] = useState<SupportExposure[]>([]);
  const [sceneState, setSceneState] = useState<SceneState>(() => ({
    sceneId: mission?.id ?? 'unknown',
    revision: 1,
    facts: { ...(mission?.character ?? {}) },
    learnerKnows: mission ? [mission.learnerGoal] : [],
    characterKnows: mission?.character.knowledgeBoundary ?? [],
    checkpoints: [
      { id: 'cp-start', description: 'Session start', timestamp: new Date().toISOString() },
    ],
    isFinished: false,
    outcome: 'unknown',
  }));

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
      kind: 'meaning',
      // A caption translation is help with the whole line, not with one curated
      // phrase, so no phrase ids are claimed.
      targetItemIds: [],
      exposure: 'visible',
      recordedAt: new Date().toISOString(),
    };

    setSupportExposures(prev =>
      prev.some(e => e.id === exposure.id) ? prev : [...prev, exposure]
    );
  }, [passages, showMeaningLine, sessionId, attemptId]);

  const [showTypedInput, setShowTypedInput] = useState(false);
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
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  const voiceTransportRef = useRef<NativeVoiceTransport | null>(null);
  const sceneMirrorRef = useRef<SceneMirror | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const sceneStateRef = useRef(sceneState);
  const passagesRef = useRef(passages);
  const isMutedRef = useRef(isMuted);
  const isSceneFrozenRef = useRef(isSceneFrozen);
  const isEndingRef = useRef(false);
  const mountedRef = useRef(true);

  sceneStateRef.current = sceneState;
  passagesRef.current = passages;
  isMutedRef.current = isMuted;
  isSceneFrozenRef.current = isSceneFrozen;

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
        const response = await api.actorRespond({
          character: target.character,
          setting: target.setting,
          learnerGoal: target.learnerGoal,
          sceneFacts: sceneStateRef.current.facts,
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
          void applyProposedSceneAction(
            response.proposedAction,
            [userPassageId]
          );
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

        setSceneState(prev => ({
          ...prev,
          revision: prev.revision + 1,
          checkpoints: [
            ...prev.checkpoints,
            {
              id: `cp-${Date.now()}`,
              description: `Turn ${updatedPassages.length + 1}`,
              timestamp: new Date().toISOString(),
            },
          ],
        }));

        if (audioPlaybackEnabled && !isSceneFrozenRef.current) {
          setVoiceState('speaking');
          await voiceTransportRef.current?.playSpeech(response.replyText, {
            audioBase64: response.audioBase64,
            lang: target.language,
          });
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
    [audioPlaybackEnabled, attemptId, explanationLanguage, mode, sessionId]
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
      if (!mirror) return;

      const result = await mirror.propose(
        attemptId,
        proposedAction.name as SceneActionName,
        proposedAction.payload ?? {},
        sourceTurnIds
      );

      if (!result) {
        setSceneEventNotice('Could not reach the scene director. Scene state is unchanged.');
        setTimeout(() => setSceneEventNotice(null), 4000);
        return;
      }

      if (!result.accepted) {
        setSceneEventNotice(
          result.reason
            ? `Not applied: ${result.reason}`
            : 'That action was not permitted here.'
        );
        setTimeout(() => setSceneEventNotice(null), 4000);
        return;
      }

      setSceneState(prev => ({
        ...prev,
        revision: result.revision,
        facts: result.newFacts,
        lastAction: { name: proposedAction.name, actor: mission?.character.name ?? '' },
      }));

      if (proposedAction.name === 'offer_alternative') {
        setSceneEventNotice(
          `${mission?.character.name} checked: oat milk is out, offering almond milk.`
        );
      } else if (proposedAction.name === 'confirm_takeaway') {
        setSceneEventNotice('Order confirmed for takeaway ("para llevar").');
      }

      setTimeout(() => setSceneEventNotice(null), 4000);
    },
    [attemptId, mission?.character.name]
  );

  const requestCoachHint = useCallback(
    async (step: 'intent_hint' | 'partial_form' | 'full_form') => {
      if (!mission) return;
      setIsCoachLoading(true);

      const lastAssistantPassage = [...passagesRef.current]
        .reverse()
        .find(p => p.speaker === 'assistant');

      try {
        const data = await api.coachHint({
          step,
          targetLanguage: mission.language,
          explanationLanguage,
          characterName: mission.character.name,
          lastAssistantLine: lastAssistantPassage?.text ?? '',
          learnerGoal: mission.learnerGoal,
        });
        setActiveCoachAdvice(data.hint);

        const exposure: SupportExposure = {
          id: `exp-${Date.now()}`,
          sessionId,
          attemptId,
          source: 'coach',
          kind: step,
          targetItemIds: mission.usefulPhrases.map(p => p.id),
          exposure: 'visible',
          recordedAt: new Date().toISOString(),
        };
        setSupportExposures(prev => [...prev, exposure]);
      } catch (e) {
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
      const mirror = new SceneMirror(sessionId, mission.sceneId, mission.id);
      sceneMirrorRef.current = mirror;
      void mirror.begin('attempt-1').then(snapshot => {
        if (!snapshot || !mountedRef.current) return;
        setSceneState(prev => ({
          ...prev,
          sceneId: snapshot.sceneId,
          revision: snapshot.revision,
          facts: snapshot.facts,
        }));
      });
    } else {
      sceneMirrorRef.current = null;
    }

    // Support is recorded from the briefing, not just from inside the session.
    // If the learner saw the target wording here, later use of it is assisted —
    // that is what makes the cold-attempt choice meaningful.
    if (!coldAttempt) {
      setSupportExposures([
        {
          id: `exp-briefing-${Date.now()}`,
          sessionId,
          attemptId: 'attempt-1',
          source: 'briefing',
          kind: 'full_form',
          targetItemIds: mission.usefulPhrases.map(p => p.id),
          exposure: 'visible',
          recordedAt: new Date().toISOString(),
        },
      ]);
    } else {
      setSupportExposures([]);
    }

    const transport = new NativeVoiceTransport();
    transport.setLanguage(mission.language);
    voiceTransportRef.current = transport;

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

      await transport.playSpeech(greeting, { lang: mission.language });
      transport.startListening();
    };

    void startInitialTurn();

    return () => {
      isEndingRef.current = true;
      mountedRef.current = false;
      unsubscribe();
      transport.dispose();
      voiceTransportRef.current = null;
      void sceneMirrorRef.current?.close();
      sceneMirrorRef.current = null;
    };
  }, [mission, sessionId, coldAttempt, buildInitialGreeting, handleUserMessage]);

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
      setVoiceState('idle');
      voiceTransportRef.current?.startListening();
    }
  };

  const handleRetryCheckpoint = async () => {
    if (passagesRef.current.length <= 1) return;
    voiceTransportRef.current?.stopPlayback();
    voiceTransportRef.current?.stopListening();

    // Fork a new attempt on the server too. The earlier attempt keeps its own
    // transcript and is marked rehearsal, because the learner has seen the turn.
    const forkedAttemptId = await sceneMirrorRef.current?.fork('cp-start', true);
    const nextAttemptId = forkedAttemptId ?? `attempt-${Date.now()}`;

    setAttemptId(nextAttemptId);
    setPassages(passagesRef.current.slice(0, 1));
    setIsSceneFrozen(false);
    setActiveCoachAdvice(null);
    setSceneEventNotice(
      'Checkpoint restored. This is a rehearsal, so the turn will not count as independent recall.'
    );
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

    voiceTransportRef.current?.stopPlayback();
    voiceTransportRef.current?.stopListening();
    setVoiceState('ending');

    const finalPassages = passagesRef.current;
    const finalSceneState = sceneStateRef.current;
    const wasRehearsal = attemptId !== 'attempt-1';

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
        passages: finalPassages,
        supportExposures,
        usefulPhrases: mission.usefulPhrases,
        language: mission.language,
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
        finalPassages,
        supportExposures,
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
    const skillProposal: SkillEvidenceProposal = {
      schemaVersion: proposal?.schemaVersion ?? 1,
      sessionId,
      attemptId,
      taskOutcome: proposedOutcome,
      skillItems: normalizeSkillItems(lastAssessmentResponse, missionSkillIds),
    };

    const skillValidation = validateSkillEvidenceProposal(skillProposal, {
      sessionId,
      attemptId,
      mission,
      passages: finalPassages,
      supportExposures,
      isRehearsalAttempt: wasRehearsal,
      sessionEndReason: endReason,
      // A live session only ever writes validated evidence. `legacy_inferred` is
      // produced solely by migration/backfill.
      evidenceSource: 'validated_explicit',
    });

    const validatedSkillObservations = skillValidation.validated;
    const skillEvidenceIssues = skillValidation.rejected;
    const skillLapses = skillValidation.lapses;

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
      passages: finalPassages,
      supportExposures,
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

    const userPassages = finalPassages.filter(p => p.speaker === 'user');
    const hasLearnerSpeech = userPassages.length > 0;

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
      startedAt: finalPassages[0]?.startedAt || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      endReason,
      passages: finalPassages,
      supportExposures,
      observations: finalObservations,
      // Only validated evidence reaches the archive, written in the same
      // transaction as the transcript it cites.
      skillObservations: validatedSkillObservations,
      skillLapses,
      taskOutcome: resolvedOutcome,
      sceneState: finalSceneState,
      summary: proposal?.outcomeReasoning ?? buildHonestSummary(assessmentUnavailable, finalObservations.length, hasLearnerSpeech),
      actionableFeedback: proposal?.actionableFeedback ?? [
        ...(finalObservations.length > 0
          ? ['Good engagement! Practising in real-time builds fluency.']
          : []),
        'Review phrases due in your Progress tab to keep retention high.',
      ],
    });
  }, [
    attemptId,
    coldAttempt,
    mission,
    mode,
    onEndSession,
    sessionId,
    supportExposures,
  ]);

  if (!mission) return null;

  const latestAssistantPassage = [...passages].reverse().find(p => p.speaker === 'assistant');
  const olderPassages = latestAssistantPassage
    ? passages.filter(passage => passage.id !== latestAssistantPassage.id).slice(-6)
    : passages.slice(-6);
  const voiceLabel = isSceneFrozen ? t.live.pausedTag : voiceState;

  const requestSupport = (kind: 'intent_hint' | 'partial_form' | 'full_form') => {
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
            onPress={onCancel}
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
                  accessibilityLabel="Send"
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
            label={t.settings.speedSlower}
            onPress={() => {
              if (latestAssistantPassage) {
                void voiceTransportRef.current?.playSpeech(latestAssistantPassage.text, {
                  speed: 0.75,
                  lang: mission.language,
                });
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
      >
        <Text className="text-lg font-medium leading-7 text-ink">
          {latestAssistantPassage?.meaning}
        </Text>
      </Sheet>
    </View>
  );
};
