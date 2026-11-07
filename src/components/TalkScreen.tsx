import React, { useState, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
import {
  BookOpen,
  Compass,
  Grid,
  Layers,
  Mic,
  Sparkles,
  Subtitles,
  Volume2,
} from 'lucide-react-native';
import { MissionDefinition, PhraseItem } from '../types';
import { useI18n } from '../features/i18n';
import { iconColor } from '../design/iconColor';
import { LivingVoiceOrb } from './LivingVoiceOrb';
import { CharacterStageAvatar } from './CharacterStageAvatar';
import { segmentCaptionWords } from '../utils/captionWords';
import { WordLookupModal, WordLookupTarget } from './WordLookupModal';
import { speakWithBestAvailable } from '../providers/voice/speechOutput';
import { NativeVoiceTransport } from '../providers/voice/nativeVoiceTransport';

interface TalkScreenProps {
  currentLanguageName: string;
  featuredMission: MissionDefinition;
  duePhrases: PhraseItem[];
  onStartMission: (mission: MissionDefinition) => void;
  onExploreMissions: () => void;
  onPracticeDue: () => void;
  onViewProgress: () => void;
}

export const TalkScreen: React.FC<TalkScreenProps> = ({
  currentLanguageName,
  featuredMission,
  duePhrases,
  onStartMission,
  onExploreMissions,
  onPracticeDue,
  onViewProgress,
}) => {
  const { t } = useI18n();

  const [visualMode, setVisualMode] = useState<'orb' | 'avatar'>('orb');
  const [showMeaning, setShowMeaning] = useState<boolean>(true);
  const [lookupTarget, setLookupTarget] = useState<WordLookupTarget | null>(null);
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
  const voiceTransportRef = useRef<NativeVoiceTransport | null>(null);

  const characterName = featuredMission.character.name;
  const samplePhrase =
    featuredMission.sampleConversation?.find(turn => turn.speaker === 'character')?.nl ||
    featuredMission.usefulPhrases?.[0]?.form ||
    'Goeiemorgen! Welkom bij ons. Wat mag het voor u zijn vandaag?';
  const sampleMeaning =
    featuredMission.sampleConversation?.find(turn => turn.speaker === 'character')?.fr ||
    featuredMission.usefulPhrases?.[0]?.meaningTranslations?.fr ||
    featuredMission.usefulPhrases?.[0]?.meaning ||
    'Bonjour ! Bienvenue chez nous. Que puis-je vous servir aujourd’hui ?';

  const segments = segmentCaptionWords(samplePhrase);

  const handleAudition = async () => {
    try {
      setIsAuditioning(true);
      if (!voiceTransportRef.current) {
        voiceTransportRef.current = new NativeVoiceTransport(() => true);
      }
      await speakWithBestAvailable(voiceTransportRef.current, samplePhrase, {
        language: 'nl',
        locale: 'nl-BE',
        speed: 1.0,
        voiceGender: featuredMission.character.voiceGender,
        voice: featuredMission.character.voiceName,
      });
    } catch (e) {
      console.warn('Audition failed:', e);
    } finally {
      setIsAuditioning(false);
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 640,
          alignSelf: 'center',
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 40,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Active Scenario Pill (Mural Header Style) */}
        <View className="flex-row items-center justify-between gap-2 pt-1">
          <Pressable
            onPress={onExploreMissions}
            accessibilityRole="button"
            accessibilityLabel={`Huidige situatie: ${featuredMission.title}. Tik om thema te wijzigen.`}
            className="min-h-12 flex-1 flex-row items-center gap-2 rounded-full border border-border-interactive/40 bg-surface px-4 shadow-sm hover:bg-surface-hover active:scale-98"
          >
            <View className="h-6 w-6 rounded-full bg-language-soft items-center justify-center">
              <Compass size={14} color={iconColor('language')} />
            </View>
            <Text className="text-xs font-bold text-ink" numberOfLines={1}>
              {featuredMission.title} · {featuredMission.neighborhood || featuredMission.setting || 'Gent'}
            </Text>
            <View className="rounded-full bg-lime px-2 py-0.5">
              <Text className="text-xs font-extrabold text-[#17310F]">
                {featuredMission.levelRange ?? 'A1'}
              </Text>
            </View>
          </Pressable>

          {/* Toggle Orb vs Character Avatar */}
          <Pressable
            onPress={() => setVisualMode(m => (m === 'orb' ? 'avatar' : 'orb'))}
            accessibilityRole="button"
            accessibilityLabel={`Wissel visuele weergave: nu ${visualMode === 'orb' ? 'Orb' : 'Avatar'}`}
            className="min-h-12 px-3.5 rounded-full border border-border-interactive/40 bg-surface flex-row items-center gap-1.5 shadow-sm hover:bg-surface-hover active:scale-95"
          >
            <Layers size={15} color={iconColor('ink')} />
            <Text className="text-xs font-bold text-ink">
              {visualMode === 'orb' ? 'Orb 🔮' : 'Avatar 👩'}
            </Text>
          </Pressable>
        </View>

        {/* Center Stage: Living Voice Orb / Character Avatar */}
        <View className="items-center justify-center py-4">
          {visualMode === 'orb' ? (
            <LivingVoiceOrb state={isAuditioning ? 'speaking' : 'idle'} size={170} />
          ) : (
            <View className="items-center justify-center">
              <CharacterStageAvatar
                mission={featuredMission}
                size={160}
              />
              <Text className="mt-2 text-xs font-bold text-muted">
                {characterName} · {featuredMission.character.role}
              </Text>
            </View>
          )}
        </View>

        {/* Central Spoken Phrase with Tap-to-Lookup (Mural Linked Caption) */}
        <View className="gap-2.5 rounded-[28px] border border-border-interactive/30 bg-surface p-6 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-wider text-primary">
              {characterName} spreekt:
            </Text>
            <Pressable
              onPress={handleAudition}
              disabled={isAuditioning}
              accessibilityRole="button"
              accessibilityLabel={`Beluister uitspraak van ${characterName}`}
              className="min-h-12 px-3 rounded-full bg-surface-soft border border-border-interactive/40 flex-row items-center gap-1.5 active:scale-95"
            >
              <Volume2 size={15} color={iconColor('primary')} />
              <Text className="text-xs font-bold text-primary">
                {isAuditioning ? 'Spreekt...' : 'Beluister'}
              </Text>
            </Pressable>
          </View>

          {/* Clickable Words */}
          <View className="flex-row flex-wrap items-center pt-1">
            {segments.map((segment, index) => {
              if (segment.lookup) {
                return (
                  <Pressable
                    key={index}
                    onPress={() =>
                      setLookupTarget({
                        word: segment.lookup!,
                        sentence: samplePhrase,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Woorduitleg: ${segment.lookup}`}
                    className="min-h-12 min-w-8 items-center justify-center rounded-lg px-0.5 hover:bg-language-soft active:opacity-70"
                  >
                    <Text className="font-display text-20 font-bold leading-7 text-ink underline decoration-language/50 decoration-2">
                      {segment.text}
                    </Text>
                  </Pressable>
                );
              }
              return (
                <Text
                  key={index}
                  className="font-display text-20 font-bold leading-7 text-ink"
                >
                  {segment.text}
                </Text>
              );
            })}
          </View>

          <Text className="text-xs text-muted">
            Tik op een woord voor betekenis in deze zin.
          </Text>

          {/* Discreet Meaning Subtitle */}
          {showMeaning ? (
            <View className="pt-3 mt-1 border-t border-border-interactive/20">
              <Text className="text-xs font-bold text-muted uppercase tracking-wider">
                Vertaling:
              </Text>
              <Text className="text-sm italic leading-5 text-muted mt-0.5">
                "{sampleMeaning}"
              </Text>
            </View>
          ) : null}
        </View>

        {/* Primary Mural Action Controls (3-Button Dock) */}
        <View className="items-center justify-center gap-2 pt-2">
          {/* Mural 3-Button Dock */}
          <View className="w-full flex-row items-center justify-around px-4">
            {/* Left: Meaning / Translation Toggle */}
            <View className="items-center justify-center gap-1">
              <Pressable
                onPress={() => setShowMeaning(v => !v)}
                accessibilityRole="button"
                accessibilityLabel={showMeaning ? 'Verberg vertaling' : 'Toon vertaling'}
                className={`h-14 w-14 items-center justify-center rounded-full border ${
                  showMeaning
                    ? 'border-brand-primary bg-language-soft'
                    : 'border-border-interactive/40 bg-surface-soft hover:bg-surface-hover'
                } active:scale-95`}
              >
                <Subtitles size={22} color={iconColor(showMeaning ? 'brand' : 'ink')} />
              </Pressable>
              <Text className="text-xs font-medium text-muted">
                Betekenis
              </Text>
            </View>

            {/* Center: Large 80px Glowing Mic Button */}
            <View className="items-center justify-center gap-1.5">
              <Pressable
                onPress={() => onStartMission(featuredMission)}
                accessibilityRole="button"
                accessibilityLabel={`Start gesprek met ${characterName}`}
                className="h-20 w-20 items-center justify-center rounded-full bg-action shadow-xl ring-8 ring-action/25 active:scale-95 transition-all"
              >
                <Mic size={34} color={iconColor('brandText')} />
              </Pressable>
              <Text className="text-xs font-bold text-ink">
                Babbel met {characterName}
              </Text>
            </View>

            {/* Right: Themes & Missions Button */}
            <View className="items-center justify-center gap-1">
              <Pressable
                onPress={onExploreMissions}
                accessibilityRole="button"
                accessibilityLabel="Kies een ander Vlaams scenario"
                className="h-14 w-14 items-center justify-center rounded-full border border-border-interactive/40 bg-surface-soft hover:bg-surface-hover active:scale-95"
              >
                <Grid size={22} color={iconColor('ink')} />
              </Pressable>
              <Text className="text-xs font-medium text-muted">
                Thema's
              </Text>
            </View>
          </View>

          <Text className="text-xs text-muted text-center pt-1">
            Microfoon klaar · Vrijuit spreken of typen
          </Text>
        </View>

        {/* Vocabulary & Progress Cards (Mural 3-Bar Recall Summary) */}
        <View className="gap-2.5 rounded-[24px] border border-border-interactive/30 bg-surface p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <BookOpen size={16} color={iconColor('language')} />
              <Text className="text-xs font-bold text-ink">
                Woordenschat & Herinnering (3 Balkjes)
              </Text>
            </View>
            <Pressable
              onPress={onViewProgress}
              accessibilityRole="button"
              accessibilityLabel="Bekijk alle woorden"
              className="min-h-12 justify-center px-2"
            >
              <Text className="text-xs font-bold text-primary">
                Bekijk alles →
              </Text>
            </Pressable>
          </View>

          <Text className="text-xs text-muted leading-4">
            Woorden worden versterkt over 3 fasen (zelfstandig, meerdere dagen, verschillende situaties).
          </Text>

          <View className="flex-row items-center gap-3 pt-1">
            <Pressable
              onPress={onPracticeDue}
              accessibilityRole="button"
              accessibilityLabel={`Oefen ${duePhrases.length} te herhalen woorden`}
              className="min-h-12 flex-1 flex-row items-center justify-between rounded-2xl bg-canvas border border-border-interactive/30 px-3.5 active:scale-98"
            >
              <Text className="text-xs font-bold text-ink">
                Te herhalen: {duePhrases.length}
              </Text>
              <Sparkles size={16} color={iconColor('brand')} />
            </Pressable>

            <Pressable
              onPress={onViewProgress}
              accessibilityRole="button"
              accessibilityLabel="Bekijk taalgroei rapport"
              className="min-h-12 flex-1 flex-row items-center justify-between rounded-2xl bg-canvas border border-border-interactive/30 px-3.5 active:scale-98"
            >
              <Text className="text-xs font-bold text-ink">
                Taalgroei A1-B1
              </Text>
              <Text className="text-xs font-extrabold text-primary">→</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Word Contextual Lookup Bottom Sheet Modal */}
      <WordLookupModal
        target={lookupTarget}
        onClose={() => setLookupTarget(null)}
      />
    </View>
  );
};
