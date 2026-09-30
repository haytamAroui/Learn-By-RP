import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  Send,
  Keyboard,
  X,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
  ChevronDown,
  Layers
} from 'lucide-react';
import {
  MissionDefinition,
  Mode,
  Passage,
  SessionRecord,
  SupportExposure,
  SceneState
} from '../types';
import { WebVoiceTransport, VoiceEvent } from '../providers/voice/webVoiceTransport';
import { useI18n } from '../features/i18n';

interface LiveSessionViewProps {
  mission: MissionDefinition;
  mode: Mode;
  coldAttempt: boolean;
  onEndSession: (session: SessionRecord) => void;
  onCancel: () => void;
}

export const LiveSessionView: React.FC<LiveSessionViewProps> = ({
  mission,
  mode,
  coldAttempt,
  onEndSession,
  onCancel
}) => {
  const { t, language } = useI18n();
  // Session & Scene State
  const [sessionId] = useState(`session-${Date.now()}`);
  const [attemptId, setAttemptId] = useState(`attempt-1`);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [supportExposures, setSupportExposures] = useState<SupportExposure[]>([]);
  const [sceneState, setSceneState] = useState<SceneState>({
    sceneId: mission.id,
    revision: 1,
    facts: { ...mission.character },
    learnerKnows: [mission.learnerGoal],
    characterKnows: mission.character.knowledgeBoundary,
    checkpoints: [{ id: 'cp-start', description: 'Session start', timestamp: new Date().toISOString() }],
    isFinished: false,
    outcome: 'unknown'
  });

  // Conversation & Audio State
  const [voiceState, setVoiceState] = useState<
    'connecting' | 'listening' | 'speaking' | 'muted' | 'paused' | 'idle' | 'ending'
  >('connecting');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioPlaybackEnabled, setAudioPlaybackEnabled] = useState<boolean>(true);
  const [showMeaningLine, setShowMeaningLine] = useState<boolean>(false);
  const [showTypedInput, setShowTypedInput] = useState<boolean>(false);
  const [typedMessage, setTypedMessage] = useState<string>('');
  const [interimUserText, setInterimUserText] = useState<string>('');
  const [sceneEventNotice, setSceneEventNotice] = useState<string | null>(null);

  // Help & Freeze Overlay State
  const [showHelpSheet, setShowHelpSheet] = useState<boolean>(false);
  const [isSceneFrozen, setIsSceneFrozen] = useState<boolean>(false);
  const [activeCoachAdvice, setActiveCoachAdvice] = useState<string | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState<boolean>(false);
  const [hintLadderStep, setHintLadderStep] = useState<
    'intent_hint' | 'partial_form' | 'full_form'
  >('intent_hint');

  const voiceTransportRef = useRef<WebVoiceTransport | null>(null);
  const passagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize Voice Transport and initial character greeting
  useEffect(() => {
    const transport = new WebVoiceTransport();
    transport.setLanguage(mission.language);
    voiceTransportRef.current = transport;

    const unsubscribe = transport.subscribe((event: VoiceEvent) => {
      switch (event.type) {
        case 'listening_start':
          setVoiceState('listening');
          break;
        case 'listening_end':
          setVoiceState('idle');
          break;
        case 'audio_level':
          setAudioLevel(event.payload);
          break;
        case 'speech_result':
          if (event.payload.isFinal) {
            setInterimUserText('');
            handleUserMessage(event.payload.transcript, 'spoken');
          } else {
            setInterimUserText(event.payload.transcript);
          }
          break;
        case 'playback_start':
          setVoiceState('speaking');
          break;
        case 'playback_end':
          setVoiceState('idle');
          // Automatically listen for user reply once character finishes speaking
          if (!isSceneFrozen && !isMuted) {
            transport.startListening();
          }
          break;
        case 'interrupted':
          // Log partial/interrupted exposure
          break;
        case 'error':
          if (event.payload === 'mic_denied') {
            setShowTypedInput(true);
          }
          break;
      }
    });

    // Initial character turn
    const startInitialTurn = async () => {
      let initialGreeting = '¡Hola! Muy buenos días. ¿Qué te gustaría tomar hoy?';
      let greetingMeaning = 'Hello! Good morning. What would you like to have today?';

      if (mission.language === 'fr') {
        if (mission.category === 'problems') {
          initialGreeting = 'Bonjour ! Bienvenue à la pharmacie. Qu’est-ce qui ne va pas aujourd’hui ?';
          greetingMeaning = 'Good morning! Welcome to the pharmacy. What seems to be the problem today?';
        } else if (mission.category === 'transit') {
          initialGreeting = 'Bonjour ! En quoi puis-je vous renseigner pour votre trajet ?';
          greetingMeaning = 'Hello! How can I help you with your journey?';
        } else if (mission.category === 'cafes' && mission.title.includes('Bistro')) {
          initialGreeting = 'Bonsoir ! Bienvenue au Bistro. Vous êtes deux pour dîner ?';
          greetingMeaning = 'Good evening! Welcome to the Bistro. Table for two for dinner?';
        } else {
          initialGreeting = 'Bonjour ! Bienvenue. Qu’est-ce qui vous ferait plaisir ce matin ?';
          greetingMeaning = 'Good morning! Welcome. What can I get for you this morning?';
        }
      } else if (mission.language === 'de') {
        if (mission.category === 'problems') {
          initialGreeting = 'Guten Tag! Willkommen in der Apotheke. Wie kann ich Ihnen helfen?';
          greetingMeaning = 'Good day! Welcome to the pharmacy. How can I help you?';
        } else if (mission.category === 'transit') {
          initialGreeting = 'Hallo! Suchen Sie eine Fahrkarte oder eine Verbindung?';
          greetingMeaning = 'Hello! Are you looking for a ticket or a connection?';
        } else if (mission.category === 'cafes' && mission.title.includes('Gasthaus')) {
          initialGreeting = 'Guten Abend! Suchen Sie einen schönen Tisch zum Abendessen?';
          greetingMeaning = 'Good evening! Are you looking for a nice table for dinner?';
        } else {
          initialGreeting = 'Guten Morgen! Was darf es denn heute Frisches sein?';
          greetingMeaning = 'Good morning! What fresh items can I get for you today?';
        }
      } else if (mission.language === 'it') {
        if (mission.category === 'problems') {
          initialGreeting = 'Buongiorno! Benvenuto in farmacia. Di cosa hai bisogno?';
          greetingMeaning = 'Good morning! Welcome to the pharmacy. What do you need?';
        } else if (mission.category === 'transit') {
          initialGreeting = 'Buongiorno! Dove devi andare oggi?';
          greetingMeaning = 'Good morning! Where are you traveling today?';
        } else if (mission.category === 'cafes' && mission.title.includes('Trattoria')) {
          initialGreeting = 'Buonasera! Benvenuti da Mario. Volete accomodarvi all’aperto?';
          greetingMeaning = 'Good evening! Welcome to Mario’s. Would you like to sit outside?';
        } else {
          initialGreeting = 'Buongiorno! Prego, cosa ti porto stamattina al banco?';
          greetingMeaning = 'Good morning! Please, what can I get you this morning at the counter?';
        }
      } else if (mission.language === 'ja') {
        if (mission.category === 'problems') {
          initialGreeting = 'こんにちは！薬局へようこそ。どのような症状でお困りですか？';
          greetingMeaning = 'Hello! Welcome to the pharmacy. What symptoms are troubling you?';
        } else if (mission.category === 'transit') {
          initialGreeting = 'いらっしゃいませ！JR日暮里駅です。切符や乗り換えのご案内をいたします。';
          greetingMeaning = 'Welcome! This is JR Nippori Station. How can I assist with tickets or transfers?';
        } else if (mission.category === 'cafes') {
          initialGreeting = 'いらっしゃい！居酒屋まるへようこそ！何名様ですか？';
          greetingMeaning = 'Welcome! Welcome to Izakaya Maru! How many people in your party?';
        } else {
          initialGreeting = 'いらっしゃいませ！お弁当や温かい飲み物はいかがでしょうか？';
          greetingMeaning = 'Welcome! Would you like a lunchbox or warm drink?';
        }
      } else if (mission.language === 'es') {
        if (mission.category === 'problems') {
          initialGreeting = 'Buenos días, bienvenido a la farmacia. ¿Qué síntomas tienes?';
          greetingMeaning = 'Good morning, welcome to the pharmacy. What symptoms do you have?';
        } else if (mission.category === 'transit') {
          initialGreeting = '¡Hola! ¿En qué puedo ayudarte en el metro hoy?';
          greetingMeaning = 'Hello! How can I help you in the metro today?';
        } else if (mission.category === 'services') {
          initialGreeting = 'Hola, buenos días. ¿Vienes a recoger o enviar un paquete?';
          greetingMeaning = 'Hello, good morning. Are you here to pick up or send a parcel?';
        } else if (mission.category === 'social') {
          initialGreeting = '¡Hola vecino! ¿Qué tal? ¿En qué puedo echarte una mano?';
          greetingMeaning = 'Hi neighbor! How is it going? How can I lend a hand?';
        } else if (mission.title.includes('Terraza')) {
          initialGreeting = '¡Buenas noches! Bienvenidos a La Terraza. ¿Buscaban mesa para cenar?';
          greetingMeaning = 'Good evening! Welcome to La Terraza. Looking for a table for dinner?';
        }
      }

      const initialPassage: Passage = {
        id: `p-${Date.now()}`,
        sessionId,
        attemptId,
        speaker: 'assistant',
        revisionKey: 'rev-1',
        assemblyVersion: 1,
        status: 'final',
        text: initialGreeting,
        meaning: greetingMeaning,
        modality: 'spoken',
        startedAt: new Date().toISOString(),
        fragments: [{ id: `f-${Date.now()}`, passageId: `p-${Date.now()}`, origin: 'assistant', text: initialGreeting }]
      };

      setPassages([initialPassage]);
      setVoiceState('speaking');

      // Speak greeting
      await transport.playSpeech(initialGreeting, { lang: mission.language });
      transport.startListening();
    };

    startInitialTurn();

    return () => {
      unsubscribe();
      transport.dispose();
    };
  }, []);

  // Auto scroll transcript to latest line
  useEffect(() => {
    passagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [passages, interimUserText]);

  // Handle user speech or typed submission
  const handleUserMessage = async (text: string, modality: 'spoken' | 'typed') => {
    if (!text.trim()) return;

    // Record user passage
    const userPassageId = `p-${Date.now()}`;
    const userPassage: Passage = {
      id: userPassageId,
      sessionId,
      attemptId,
      speaker: 'user',
      revisionKey: 'rev-1',
      assemblyVersion: 1,
      status: 'final',
      text: text.trim(),
      modality,
      startedAt: new Date().toISOString(),
      fragments: [
        {
          id: `f-${Date.now()}`,
          passageId: userPassageId,
          origin: modality === 'spoken' ? 'asr' : 'typed',
          text: text.trim()
        }
      ]
    };

    const updatedPassages = [...passages, userPassage];
    setPassages(updatedPassages);
    setVoiceState('connecting');

    // Call server actor endpoint
    try {
      const explLang = language === 'fr' ? 'French' : language === 'es' ? 'Spanish' : language === 'nl' ? 'Dutch' : 'English';
      const response = await fetch('/api/actor/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: mission.character,
          setting: mission.setting,
          learnerGoal: mission.learnerGoal,
          sceneFacts: sceneState.facts,
          mode,
          recentPassages: updatedPassages.slice(-5),
          userMessage: text.trim(),
          targetLanguage: mission.language,
          explanationLanguage: explLang
        })
      });

      const data = await response.json();

      // If actor proposed a scene action, execute via reducer
      if (data.proposedAction) {
        handleProposedSceneAction(data.proposedAction);
      }

      // Record character reply passage
      const characterPassage: Passage = {
        id: `p-${Date.now() + 1}`,
        sessionId,
        attemptId,
        speaker: 'assistant',
        revisionKey: 'rev-1',
        assemblyVersion: 1,
        status: 'final',
        text: data.replyText,
        meaning: data.meaning,
        modality: 'spoken',
        startedAt: new Date().toISOString(),
        fragments: [
          {
            id: `f-${Date.now() + 1}`,
            passageId: `p-${Date.now() + 1}`,
            origin: 'assistant',
            text: data.replyText
          }
        ]
      };

      setPassages([...updatedPassages, characterPassage]);

      // Checkpoint addition
      setSceneState(prev => ({
        ...prev,
        revision: prev.revision + 1,
        checkpoints: [
          ...prev.checkpoints,
          {
            id: `cp-${Date.now()}`,
            description: `Turn ${updatedPassages.length + 1}`,
            timestamp: new Date().toISOString()
          }
        ]
      }));

      // Speak response if audio playback is enabled and scene is not frozen
      if (audioPlaybackEnabled && !isSceneFrozen) {
        setVoiceState('speaking');
        await voiceTransportRef.current?.playSpeech(data.replyText, {
          audioBase64: data.audioBase64,
          lang: mission.language
        });
      } else {
        setVoiceState('idle');
      }
    } catch (err) {
      console.error('Actor respond error', err);
      setVoiceState('idle');
    }
  };

  const handleProposedSceneAction = async (proposedAction: { name: string; payload?: any }) => {
    try {
      const res = await fetch('/api/scene/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentFacts: sceneState.facts,
          actionName: proposedAction.name,
          payload: proposedAction.payload
        })
      });
      const result = await res.json();
      if (result.accepted) {
        setSceneState(prev => ({
          ...prev,
          facts: result.newFacts,
          lastAction: { name: proposedAction.name, actor: mission.character.name }
        }));
        if (proposedAction.name === 'offer_alternative') {
          setSceneEventNotice(`${mission.character.name} checked: oat milk is out, offering almond milk.`);
        } else if (proposedAction.name === 'confirm_takeaway') {
          setSceneEventNotice(`Order confirmed for takeaway ("para llevar").`);
        }
        setTimeout(() => setSceneEventNotice(null), 4000);
      }
    } catch (e) {
      console.error('Scene action error', e);
    }
  };

  // Help ladder: intent -> partial -> full
  const requestCoachHint = async (step: 'intent_hint' | 'partial_form' | 'full_form') => {
    setIsCoachLoading(true);
    const lastAssistantPassage = [...passages].reverse().find(p => p.speaker === 'assistant');

    try {
      const explLang = language === 'fr' ? 'French' : language === 'es' ? 'Spanish' : language === 'nl' ? 'Dutch' : 'English';
      const res = await fetch('/api/coach/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          targetLanguage: mission.language,
          explanationLanguage: explLang,
          characterName: mission.character.name,
          lastAssistantLine: lastAssistantPassage?.text || '',
          learnerGoal: mission.learnerGoal
        })
      });
      const data = await res.json();
      setActiveCoachAdvice(data.hint);

      // Record support exposure in ledger!
      const exposure: SupportExposure = {
        id: `exp-${Date.now()}`,
        sessionId,
        attemptId,
        source: 'coach',
        kind: step,
        targetItemIds: mission.usefulPhrases.map(p => p.id),
        exposure: 'visible',
        recordedAt: new Date().toISOString()
      };
      setSupportExposures(prev => [...prev, exposure]);
    } catch (e) {
      setActiveCoachAdvice('Try expressing your order in simple, clear words.');
    } finally {
      setIsCoachLoading(false);
    }
  };

  // Freeze the scene
  const toggleFreezeScene = () => {
    if (!isSceneFrozen) {
      // Freeze
      voiceTransportRef.current?.stopPlayback();
      voiceTransportRef.current?.stopListening();
      setIsSceneFrozen(true);
      setVoiceState('paused');
      // Fetch private coach strategy
      requestCoachHint('intent_hint');
    } else {
      // Resume
      setIsSceneFrozen(false);
      setActiveCoachAdvice(null);
      setVoiceState('idle');
      voiceTransportRef.current?.startListening();
    }
  };

  // Retry from checkpoint
  const handleRetryCheckpoint = () => {
    if (passages.length <= 1) return;
    voiceTransportRef.current?.stopPlayback();
    voiceTransportRef.current?.stopListening();

    // Fork attempt into a rehearsed attempt
    setAttemptId(`attempt-${Date.now()}`);
    // Roll back to after initial greeting
    setPassages(passages.slice(0, 1));
    setIsSceneFrozen(false);
    setActiveCoachAdvice(null);
    setSceneEventNotice('Checkpoint restored: Try your response again.');
    setTimeout(() => setSceneEventNotice(null), 3000);
    voiceTransportRef.current?.startListening();
  };

  // Conclude session & invoke structured assessment
  const handleFinishConversation = async () => {
    voiceTransportRef.current?.stopPlayback();
    voiceTransportRef.current?.stopListening();

    setVoiceState('ending');

    try {
      let assessmentProposal: any = null;
      try {
        const res = await fetch('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            attemptId,
            passages,
            supportExposures,
            usefulPhrases: mission.usefulPhrases,
            language: mission.language
          })
        });
        if (res.ok) {
          assessmentProposal = await res.json();
        }
      } catch (fetchErr) {
        console.warn('Remote assessment unavailable, using local grounded evaluation:', fetchErr);
      }

      // If remote proposal succeeded with items, map them; otherwise build grounded local observations
      const userPassages = passages.filter(p => p.speaker === 'user');
      let finalObservations: any[] = [];

      if (assessmentProposal && Array.isArray(assessmentProposal.items) && assessmentProposal.items.length > 0) {
        finalObservations = assessmentProposal.items.map((item: any) => ({
          observationId: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sessionId,
          attemptId,
          sourceTurnId: item.sourcePassageId || 'turn-1',
          sourceRevision: item.sourceRevision || 'rev-1',
          itemId: item.candidateItemId || item.itemId || 'phrase-custom',
          candidateForm: item.candidateForm,
          meaning: item.meaning,
          quote: item.quote,
          modality: item.modality || 'spoken',
          retrieval: supportExposures.length > 0 || !coldAttempt ? 'assisted' : 'unassisted',
          taskOutcome: assessmentProposal.taskOutcome || 'completed',
          rehearsal: attemptId !== 'attempt-1',
          supportExposureIds: supportExposures.map(e => e.id),
          recordedAt: new Date().toISOString()
        }));
      } else {
        // Deterministic client-side quote matcher
        for (const phrase of mission.usefulPhrases) {
          const match = userPassages.find(p =>
            p.text && p.text.toLowerCase().includes(phrase.form.toLowerCase().slice(0, 8))
          );
          if (match) {
            finalObservations.push({
              observationId: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              sessionId,
              attemptId,
              sourceTurnId: match.id,
              sourceRevision: match.revisionKey || 'rev-1',
              itemId: phrase.id,
              candidateForm: phrase.form,
              meaning: phrase.meaning,
              quote: match.text,
              modality: match.modality || 'spoken',
              retrieval: supportExposures.length > 0 || !coldAttempt ? 'assisted' : 'unassisted',
              taskOutcome: 'completed',
              rehearsal: attemptId !== 'attempt-1',
              supportExposureIds: supportExposures.map(e => e.id),
              recordedAt: new Date().toISOString()
            });
          }
        }
      }

      const finalRecord: SessionRecord = {
        id: sessionId,
        missionId: mission.id,
        missionVersion: mission.version,
        language: mission.language,
        mode,
        coldAttempt,
        state: 'recap_ready',
        startedAt: passages[0]?.startedAt || new Date().toISOString(),
        endedAt: new Date().toISOString(),
        endReason: 'completed',
        passages,
        supportExposures,
        observations: finalObservations,
        taskOutcome: assessmentProposal?.taskOutcome || (finalObservations.length > 0 ? 'completed' : 'partly_completed'),
        sceneState,
        summary: assessmentProposal?.outcomeReasoning || (finalObservations.length > 0 ? 'You communicated your goals clearly in this conversation.' : 'Conversation completed.'),
        actionableFeedback: assessmentProposal?.actionableFeedback || [
          'Good engagement! Practising in real-time builds fluency.',
          'Review phrases due in your Progress tab to keep retention high.'
        ]
      };

      onEndSession(finalRecord);
    } catch (e) {
      console.warn('Session completion notice:', e);
      // Graceful fallback
      const fallbackRecord: SessionRecord = {
        id: sessionId,
        missionId: mission.id,
        missionVersion: mission.version,
        language: mission.language,
        mode,
        coldAttempt,
        state: 'recap_ready',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        endReason: 'completed',
        passages,
        supportExposures,
        observations: [],
        taskOutcome: 'partly_completed',
        sceneState
      };
      onEndSession(fallbackRecord);
    }
  };

  const latestAssistantPassage = [...passages].reverse().find(p => p.speaker === 'assistant');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas text-heading transition-colors duration-200">
      {/* 1. Header Bar: Scene Label, Objective, Freeze & End */}
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5 text-xs text-muted flex-wrap">
            <span className="font-semibold text-heading truncate max-w-[120px] sm:max-w-none">{mission.title}</span>
            <span>·</span>
            <span className="truncate">{mission.character.name}</span>
            <span className="hidden sm:inline">·</span>
            <span className="capitalize hidden sm:inline">{t.modes[mode] || mode}</span>
          </div>
          <div className="text-[11px] sm:text-xs text-body mt-0.5 truncate max-w-[220px] sm:max-w-none">
            <strong className="text-heading font-medium">{t.common.goal}</strong> {mission.learnerGoal}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Freeze scene toggle */}
          <button
            onClick={toggleFreezeScene}
            className={`flex items-center gap-1 sm:gap-1.5 rounded-xl border px-2.5 py-1.5 sm:px-3 text-xs font-medium transition-all ${
              isSceneFrozen
                ? 'border-primary bg-card-warm text-primary'
                : 'border-border-subtle bg-surface-sunken text-heading hover:bg-surface-hover'
            }`}
            title={isSceneFrozen ? t.common.resumeScene : t.common.freezeScene}
            aria-label={isSceneFrozen ? t.common.resumeScene : t.common.freezeScene}
          >
            {isSceneFrozen ? (
              <>
                <Play className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="hidden xs:inline">{t.common.resumeScene}</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">{t.common.freezeScene}</span>
              </>
            )}
          </button>

          {/* End session */}
          <button
            onClick={handleFinishConversation}
            className="rounded-xl bg-primary px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark shadow-xs transition-all active:scale-95"
          >
            {t.common.endConversation}
          </button>
        </div>
      </div>

      {/* Scene Event Notification Banner */}
      {sceneEventNotice && (
        <div className="bg-card-warm px-4 py-2 text-center text-xs font-medium text-primary border-b border-primary/20 animate-fadeIn">
          {sceneEventNotice}
        </div>
      )}

      {/* 2. Main Live Conversation Viewport */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-6 max-w-3xl mx-auto w-full">
        {/* Latest Assistant Spoken Line (Primary Focal Anchor) */}
        {latestAssistantPassage && (
          <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-medium text-heading">{mission.character.name}</span>
              <button
                onClick={() => setShowMeaningLine(!showMeaningLine)}
                className="text-xs text-primary hover:underline font-medium"
              >
                {showMeaningLine ? t.common.hideTranslation : t.common.showTranslation}
              </button>
            </div>

            <div className="font-display text-2xl sm:text-3xl font-medium leading-snug text-heading">
              "{latestAssistantPassage.text}"
            </div>

            {showMeaningLine && latestAssistantPassage.meaning && (
              <div className="rounded-xl bg-surface-sunken p-3 text-xs text-body border border-border-subtle">
                <strong className="text-heading font-medium">{t.common.meaning} </strong>
                {latestAssistantPassage.meaning}
              </div>
            )}
          </div>
        )}

        {/* Live Interim Recognized User Speech */}
        {interimUserText && (
          <div className="rounded-xl border border-dashed border-primary/40 bg-card-warm p-4 text-sm text-heading italic animate-pulse">
            {t.common.hearingYou} "{interimUserText}..."
          </div>
        )}

        {/* Transcript Log (Scrollable) */}
        <div className="space-y-3 pt-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t.recap.transcriptTitle}
          </div>
          {passages.map(passage => {
            const isUser = passage.speaker === 'user';
            return (
              <div
                key={passage.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                    isUser
                      ? 'bg-primary text-white rounded-br-xs shadow-xs'
                      : 'bg-surface border border-border-subtle text-heading rounded-bl-xs shadow-2xs'
                  }`}
                >
                  <div className={`text-[10px] mb-0.5 ${isUser ? 'text-white/80' : 'text-faint'}`}>
                    {isUser ? `${t.common.you} (${passage.modality})` : mission.character.name}
                  </div>
                  <div>{passage.text}</div>
                </div>
              </div>
            );
          })}
          <div ref={passagesEndRef} />
        </div>
      </div>

      {/* 3. Freeze Scene / Coach Advice Overlay */}
      {isSceneFrozen && (
        <div className="border-t border-primary/20 bg-card-warm p-4 text-xs">
          <div className="mx-auto max-w-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <Pause className="h-3.5 w-3.5" />
                <span>{t.live.frozenTag}</span>
              </div>
              <p className="text-heading">
                {isCoachLoading ? t.live.coachAsking : activeCoachAdvice || t.live.coachStepIntent}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => requestCoachHint('partial_form')}
                className="rounded-xl border border-primary/30 bg-surface px-3 py-1.5 text-xs font-medium text-primary hover:bg-surface-hover shadow-2xs"
              >
                {t.live.coachStepPartial}
              </button>
              <button
                onClick={handleRetryCheckpoint}
                className="flex items-center gap-1 rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-heading hover:bg-surface-hover shadow-2xs"
              >
                <RotateCcw className="h-3.5 w-3.5 text-muted" />
                <span>{t.common.retryTurn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Typed Input Fallback Drawer */}
      {showTypedInput && (
        <div className="border-t border-border-subtle bg-surface p-3">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleUserMessage(typedMessage, 'typed');
              setTypedMessage('');
            }}
            className="mx-auto max-w-3xl flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={t.live.typePlaceholder}
              value={typedMessage}
              onChange={e => setTypedMessage(e.target.value)}
              className="flex-1 rounded-xl border border-border-subtle bg-surface-sunken px-4 py-2 text-xs sm:text-sm text-heading placeholder:text-faint focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={!typedMessage.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-40 shadow-xs"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* 5. Bottom Conversation Controls Bar */}
      <div className="border-t border-border-subtle bg-surface px-3 py-2.5 sm:px-6 sm:py-3 pb-safe">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-2">
          {/* Audio toggle & speech state indicator */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                voiceTransportRef.current?.setMuted(nextMuted);
              }}
              className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition-colors ${
                isMuted
                  ? 'border-red-300 bg-red-500/10 text-red-500'
                  : 'border-border-subtle bg-surface-sunken text-heading hover:bg-surface-hover'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Voice state badge with visual pulse */}
            <div className="hidden xs:flex items-center gap-1.5 text-xs">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  voiceState === 'listening'
                    ? 'bg-primary animate-ping'
                    : voiceState === 'speaking'
                    ? 'bg-accent-sage'
                    : voiceState === 'paused'
                    ? 'bg-warning'
                    : 'bg-muted'
                }`}
              />
              <span className="capitalize text-muted font-medium text-[11px] sm:text-xs">
                {isSceneFrozen ? t.live.pausedTag : voiceState}
              </span>
            </div>
          </div>

          {/* Primary Mic Trigger Button (Tap to talk or Continuous) */}
          <div className="flex items-center justify-center flex-1 max-w-[200px] sm:max-w-none">
            <button
              onClick={() => {
                if (voiceState === 'listening') {
                  voiceTransportRef.current?.stopListening();
                } else {
                  voiceTransportRef.current?.startListening();
                }
              }}
              className="flex w-full sm:w-auto items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-primary px-3 sm:px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-transform hover:bg-primary-dark active:scale-95"
            >
              <Mic className="h-4 w-4 shrink-0" />
              <span className="truncate">{voiceState === 'listening' ? t.live.listening : t.live.tapToSpeak}</span>
            </button>
          </div>

          {/* Auxiliary Controls: Help & Typed fallback */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowHelpSheet(!showHelpSheet)}
              className="flex h-9 w-9 sm:w-auto sm:px-3 sm:py-2 items-center justify-center gap-1 rounded-xl border border-border-subtle bg-surface text-xs font-medium text-heading hover:bg-surface-hover shadow-2xs"
              title={t.common.help}
              aria-label={t.common.help}
            >
              <HelpCircle className="h-4 w-4 text-primary shrink-0" />
              <span className="hidden sm:inline">{t.common.help}</span>
            </button>

            <button
              onClick={() => setShowTypedInput(!showTypedInput)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                showTypedInput
                  ? 'border-primary bg-card-warm text-primary'
                  : 'border-border-subtle bg-surface text-muted hover:text-heading hover:bg-surface-hover'
              }`}
              title={t.live.typeInstead}
              aria-label={t.live.typeInstead}
            >
              <Keyboard className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Help Action Sheet Drawer */}
      {showHelpSheet && (
        <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border-subtle p-5 shadow-2xl space-y-4 text-heading">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t.live.coachDrawerTitle}
              </span>
              <button
                onClick={() => setShowHelpSheet(false)}
                className="text-xs text-muted hover:text-heading"
              >
                {t.common.close}
              </button>
            </div>

            <div className="grid gap-2">
              <button
                onClick={() => {
                  requestCoachHint('intent_hint');
                  setShowHelpSheet(false);
                  setIsSceneFrozen(true);
                }}
                className="rounded-xl border border-border-subtle p-3 text-left hover:bg-surface-hover transition-colors"
              >
                <div className="text-xs font-semibold text-heading">
                  {t.live.coachStepIntent}
                </div>
              </button>

              <button
                onClick={() => {
                  requestCoachHint('partial_form');
                  setShowHelpSheet(false);
                  setIsSceneFrozen(true);
                }}
                className="rounded-xl border border-border-subtle p-3 text-left hover:bg-surface-hover transition-colors"
              >
                <div className="text-xs font-semibold text-heading">
                  {t.live.coachStepPartial}
                </div>
              </button>

              <button
                onClick={() => {
                  requestCoachHint('full_form');
                  setShowHelpSheet(false);
                  setIsSceneFrozen(true);
                }}
                className="rounded-xl border border-border-subtle p-3 text-left hover:bg-surface-hover transition-colors"
              >
                <div className="text-xs font-semibold text-heading">
                  {t.live.coachStepFull}
                </div>
              </button>

              <button
                onClick={() => {
                  if (latestAssistantPassage) {
                    voiceTransportRef.current?.playSpeech(latestAssistantPassage.text, {
                      speed: 0.75,
                      lang: mission.language
                    });
                  }
                  setShowHelpSheet(false);
                }}
                className="rounded-xl border border-border-subtle p-3 text-left hover:bg-surface-hover transition-colors"
              >
                <div className="text-xs font-semibold text-heading">
                  {t.settings.speedSlower}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
