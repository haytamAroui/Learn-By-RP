import React, { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react-native';
import { LanguageCode, PhraseItem } from '../types';
import { speakWithBestAvailable } from '../providers/voice/speechOutput';
import { NativeVoiceTransport } from '../providers/voice/nativeVoiceTransport';
import type { VoiceTransport } from '../providers/voice/types';
import { buildFlemishSpeechStyle } from '../content/regionalProfiles';
import { iconColor } from '../design/iconColor';

export interface FlashcardModalProps {
  visible: boolean;
  phrases: PhraseItem[];
  learningLanguage: LanguageCode;
  onClose: () => void;
}

export function getPhraseRecallBars(phrase: PhraseItem): number {
  if (phrase.recallStatus === 'steady') return 3;
  if (phrase.recallStatus === 'growing') return 2;
  if (phrase.stats.unassistedCount > 0) return 1;
  return 0;
}

export function getRecallStatusLabel(bars: number, isDutch: boolean): string {
  if (isDutch) {
    switch (bars) {
      case 3:
        return 'Stabiel · 14 dagen';
      case 2:
        return 'Groeiend · 4 dagen';
      case 1:
        return 'Fragiel · 1 dag';
      default:
        return 'Nieuw / Ondersteund';
    }
  }
  switch (bars) {
    case 3:
      return 'Steady · 14 days';
    case 2:
      return 'Growing · 4 days';
    case 1:
      return 'Fragile · 1 day';
    default:
      return 'New / Supported';
  }
}

export function getRecallExplanation(bars: number, isDutch: boolean): string {
  if (isDutch) {
    switch (bars) {
      case 3:
        return 'Spontaan herinnerd over meerdere dagen en situaties. Blijft stevig in je spraakgeheugen.';
      case 2:
        return 'Zelfstandig gebruikt op verschillende dagen. Binnenkort nog eens terugzien.';
      case 1:
        return 'Zelfstandig gebruikt. We brengen het snel terug in een volgend gesprek.';
      default:
        return 'Gehoord of met hulp gebruikt. Probeer het binnenkort zelfstandig uit te spreken.';
    }
  }
  switch (bars) {
    case 3:
      return 'Recalled independently across days and contexts.';
    case 2:
      return 'Recalled on different days. Worth revisiting soon.';
    case 1:
      return 'Used independently once. We’ll bring it back soon.';
    default:
      return 'Heard or used with support. Try using it in your own words.';
  }
}

export const RecallBars: React.FC<{ count: number }> = ({ count }) => (
  <View
    className="flex-row items-center gap-1.5"
    accessibilityLabel={`${count} of 3 recall bars`}
  >
    {[0, 1, 2].map((i) => (
      <View
        key={i}
        className={`h-2 w-5 rounded-full ${
          i < count ? 'bg-primary' : 'bg-surface-soft border border-border-subtle'
        }`}
      />
    ))}
  </View>
);

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  visible,
  phrases,
  learningLanguage,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const voiceTransportRef = useRef<VoiceTransport>(new NativeVoiceTransport());

  const isDutch = learningLanguage === 'nl';
  const total = phrases.length;
  const currentPhrase = phrases[currentIndex] || phrases[0];

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsRevealed(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsRevealed(false);
    }
  };

  const handlePlayPronunciation = async () => {
    if (!currentPhrase || isPlayingAudio) return;
    try {
      setIsPlayingAudio(true);
      await speakWithBestAvailable(voiceTransportRef.current, currentPhrase.form, {
        language: learningLanguage,
        locale: isDutch ? 'nl-BE' : undefined,
        style: isDutch ? buildFlemishSpeechStyle('gent') : undefined,
      });
    } catch {
      // Audio synthesis error fallback is non-fatal
    } finally {
      setIsPlayingAudio(false);
    }
  };

  if (!visible || !currentPhrase) return null;

  const bars = getPhraseRecallBars(currentPhrase);
  const statusLabel = getRecallStatusLabel(bars, isDutch);
  const explanation = getRecallExplanation(bars, isDutch);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-surface px-4 py-6 sm:px-6">
        {/* Header bar */}
        <View className="flex-row items-center justify-between border-b border-border-subtle pb-4">
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted">
              {isDutch ? 'Mural Geheugen · Belgisch-Nederlands' : 'Mural Spaced Repetition'}
            </Text>
            <Text className="mt-0.5 text-xl font-bold text-ink">
              {isDutch ? 'Woordkaarten' : 'Flashcard Deck'}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="rounded-full bg-surface-soft px-3 py-1">
              <Text className="text-xs font-semibold text-muted">
                {currentIndex + 1} / {total}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={isDutch ? 'Sluiten' : 'Close'}
              className="min-h-12 min-w-12 items-center justify-center rounded-full bg-surface-soft active:opacity-75"
            >
              <X size={20} color={iconColor('muted')} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="my-4"
        >
          {/* The Flashcard itself */}
          <View className="overflow-hidden rounded-3xl border border-border-subtle bg-card-warm p-6 shadow-sm sm:p-8">
            {/* Top row: Memory bars and audio pronunciation */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <RecallBars count={bars} />
                <Text className="text-xs font-semibold text-primary">{statusLabel}</Text>
              </View>

              <Pressable
                onPress={handlePlayPronunciation}
                accessibilityRole="button"
                accessibilityLabel={isDutch ? 'Beluister uitspraak' : 'Listen to pronunciation'}
                className="min-h-12 min-w-12 flex-row items-center justify-center gap-1.5 rounded-full bg-white px-3 shadow-xs active:opacity-75"
              >
                <Volume2
                  size={18}
                  color={isPlayingAudio ? iconColor('brand') : iconColor('primary')}
                />
                <Text className="text-xs font-semibold text-primary">
                  {isPlayingAudio
                    ? isDutch
                      ? 'Speelt...'
                      : 'Playing...'
                    : isDutch
                    ? 'Uitspraak'
                    : 'Listen'}
                </Text>
              </Pressable>
            </View>

            {/* Dutch Lemma / Phrase */}
            <View className="my-8 items-center justify-center">
              <Text className="text-center text-3xl font-bold leading-tight text-ink sm:text-4xl">
                “{currentPhrase.form}”
              </Text>
            </View>

            {/* Revealed Meaning & Context */}
            {isRevealed ? (
              <View className="gap-3 rounded-2xl bg-white p-5 shadow-xs">
                <View className="flex-row items-center gap-1.5">
                  <Sparkles size={16} color={iconColor('brand')} />
                  <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {isDutch ? 'Betekenis & Context' : 'Meaning & Context'}
                  </Text>
                </View>

                <Text className="text-lg font-semibold text-ink">
                  {currentPhrase.meaning}
                </Text>

                {currentPhrase.usageNote ? (
                  <Text className="text-sm leading-5 text-muted">
                    {currentPhrase.usageNote}
                  </Text>
                ) : null}

                <View className="mt-2 border-t border-border-subtle pt-2">
                  <Text className="text-xs text-muted">
                    {explanation}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Flip / Reveal action button */}
            <View className="mt-6 items-center">
              <Pressable
                onPress={() => setIsRevealed((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={
                  isRevealed
                    ? isDutch
                      ? 'Verberg betekenis'
                      : 'Hide meaning'
                    : isDutch
                    ? 'Toon betekenis'
                    : 'Reveal meaning'
                }
                className="min-h-12 flex-row items-center gap-2 rounded-full border border-border-subtle bg-white px-5 py-2.5 active:opacity-75"
              >
                {isRevealed ? (
                  <EyeOff size={16} color={iconColor('muted')} />
                ) : (
                  <Eye size={16} color={iconColor('brand')} />
                )}
                <Text className="text-sm font-semibold text-ink">
                  {isRevealed
                    ? isDutch
                      ? 'Verberg betekenis'
                      : 'Hide meaning'
                    : isDutch
                    ? 'Tik om betekenis te zien'
                    : 'Tap to reveal meaning'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Footer Navigation */}
        <View className="gap-3 border-t border-border-subtle pt-4">
          <View className="flex-row items-center justify-between gap-3">
            <Pressable
              onPress={handlePrev}
              disabled={currentIndex === 0}
              accessibilityRole="button"
              accessibilityLabel={isDutch ? 'Vorige woordkaart' : 'Previous flashcard'}
              className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border-subtle bg-surface-soft px-4 active:opacity-75 ${
                currentIndex === 0 ? 'opacity-40' : ''
              }`}
            >
              <ChevronLeft size={20} color={iconColor('muted')} />
              <Text className="text-sm font-semibold text-ink">
                {isDutch ? 'Vorige' : 'Previous'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleNext}
              disabled={currentIndex === total - 1}
              accessibilityRole="button"
              accessibilityLabel={isDutch ? 'Volgende woordkaart' : 'Next flashcard'}
              className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4 active:opacity-75 ${
                currentIndex === total - 1 ? 'opacity-40' : ''
              }`}
            >
              <Text className="text-sm font-semibold text-white">
                {isDutch ? 'Volgende' : 'Next'}
              </Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Architectural Invariant Reminder */}
          <Text className="text-center text-xs leading-4 text-muted">
            {isDutch
              ? '💡 Woordkaarten zijn voor rustige herhaling. Spreekvaardigheid en spraakgeheugen groeien door de woorden spontaan te gebruiken in een live gesprek.'
              : '💡 Browsing flashcards is for calm review. True recall strength grows when words are produced spontaneously in live conversation.'}
          </Text>
        </View>
      </View>
    </Modal>
  );
};
