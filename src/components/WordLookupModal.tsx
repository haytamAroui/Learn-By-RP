import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Text } from './AppText';
import { Volume2, X, Sparkles, BookOpen } from 'lucide-react-native';
import { iconColor } from '../design/iconColor';
import { detectBelgianDutchPhonetics } from '../content/phoneticGuidance';
import { speakWithBestAvailable } from '../providers/voice/speechOutput';
import { NativeVoiceTransport } from '../providers/voice/nativeVoiceTransport';

export interface WordLookupTarget {
  word: string;
  sentence: string;
  explanationLanguage?: string;
}

interface WordLookupModalProps {
  target: WordLookupTarget | null;
  onClose: () => void;
}

export const WordLookupModal: React.FC<WordLookupModalProps> = ({
  target,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const voiceTransportRef = React.useRef<NativeVoiceTransport | null>(null);

  if (!target) return null;

  const phonetics = detectBelgianDutchPhonetics(target.word);

  const handlePronounce = async () => {
    try {
      setIsPlaying(true);
      if (!voiceTransportRef.current) {
        voiceTransportRef.current = new NativeVoiceTransport(() => true);
      }
      await speakWithBestAvailable(voiceTransportRef.current, target.word, {
        language: 'nl',
        locale: 'nl-BE',
        speed: 0.9,
      });
    } catch (e) {
      console.warn('Word pronunciation failed:', e);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <Modal
      visible={Boolean(target)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityLabel="Close word lookup"
        />
        <View
          className="rounded-t-[32px] border-t border-border-interactive/40 bg-surface p-6 shadow-2xl"
          style={{ maxWidth: 640, width: '100%', alignSelf: 'center' }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-border-interactive/20">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 rounded-full bg-language-soft items-center justify-center">
                <BookOpen size={16} color={iconColor('language')} />
              </View>
              <Text className="text-xs font-bold uppercase tracking-wider text-muted">
                Vlaams Woord & Context
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Sluiten"
              className="h-12 w-12 items-center justify-center rounded-full bg-surface-soft hover:bg-surface-hover active:scale-95"
            >
              <X size={20} color={iconColor('ink')} />
            </Pressable>
          </View>

          {/* Word & Pronunciation Action */}
          <View className="py-5 gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="font-display text-3xl font-bold tracking-tight text-ink">
                {target.word}
              </Text>

              <Pressable
                onPress={handlePronounce}
                disabled={isPlaying}
                accessibilityRole="button"
                accessibilityLabel={`Luister naar ${target.word}`}
                className={`min-h-12 px-4 rounded-full flex-row items-center gap-2 ${
                  isPlaying ? 'bg-language' : 'bg-surface-soft border border-border-interactive/40 hover:bg-surface-hover'
                } active:scale-95 transition-all`}
              >
                <Volume2 size={18} color={iconColor(isPlaying ? 'brandText' : 'language')} />
                <Text
                  className={`text-xs font-bold ${
                    isPlaying ? 'text-surface' : 'text-language'
                  }`}
                >
                  {isPlaying ? 'Spreekt...' : 'Luister'}
                </Text>
              </Pressable>
            </View>

            {/* Sentence context */}
            <View className="rounded-2xl bg-canvas p-4 border border-border-interactive/30 gap-1.5">
              <Text className="text-xs font-bold text-muted uppercase tracking-wider">
                In deze zin:
              </Text>
              <Text className="text-base italic leading-6 text-ink">
                "{target.sentence}"
              </Text>
            </View>

            {/* Phonetic / SoundSteps Guidance */}
            {phonetics ? (
              <View className="rounded-2xl bg-language-soft/60 p-3.5 border border-language/30 flex-row items-start gap-3">
                <Sparkles size={18} color={iconColor('language')} style={{ marginTop: 2 }} />
                <View className="flex-1 gap-0.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs font-bold text-language">
                      {phonetics.feature}
                    </Text>
                    <Text className="text-xs font-mono font-bold text-ink">
                      {phonetics.ipa}
                    </Text>
                  </View>
                  <Text className="text-xs text-ink/80 leading-4">
                    {phonetics.tip}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Close CTA */}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Doorgaan met gesprek"
            className="min-h-12 w-full items-center justify-center rounded-full bg-brand-primary active:scale-95 transition-all shadow-sm"
          >
            <Text className="text-sm font-bold text-brandText">
              Doorgaan met gesprek
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
