import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  Keyboard,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react-native';
import { PhraseItem, Modality } from '../types';
import { NativeVoiceTransport, VoiceEvent } from '../providers/voice';
import { useI18n } from '../features/i18n';
import { Button, Field, SectionLabel } from './ui';
import { Sheet } from './Sheet';
import { iconColor } from '../design/iconColor';

interface DuePhrasesPracticeModalProps {
  visible: boolean;
  duePhrases: PhraseItem[];
  onClose: () => void;
  onCompleted: () => void;
  onRecordReview: (input: {
    phrase: PhraseItem;
    quote: string;
    modality: 'spoken' | 'typed';
    unassisted: boolean;
  }) => Promise<void>;
}

interface ReviewedItem {
  phrase: PhraseItem;
  result: 'remembered' | 'supported';
  quote: string;
  modality: Modality;
}

export const DuePhrasesPracticeModal: React.FC<DuePhrasesPracticeModalProps> = ({
  visible,
  duePhrases,
  onClose,
  onCompleted,
  onRecordReview,
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
  const [reviewedItems, setReviewedItems] = useState<ReviewedItem[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const voiceTransportRef = useRef<NativeVoiceTransport | null>(null);

  const currentPhrase = duePhrases[currentIndex];

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setRevealed(false);
      setUserTranscript('');
      setInterimText('');
      setTypedAnswer('');
      setShowTypedInput(false);
      setModalityUsed('spoken');
      setReviewedItems([]);
      setIsFinished(false);
    }
  }, [visible, duePhrases.length]);

  useEffect(() => {
    if (!visible || !currentPhrase) return;

    const transport = new NativeVoiceTransport();
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
          if (event.payload === 'mic_denied') {
            setShowTypedInput(true);
          }
          break;
      }
    });

    return () => {
      unsubscribe();
      transport.dispose();
      voiceTransportRef.current = null;
    };
  }, [visible, currentIndex, currentPhrase]);

  const handleStartListening = () => {
    setUserTranscript('');
    voiceTransportRef.current?.startListening();
  };

  const handleStopListening = () => {
    voiceTransportRef.current?.stopListening();
  };

  const handlePlayAudio = () => {
    if (!currentPhrase) return;
    voiceTransportRef.current?.playSpeech(currentPhrase.form, {
      lang: currentPhrase.language,
    });
  };

  const handleTypedSubmit = () => {
    const trimmed = typedAnswer.trim();
    if (!trimmed) return;
    setUserTranscript(trimmed);
    setModalityUsed('typed');
    setRevealed(true);
  };

  const handleFinish = () => {
    onCompleted();
    onClose();
  };

  const recordEvaluation = (result: 'remembered' | 'supported') => {
    if (!currentPhrase) return;

    // Never substitute the displayed target form for learner production. Show
    // answer / Listen can reveal the form, but without an actual spoken/typed
    // attempt there is no learner evidence to persist.
    const learnerQuote = (userTranscript || typedAnswer).trim();
    const effectiveResult = learnerQuote ? result : 'supported';

    if (learnerQuote) {
      // The archive owns the write and validates the quote/form again before
      // persistence. A post-attempt Listen does not retroactively contaminate
      // the already captured attempt; reveal-before-attempt yields no write.
      void onRecordReview({
        phrase: currentPhrase,
        quote: learnerQuote,
        modality: modalityUsed,
        unassisted: effectiveResult === 'remembered',
      });
    }

    setReviewedItems(prev => [
      ...prev,
      {
        phrase: currentPhrase,
        result: effectiveResult,
        quote: learnerQuote,
        modality: modalityUsed,
      },
    ]);

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

  if (!visible) return null;

  const counterText = isFinished
    ? t.drill.completeTitle
    : t.drill.counter
        .replace('{current}', String(currentIndex + 1))
        .replace('{total}', String(duePhrases.length));

  return (
    <Sheet visible onClose={handleFinish} title={t.drill.title} scrollable={false}>
      <Text className="-mt-2 text-xs text-muted">{counterText}</Text>

      {isFinished ? (
        <ScrollView className="flex-1" contentContainerStyle={{ gap: 18, paddingBottom: 16 }}>
          <View className="items-center gap-2 py-2">
            <View className="h-14 w-14 items-center justify-center rounded-full border border-accent-sage/20 bg-card-sage">
              <CheckCircle2 size={30} color={iconColor('success')} />
            </View>
            <Text className="font-display text-xl font-bold text-ink">
              {t.common.allDueReviewed}
            </Text>
            <Text className="text-xs text-muted">{t.common.allDueReviewedDesc}</Text>
          </View>

          <View className="gap-2">
            {reviewedItems.map((item, idx) => (
              <View
                key={`${item.phrase.id}-${idx}`}
                className="flex-row items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-sunken p-3"
              >
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-ink">
                    "{item.phrase.form}"
                  </Text>
                  <Text className="text-xs text-muted">{item.phrase.meaning}</Text>
                </View>
                <View
                  className={`rounded-lg border px-2 py-0.5 ${
                    item.result === 'remembered'
                      ? 'border-accent-sage/20 bg-card-sage'
                      : 'border-primary/20 bg-card-warm'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold capitalize ${
                      item.result === 'remembered' ? 'text-accent-sage' : 'text-primary'
                    }`}
                  >
                    {item.result === 'remembered' ? t.recap.unassisted : t.recap.assisted} (
                    {item.modality})
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Button label={t.drill.closeButton} onPress={handleFinish} size="lg" />
        </ScrollView>
      ) : currentPhrase ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ gap: 20, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center gap-2.5 rounded-2xl border border-border-subtle bg-surface-sunken p-6">
            <Text className="text-center text-xs font-semibold uppercase tracking-wider text-muted">
              {t.drill.howDoYouSay.replace(
                '{language}',
                t.languages[currentPhrase.language] || currentPhrase.language.toUpperCase()
              )}
            </Text>
            <Text className="text-center font-display text-2xl font-bold text-ink">
              "{currentPhrase.meaning}"
            </Text>
            <Text className="text-center text-xs text-muted">{currentPhrase.usageNote}</Text>
          </View>

          {!revealed ? (
            <View className="items-center gap-3">
              {interimText ? (
                <View className="w-full rounded-xl border border-primary/20 bg-card-warm p-3">
                  <Text className="text-center text-xs italic text-primary">
                    {t.common.hearingYou} "{interimText}..."
                  </Text>
                </View>
              ) : null}

              {!showTypedInput ? (
                <View className="items-center gap-3">
                  <Pressable
                    onPress={isListening ? handleStopListening : handleStartListening}
                    accessibilityRole="button"
                    accessibilityLabel={isListening ? t.live.listening : t.live.tapToSpeak}
                    className={`h-16 w-16 items-center justify-center rounded-full ${
                      isListening ? 'bg-action-pressed' : 'bg-action'
                    } active:opacity-80`}
                  >
                    {isListening ? (
                      <MicOff size={28} color={iconColor('brandText')} />
                    ) : (
                      <Mic size={28} color={iconColor('brandText')} />
                    )}
                  </Pressable>
                  <Text className="text-xs text-muted">
                    {isListening ? t.live.listening : t.live.tapToSpeak}
                  </Text>
                </View>
              ) : (
                <View className="w-full flex-row items-end gap-2">
                  <View className="flex-1">
                    <Field
                      placeholder={t.live.typePlaceholder}
                      value={typedAnswer}
                      onChangeText={setTypedAnswer}
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleTypedSubmit}
                      accessibilityLabel={t.live.typePlaceholder}
                    />
                  </View>
                  <Button
                    label={t.common.check}
                    onPress={handleTypedSubmit}
                    disabled={!typedAnswer.trim()}
                    size="md"
                  />
                </View>
              )}

              <View className="flex-row flex-wrap items-center justify-center gap-3 pt-1">
                <Pressable
                  onPress={() => setShowTypedInput(prev => !prev)}
                  accessibilityRole="button"
                  className="flex-row items-center gap-1.5"
                >
                  <Keyboard size={14} color={iconColor('muted')} />
                  <Text className="text-xs text-muted">
                    {showTypedInput ? t.common.switchSpeech : t.common.typeInstead}
                  </Text>
                </Pressable>

                <Text className="text-xs text-muted">·</Text>

                <Pressable
                  onPress={() => setRevealed(true)}
                  accessibilityRole="button"
                  className="flex-row items-center gap-1.5"
                >
                  <Eye size={14} color={iconColor('muted')} />
                  <Text className="text-xs text-muted">{t.common.showAnswer}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="gap-5">
              <View className="gap-3 rounded-2xl border border-primary/20 bg-card-warm p-5">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {t.common.targetPhrase}
                  </Text>
                  <Button
                    label={t.common.listen}
                    onPress={handlePlayAudio}
                    size="sm"
                    variant="secondary"
                    className="border-primary/30"
                    textClassName="text-primary"
                    icon={<Volume2 size={14} color={iconColor('brand')} />}
                  />
                </View>

                <Text className="font-display text-2xl font-bold text-ink">
                  "{currentPhrase.form}"
                </Text>

                {userTranscript ? (
                  <View className="rounded-xl border border-border-subtle bg-surface p-3">
                    <Text className="text-xs text-ink">
                      <Text className="text-muted">{t.common.yourProduction} </Text>
                      <Text className="font-semibold">"{userTranscript}"</Text>
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className="gap-2">
                <SectionLabel className="text-center">{t.common.howWasRecall}</SectionLabel>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      label={t.common.neededHelp}
                      onPress={() => recordEvaluation('supported')}
                      variant="secondary"
                      icon={<AlertCircle size={16} color={iconColor('brand')} />}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label={t.common.recalledClearly}
                      onPress={() => recordEvaluation('remembered')}
                      icon={<Check size={16} color={iconColor('brandText')} />}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <Text className="py-8 text-center text-sm text-muted">No phrases due.</Text>
      )}
    </Sheet>
  );
};
