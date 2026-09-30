import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Mic,
  MicOff,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Eye,
  X,
  Keyboard,
  Check,
  AlertCircle
} from 'lucide-react';
import { PhraseItem, Modality } from '../types';
import { WebVoiceTransport, VoiceEvent } from '../providers/voice/webVoiceTransport';
import { ArchiveStorage } from '../features/archive/storage';
import { projectPhraseState } from '../features/learning/learningCore';
import { useI18n } from '../features/i18n';

interface DuePhrasesPracticeModalProps {
  duePhrases: PhraseItem[];
  onClose: () => void;
  onCompleted: () => void;
}

export const DuePhrasesPracticeModal: React.FC<DuePhrasesPracticeModalProps> = ({
  duePhrases,
  onClose,
  onCompleted
}) => {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showTypedInput, setShowTypedInput] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [modalityUsed, setModalityUsed] = useState<Modality>('spoken');
  const [reviewedItems, setReviewedItems] = useState<{
    phrase: PhraseItem;
    result: 'remembered' | 'supported';
    quote: string;
    modality: Modality;
  }[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const voiceTransportRef = useRef<WebVoiceTransport | null>(null);

  const currentPhrase = duePhrases[currentIndex];

  useEffect(() => {
    if (!currentPhrase) return;

    const transport = new WebVoiceTransport();
    transport.setLanguage(currentPhrase.language);
    voiceTransportRef.current = transport;

    const unsubscribe = transport.subscribe((event: VoiceEvent) => {
      switch (event.type) {
        case 'listening_start':
          setIsListening(true);
          break;
        case 'listening_end':
          setIsListening(false);
          break;
        case 'speech_result':
          if (event.payload.isFinal) {
            setUserTranscript(event.payload.transcript);
            setInterimText('');
            setRevealed(true);
            setModalityUsed('spoken');
          } else {
            setInterimText(event.payload.transcript);
          }
          break;
        case 'error':
          setIsListening(false);
          break;
      }
    });

    return () => {
      unsubscribe();
      transport.dispose();
    };
  }, [currentIndex, currentPhrase]);

  const handleStartListening = () => {
    setUserTranscript('');
    voiceTransportRef.current?.startListening();
  };

  const handleStopListening = () => {
    voiceTransportRef.current?.stopListening();
  };

  const handlePlayAudio = () => {
    if (currentPhrase) {
      voiceTransportRef.current?.playSpeech(currentPhrase.form, {
        lang: currentPhrase.language
      });
    }
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim()) return;
    setUserTranscript(typedAnswer.trim());
    setModalityUsed('typed');
    setRevealed(true);
  };

  const recordEvaluation = (result: 'remembered' | 'supported') => {
    if (!currentPhrase) return;

    const quote = userTranscript || typedAnswer || currentPhrase.form;
    const isUnassisted = result === 'remembered';

    // 1. Record Learning Observation in Archive
    const observation = {
      observationId: `obs-drill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sessionId: `drill-${new Date().toISOString().slice(0, 10)}`,
      attemptId: 'drill-attempt-1',
      sourceTurnId: `drill-${currentPhrase.id}`,
      sourceRevision: 'rev-1',
      itemId: currentPhrase.id,
      candidateForm: currentPhrase.form,
      meaning: currentPhrase.meaning,
      quote,
      modality: modalityUsed,
      retrieval: isUnassisted ? ('unassisted' as const) : ('assisted' as const),
      taskOutcome: 'achieved' as const,
      rehearsal: false,
      supportExposureIds: isUnassisted ? [] : ['exposure-drill-hint'],
      recordedAt: new Date().toISOString()
    };

    // Update observations in storage
    const allObs = ArchiveStorage.getObservations();
    allObs.push(observation);
    localStorage.setItem('mission_coach_observations', JSON.stringify(allObs));

    // 2. Recompute Phrase Recall & Spaced Review State
    const allPhrases = ArchiveStorage.getPhrases();
    const updatedPhrases = allPhrases.map(p => {
      if (p.id === currentPhrase.id) {
        const obsForP = allObs.filter(
          o => o.itemId === p.id || o.candidateForm.toLowerCase() === p.form.toLowerCase()
        );
        return projectPhraseState(p, obsForP);
      }
      return p;
    });
    ArchiveStorage.savePhrases(updatedPhrases);

    setReviewedItems(prev => [
      ...prev,
      {
        phrase: currentPhrase,
        result,
        quote,
        modality: modalityUsed
      }
    ]);

    // Next phrase or finish
    if (currentIndex + 1 < duePhrases.length) {
      setCurrentIndex(prev => prev + 1);
      setRevealed(false);
      setUserTranscript('');
      setInterimText('');
      setTypedAnswer('');
      setShowTypedInput(false);
    } else {
      setIsFinished(true);
    }
  };

  if (!currentPhrase && !isFinished) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-2xl sm:rounded-2xl bg-surface border border-border-subtle shadow-2xl overflow-hidden text-heading">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {t.drill.title}
            </span>
            <div className="text-xs text-muted">
              {isFinished
                ? t.drill.completeTitle
                : t.drill.counter.replace('{current}', String(currentIndex + 1)).replace('{total}', String(duePhrases.length))}
            </div>
          </div>
          <button
            onClick={() => {
              onCompleted();
              onClose();
            }}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-heading"
            aria-label={t.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-safe">
          {!isFinished ? (
            <div className="space-y-6">
              {/* Meaning prompt (Front of Flash Drill) */}
              <div className="rounded-2xl bg-surface-sunken p-6 text-center border border-border-subtle space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {t.drill.howDoYouSay.replace('{language}', t.languages[currentPhrase.language] || currentPhrase.language.toUpperCase())}
                </span>
                <div className="font-display text-2xl font-bold text-heading">
                  "{currentPhrase.meaning}"
                </div>
                <div className="text-xs text-muted">
                  {currentPhrase.usageNote}
                </div>
              </div>

              {/* Spoken input & Interim transcription */}
              {!revealed && (
                <div className="space-y-4 text-center">
                  {interimText && (
                    <div className="rounded-xl bg-card-warm p-3 text-xs italic text-primary animate-pulse border border-primary/20">
                      {t.common.hearingYou} "{interimText}..."
                    </div>
                  )}

                  {!showTypedInput ? (
                    <div className="flex flex-col items-center justify-center gap-3">
                      <button
                        onClick={isListening ? handleStopListening : handleStartListening}
                        className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-md transition-all active:scale-95 ${
                          isListening ? 'bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary-dark'
                        }`}
                      >
                        {isListening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                      </button>
                      <div className="text-xs text-muted">
                        {isListening ? t.live.listening : t.live.tapToSpeak}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleTypedSubmit} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t.live.typePlaceholder}
                        value={typedAnswer}
                        onChange={e => setTypedAnswer(e.target.value)}
                        className="flex-1 rounded-xl border border-border-subtle bg-surface-sunken p-2.5 text-xs text-heading placeholder:text-faint focus:border-primary focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!typedAnswer.trim()}
                        className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-40 shadow-xs hover:bg-primary-dark"
                      >
                        {t.common.check}
                      </button>
                    </form>
                  )}

                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      onClick={() => setShowTypedInput(!showTypedInput)}
                      className="flex items-center gap-1.5 text-xs text-muted hover:text-heading transition-colors"
                    >
                      <Keyboard className="h-3.5 w-3.5" />
                      <span>{showTypedInput ? t.common.switchSpeech : t.common.typeInstead}</span>
                    </button>
                    <span className="text-xs text-muted">·</span>
                    <button
                      onClick={() => setRevealed(true)}
                      className="flex items-center gap-1.5 text-xs text-muted hover:text-heading transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{t.common.showAnswer}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Answer Revealed Card */}
              {revealed && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="rounded-2xl border border-primary/20 bg-card-warm p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        {t.common.targetPhrase}
                      </span>
                      <button
                        onClick={handlePlayAudio}
                        className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-surface px-2.5 py-1 text-xs font-medium text-primary hover:bg-surface-hover shadow-2xs"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>{t.common.listen}</span>
                      </button>
                    </div>

                    <div className="font-display text-2xl font-bold text-heading">
                      "{currentPhrase.form}"
                    </div>

                    {userTranscript && (
                      <div className="rounded-xl bg-surface p-3 text-xs border border-border-subtle text-heading">
                        <span className="text-muted">{t.common.yourProduction} </span>
                        <strong>"{userTranscript}"</strong>
                      </div>
                    )}
                  </div>

                  {/* Self-Rating Evidence Choice */}
                  <div className="space-y-2 text-center">
                    <span className="text-xs font-medium text-muted">
                      {t.common.howWasRecall}
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => recordEvaluation('supported')}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-surface p-3 text-xs font-medium text-heading hover:bg-surface-hover transition-colors shadow-2xs"
                      >
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <span>{t.common.neededHelp}</span>
                      </button>

                      <button
                        onClick={() => recordEvaluation('remembered')}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-primary p-3 text-xs font-semibold text-white shadow-xs hover:bg-primary-dark transition-colors"
                      >
                        <Check className="h-4 w-4" />
                        <span>{t.common.recalledClearly}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Drill Complete Summary */
            <div className="space-y-6 text-center py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-card-sage text-accent-sage border border-accent-sage/20">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h3 className="font-display text-2xl font-bold text-heading">
                  {t.common.allDueReviewed}
                </h3>
                <p className="mt-1 text-xs text-muted">
                  {t.common.allDueReviewedDesc}
                </p>
              </div>

              <div className="space-y-2 text-left">
                {reviewedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-sunken p-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-heading">"{item.phrase.form}"</div>
                      <div className="text-[11px] text-muted">{item.phrase.meaning}</div>
                    </div>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold capitalize border ${
                        item.result === 'remembered'
                          ? 'bg-card-sage text-accent-sage border-accent-sage/20'
                          : 'bg-card-warm text-primary border-primary/20'
                      }`}
                    >
                      {item.result === 'remembered' ? t.recap.unassisted : t.recap.assisted} ({item.modality})
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  onCompleted();
                  onClose();
                }}
                className="w-full rounded-xl bg-primary py-3 text-xs font-semibold text-white hover:bg-primary-dark shadow-xs transition-all"
              >
                {t.drill.closeButton}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
