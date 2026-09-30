import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Keyboard,
  Compass,
  ArrowRight,
  CheckCircle2,
  Layers,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import {
  MissionDefinition,
  Mode,
  Passage,
  SessionRecord,
  SupportExposure,
  SceneState,
  LanguageCode
} from '../types';
import { WebVoiceTransport, VoiceEvent } from '../providers/voice/webVoiceTransport';
import { useI18n } from '../features/i18n';

interface AmikoChatStageProps {
  missions: MissionDefinition[];
  selectedMission: MissionDefinition;
  onSelectMission: (mission: MissionDefinition) => void;
  onEndSession: (session: SessionRecord) => void;
  mode: Mode;
}

export const AmikoChatStage: React.FC<AmikoChatStageProps> = ({
  missions,
  selectedMission,
  onSelectMission,
  onEndSession,
  mode
}) => {
  const { t, language } = useI18n();

  // Session & Passages State
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [interimUserText, setInterimUserText] = useState('');
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'speaking' | 'paused'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [playingPassageId, setPlayingPassageId] = useState<string | null>(null);
  const [showMeaningFor, setShowMeaningFor] = useState<Record<string, boolean>>({});
  const [isSceneFrozen, setIsSceneFrozen] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<string | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [sceneNotice, setSceneNotice] = useState<string | null>(null);

  const voiceTransportRef = useRef<WebVoiceTransport | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize Voice Transport & First Greeting when selectedMission changes
  useEffect(() => {
    const transport = new WebVoiceTransport();
    transport.setLanguage(selectedMission.language);
    voiceTransportRef.current = transport;

    const newSessionId = `session-${Date.now()}`;
    setSessionId(newSessionId);
    setVoiceState('idle');
    setIsSceneFrozen(false);
    setCoachAdvice(null);

    const unsubscribe = transport.subscribe((event: VoiceEvent) => {
      if (event.type === 'listening_start') {
        setVoiceState('listening');
      } else if (event.type === 'listening_end') {
        setVoiceState(prev => (prev === 'listening' ? 'idle' : prev));
      } else if (event.type === 'speech_result') {
        const { transcript, isFinal } = event.payload || {};
        if (isFinal && transcript?.trim()) {
          setInterimUserText('');
          handleUserReply(transcript, 'spoken');
        } else {
          setInterimUserText(transcript || '');
        }
      } else if (event.type === 'playback_start') {
        setVoiceState('speaking');
      } else if (event.type === 'playback_end' || event.type === 'interrupted') {
        setVoiceState('idle');
        setPlayingPassageId(null);
      }
    });

    // Generate initial greeting for this character
    let greeting = '¡Hola! ¿En qué puedo ayudarte hoy?';
    let meaning = 'Hello! How can I help you today?';

    if (selectedMission.language === 'es') {
      if (selectedMission.category === 'cafes') {
        greeting = '¡Hola! Buenos días, bienvenido a Café Sol. ¿Qué te pongo hoy?';
        meaning = 'Hello! Good morning, welcome to Café Sol. What can I get for you today?';
      } else if (selectedMission.category === 'services') {
        greeting = 'Hola, buenos días. ¿Vienes a recoger o enviar un paquete?';
        meaning = 'Hello, good morning. Are you here to pick up or send a parcel?';
      } else if (selectedMission.category === 'problems') {
        greeting = 'Buenos días, bienvenido a la farmacia. ¿Qué síntomas tienes?';
        meaning = 'Good morning, welcome to the pharmacy. What symptoms do you have?';
      } else {
        greeting = `¡Hola! Soy ${selectedMission.character.name}. ¿Qué tal?`;
        meaning = `Hello! I am ${selectedMission.character.name}. How are you?`;
      }
    } else if (selectedMission.language === 'fr') {
      greeting = `Bonjour ! Bienvenue. Je m'appelle ${selectedMission.character.name}. Que désirez-vous ce matin ?`;
      meaning = `Good morning! Welcome. I am ${selectedMission.character.name}. What would you like this morning?`;
    } else if (selectedMission.language === 'de') {
      greeting = `Guten Tag! Willkommen. Wie kann ich Ihnen heute helfen?`;
      meaning = `Good day! Welcome. How can I help you today?`;
    } else if (selectedMission.language === 'it') {
      greeting = `Buongiorno! Prego, come posso aiutarti oggi?`;
      meaning = `Good morning! Please, how can I help you today?`;
    } else if (selectedMission.language === 'ja') {
      greeting = `いらっしゃいませ！何にいたしましょうか？`;
      meaning = `Welcome! How may I help you?`;
    }

    const firstPassage: Passage = {
      id: `p-${Date.now()}`,
      sessionId: newSessionId,
      attemptId: 'attempt-1',
      speaker: 'assistant',
      revisionKey: 'rev-1',
      assemblyVersion: 1,
      status: 'final',
      text: greeting,
      meaning: meaning,
      modality: 'spoken',
      startedAt: new Date().toISOString(),
      fragments: [{ id: `f-${Date.now()}`, passageId: `p-${Date.now()}`, origin: 'assistant', text: greeting }]
    };

    setPassages([firstPassage]);

    // Speak initial line
    transport.playSpeech(greeting, { lang: selectedMission.language });

    return () => {
      unsubscribe();
      transport.dispose();
    };
  }, [selectedMission.id, selectedMission.language]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [passages, interimUserText]);

  // Handle User Message (Spoken or Typed)
  const handleUserReply = async (text: string, modality: 'spoken' | 'typed') => {
    if (!text.trim()) return;

    const userPassage: Passage = {
      id: `p-${Date.now()}`,
      sessionId,
      attemptId: 'attempt-1',
      speaker: 'user',
      revisionKey: 'rev-1',
      assemblyVersion: 1,
      status: 'final',
      text,
      modality,
      startedAt: new Date().toISOString(),
      fragments: [{ id: `f-${Date.now()}`, passageId: `p-${Date.now()}`, origin: 'user', text }]
    };

    setPassages(prev => [...prev, userPassage]);
    setVoiceState('speaking');

    try {
      const historyPayload = passages.concat(userPassage).map(p => ({
        speaker: p.speaker,
        text: p.text
      }));

      const res = await fetch('/api/actor/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneDefinition: selectedMission,
          history: historyPayload,
          learnerUtterance: text,
          modality,
          currentFacts: selectedMission.character,
          mode
        })
      });

      if (!res.ok) throw new Error('API response failed');

      const data = await res.json();
      const botPassage: Passage = {
        id: `p-${Date.now()}`,
        sessionId,
        attemptId: 'attempt-1',
        speaker: 'assistant',
        revisionKey: 'rev-1',
        assemblyVersion: 1,
        status: 'final',
        text: data.replyText,
        meaning: data.meaningTranslation,
        modality: 'spoken',
        startedAt: new Date().toISOString(),
        fragments: [{ id: `f-${Date.now()}`, passageId: `p-${Date.now()}`, origin: 'assistant', text: data.replyText }]
      };

      setPassages(prev => [...prev, botPassage]);

      if (data.proposedSceneAction) {
        if (data.proposedSceneAction.name === 'offer_alternative') {
          setSceneNotice(`${selectedMission.character.name} offers alternative option.`);
        } else if (data.proposedSceneAction.name === 'confirm_takeaway') {
          setSceneNotice(`Order confirmed for takeaway ("para llevar").`);
        }
        setTimeout(() => setSceneNotice(null), 3500);
      }

      await voiceTransportRef.current?.playSpeech(data.replyText, {
        audioBase64: data.audioBase64,
        lang: selectedMission.language
      });
    } catch (err) {
      console.warn('Fallback simulated response', err);
      // Gentle resilient fallback
      let fallbackText = '¡Perfecto! Marchando entonces. ¿Deseas algo más?';
      let fallbackMeaning = 'Perfect! Coming right up. Would you like anything else?';

      if (selectedMission.language === 'fr') {
        fallbackText = "C'est noté ! Et avec ceci ?";
        fallbackMeaning = 'Noted! And with this?';
      } else if (selectedMission.language === 'de') {
        fallbackText = 'Sehr gerne! Kommt sofort. Darf es noch etwas sein?';
        fallbackMeaning = 'Very gladly! Coming right up. Anything else?';
      }

      const botPassage: Passage = {
        id: `p-${Date.now()}`,
        sessionId,
        attemptId: 'attempt-1',
        speaker: 'assistant',
        revisionKey: 'rev-1',
        assemblyVersion: 1,
        status: 'final',
        text: fallbackText,
        meaning: fallbackMeaning,
        modality: 'spoken',
        startedAt: new Date().toISOString(),
        fragments: [{ id: `f-${Date.now()}`, passageId: `p-${Date.now()}`, origin: 'assistant', text: fallbackText }]
      };

      setPassages(prev => [...prev, botPassage]);
      await voiceTransportRef.current?.playSpeech(fallbackText, { lang: selectedMission.language });
    }
  };

  const handlePlayPassageAudio = (passage: Passage) => {
    setPlayingPassageId(passage.id);
    voiceTransportRef.current?.playSpeech(passage.text, {
      lang: selectedMission.language,
      speed: 0.95
    }).finally(() => {
      setPlayingPassageId(null);
    });
  };

  const handleFreezeToggle = async () => {
    if (!isSceneFrozen) {
      voiceTransportRef.current?.stopPlayback();
      voiceTransportRef.current?.stopListening();
      setIsSceneFrozen(true);
      setVoiceState('paused');
      setIsCoachLoading(true);

      try {
        const explLang = language === 'fr' ? 'French' : language === 'es' ? 'Spanish' : language === 'nl' ? 'Dutch' : 'English';
        const res = await fetch('/api/coach/hint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: 'intent_hint',
            targetLanguage: selectedMission.language,
            explanationLanguage: explLang,
            characterName: selectedMission.character.name,
            lastAssistantLine: passages[passages.length - 1]?.text || '',
            learnerGoal: selectedMission.learnerGoal
          })
        });
        const data = await res.json();
        setCoachAdvice(data.hint || selectedMission.usefulPhrases[0]?.form);
      } catch {
        setCoachAdvice(selectedMission.usefulPhrases[0]?.form || 'Say your order politely and specify for takeaway.');
      } finally {
        setIsCoachLoading(false);
      }
    } else {
      setIsSceneFrozen(false);
      setCoachAdvice(null);
      setVoiceState('idle');
      voiceTransportRef.current?.startListening();
    }
  };

  const handleFinishChat = () => {
    const sessionRecord: SessionRecord = {
      id: sessionId,
      missionId: selectedMission.id,
      language: selectedMission.language,
      mode,
      coldAttempt: true,
      state: 'recap_ready',
      startedAt: new Date(Date.now() - 120000).toISOString(),
      endedAt: new Date().toISOString(),
      endReason: 'completed',
      passages,
      supportExposures: [],
      observations: [],
      taskOutcome: 'achieved',
      summary: `Practiced real dialogue with ${selectedMission.character.name} in ${selectedMission.neighborhood}.`,
      actionableFeedback: [
        `You expressed your intention clearly with natural communicative pacing.`,
        `Keep reinforcing your recall interval on key expressions.`
      ],
      sceneState: {
        sceneId: selectedMission.id,
        revision: 1,
        facts: selectedMission.character,
        learnerKnows: [selectedMission.learnerGoal],
        characterKnows: selectedMission.character.knowledgeBoundary,
        checkpoints: [],
        isFinished: true,
        outcome: 'achieved'
      }
    };

    onEndSession(sessionRecord);
  };

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-3 sm:py-6">
      {/* Amiko Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Cast Sidebar ("Who do you want to chat with?") */}
        <aside className="w-full lg:w-80 shrink-0 space-y-3">
          <div className="rounded-2xl bg-surface border border-border-subtle p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Compass className="h-4 w-4" />
              <span>Characters & Cast</span>
            </div>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-heading">
              Who do you want to chat with?
            </h2>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Each character has their own personality, knowledge, and reason to speak with you.
            </p>

            {/* Character items list */}
            <div className="mt-4 space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
              {missions.map(m => {
                const isCurrent = m.id === selectedMission.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => onSelectMission(m)}
                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all ${
                      isCurrent
                        ? 'border-primary bg-card-warm shadow-xs ring-1 ring-primary'
                        : 'border-border-subtle bg-surface hover:border-primary/40 hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {m.character.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs sm:text-sm text-heading truncate">
                          {m.character.name}
                        </div>
                        <div className="text-[11px] text-muted truncate">
                          {m.character.role} · {m.neighborhood.split('·')[0]}
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-lg bg-surface border border-border-subtle px-2 py-0.5 text-[10px] font-bold text-heading">
                      {m.levelRange}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Column: The Amiko Chat Room Stage */}
        <div className="flex-1 w-full">
          <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-md flex flex-col h-[75vh] min-h-[560px] max-h-[740px]">
            {/* 1. Room Top Bar */}
            <div className="relative z-10 flex items-center justify-between border-b border-border-subtle bg-surface/90 backdrop-blur-md px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold text-xs shadow-xs">
                  {selectedMission.character.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-sm sm:text-base text-heading truncate">
                      {selectedMission.character.name}
                    </span>
                    <span className="rounded-md bg-card-warm px-1.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                      {selectedMission.levelRange} · {selectedMission.character.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted truncate">
                    Goal: {selectedMission.learnerGoal}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleFreezeToggle}
                  className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all ${
                    isSceneFrozen
                      ? 'border-primary bg-card-warm text-primary'
                      : 'border-border-subtle bg-surface-sunken text-heading hover:bg-surface-hover'
                  }`}
                  title={isSceneFrozen ? 'Resume conversation' : 'Freeze & get coach hint'}
                >
                  {isSceneFrozen ? <Play className="h-3.5 w-3.5 fill-primary text-primary" /> : <Pause className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{isSceneFrozen ? 'Resume' : 'Freeze'}</span>
                </button>

                <button
                  onClick={handleFinishChat}
                  className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark shadow-xs transition-all active:scale-95"
                >
                  End Chat
                </button>
              </div>
            </div>

            {/* Scene notification banner */}
            {sceneNotice && (
              <div className="bg-card-warm px-4 py-2 text-center text-xs font-medium text-primary border-b border-primary/20 animate-fadeIn">
                {sceneNotice}
              </div>
            )}

            {/* 2. Messages Stream (Bottom-anchored like Amiko) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 flex flex-col justify-end bg-canvas/40">
              <div className="space-y-3.5 overflow-y-auto">
                {passages.map(passage => {
                  const isUser = passage.speaker === 'user';
                  const showTranslation = showMeaningFor[passage.id];

                  return (
                    <div
                      key={passage.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm shadow-xs transition-all ${
                          isUser
                            ? 'bg-primary text-white rounded-br-xs'
                            : 'bg-surface border border-border-subtle text-heading rounded-bl-xs'
                        }`}
                      >
                        {/* Speaker tag & Audio button */}
                        {!isUser && (
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                              {selectedMission.character.name}
                            </span>
                            <button
                              onClick={() => handlePlayPassageAudio(passage)}
                              disabled={playingPassageId === passage.id}
                              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                                playingPassageId === passage.id
                                  ? 'bg-primary text-white'
                                  : 'bg-surface-sunken text-muted hover:text-primary hover:bg-card-warm'
                              }`}
                              title="Listen"
                              aria-label="Listen"
                            >
                              <Volume2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        {/* Dialogue text */}
                        <div className={`font-display text-base sm:text-lg leading-snug ${isUser ? 'text-white' : 'text-heading font-medium'}`}>
                          {passage.text}
                        </div>

                        {/* Meaning / Translation */}
                        {!isUser && passage.meaning && (
                          <div className="mt-2 pt-2 border-t border-border-subtle/60 text-xs">
                            {showTranslation ? (
                              <div className="text-body italic">
                                {passage.meaning}
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setShowMeaningFor(prev => ({
                                    ...prev,
                                    [passage.id]: true
                                  }))
                                }
                                className="text-[11px] text-primary hover:underline font-medium"
                              >
                                Show translation
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Interim speech recognition pulse */}
                {interimUserText && (
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-br-xs bg-card-warm p-3 text-xs italic text-primary border border-dashed border-primary/40 animate-pulse">
                      "{interimUserText}..."
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 3. Freeze / Coach Advice Banner */}
            {isSceneFrozen && (
              <div className="border-t border-primary/20 bg-card-warm p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-heading">
                      <strong>Coach Tip: </strong>
                      {isCoachLoading ? 'Thinking of the best response...' : coachAdvice}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (coachAdvice) {
                        handleUserReply(coachAdvice, 'spoken');
                        setIsSceneFrozen(false);
                      }
                    }}
                    className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-white font-semibold text-[11px]"
                  >
                    Send this
                  </button>
                </div>
              </div>
            )}

            {/* 4. One-Tap Suggested Reply Chips (Amiko Signature Feature) */}
            <div className="border-t border-border-subtle bg-surface px-3 py-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted shrink-0 mr-1">
                  Suggestions:
                </span>
                {selectedMission.usefulPhrases.slice(0, 3).map(phrase => (
                  <button
                    key={phrase.id}
                    onClick={() => handleUserReply(phrase.form, 'typed')}
                    className="shrink-0 whitespace-nowrap rounded-lg border border-border-subtle bg-surface-sunken px-2.5 py-1 text-xs text-heading hover:border-primary/40 hover:bg-card-warm hover:text-primary transition-all active:scale-95"
                  >
                    {phrase.form}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Bottom Voice & Text Input Bar */}
            <div className="border-t border-border-subtle bg-surface px-3 py-2.5 sm:px-4 sm:py-3">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (typedMessage.trim()) {
                    handleUserReply(typedMessage, 'typed');
                    setTypedMessage('');
                  }
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Mic Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    if (voiceState === 'listening') {
                      voiceTransportRef.current?.stopListening();
                    } else {
                      voiceTransportRef.current?.startListening();
                    }
                  }}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all ${
                    voiceState === 'listening'
                      ? 'border-primary bg-primary text-white animate-pulse'
                      : 'border-border-subtle bg-surface-sunken text-heading hover:text-primary hover:border-primary/40'
                  }`}
                  title={voiceState === 'listening' ? 'Listening...' : 'Tap to speak'}
                  aria-label="Toggle voice input"
                >
                  <Mic className="h-4 w-4" />
                </button>

                {/* Text input pill */}
                <input
                  type="text"
                  placeholder="Speak or type your reply..."
                  value={typedMessage}
                  onChange={e => setTypedMessage(e.target.value)}
                  className="flex-1 rounded-full border border-border-subtle bg-surface-sunken px-4 py-2 text-xs sm:text-sm text-heading placeholder:text-faint focus:border-primary focus:outline-none transition-colors"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!typedMessage.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40 shadow-xs transition-transform active:scale-95"
                  title="Send message"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
