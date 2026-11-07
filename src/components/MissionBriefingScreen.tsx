import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Flag,
  HelpCircle,
  Play,
  Sparkles,
  UserRound,
  Volume2,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MissionDefinition, Mode } from '../types';
import { useI18n } from '../features/i18n';
import { Button, SectionLabel } from './ui';
import { Sheet } from './Sheet';
import { iconColor } from '../design/iconColor';
import { ELEVATION } from '../design/tokens';
import { NeighborhoodArtwork } from './NeighborhoodArtwork';
import { speakWithBestAvailable } from '../providers/voice/speechOutput';
import { NativeVoiceTransport } from '../providers/voice/nativeVoiceTransport';

export type BriefingStep = 'detail' | 'objectives' | 'prepare';

interface MissionBriefingScreenProps {
  mission: MissionDefinition;
  initialMode: Mode;
  onBack: () => void;
  minimalSupport?: boolean;
  finalSimulation?: boolean;
  onStartSession: (
    mission: MissionDefinition,
    mode: Mode,
    coldAttempt: boolean,
    previewedPhraseIds: string[]
  ) => void;
}

const MODES: Mode[] = ['guided', 'immersion', 'focused'];

export const MissionBriefingScreen: React.FC<MissionBriefingScreenProps> = ({
  mission,
  initialMode,
  onBack,
  minimalSupport = false,
  finalSimulation = false,
  onStartSession,
}) => {
  const { t } = useI18n();
  const [selectedMode, setSelectedMode] = useState<Mode>(
    minimalSupport ? 'immersion' : initialMode
  );
  const [showModeSheet, setShowModeSheet] = useState(false);
  const [showPhrases, setShowPhrases] = useState(false);
  const [previewedSupport, setPreviewedSupport] = useState(false);
  const [isAuditioning, setIsAuditioning] = useState(false);

  const voiceTransportRef = useRef<NativeVoiceTransport | null>(null);

  const visiblePhrases = mission.usefulPhrases.slice(0, 3);
  const primaryModelPhrase = visiblePhrases[0] ?? {
    id: 'phrase-fallback',
    form: 'Dag! Mag ik bestellen, alstublieft?',
    meaning: 'Hello! May I order, please?',
  };
  const previewedPhraseIds = previewedSupport ? visiblePhrases.map(phrase => phrase.id) : [];

  const revealPhrases = () => {
    setShowPhrases(prev => !prev);
    setPreviewedSupport(true);
  };

  const handleAudition = async (text: string) => {
    try {
      setIsAuditioning(true);
      if (!voiceTransportRef.current) {
        voiceTransportRef.current = new NativeVoiceTransport(() => true);
      }
      await speakWithBestAvailable(voiceTransportRef.current, text, {
        language: mission.language,
        locale: mission.language === 'nl' ? 'nl-BE' : undefined,
        speed: 1,
        voice: mission.character.voiceName,
        voiceGender: mission.character.voiceGender,
        style: mission.character.voiceStyle,
      });
    } catch (e) {
      console.warn('Pronunciation audition failed:', e);
    } finally {
      setIsAuditioning(false);
    }
  };

  const modeDescriptions: Record<Mode, { title: string; desc: string }> = {
    guided: { title: t.modes.guided, desc: t.modes.guidedDesc },
    immersion: { title: t.modes.immersion, desc: t.modes.immersionDesc },
    focused: { title: t.modes.focused, desc: t.modes.focusedDesc },
  };

  const handleStart = () => {
    onStartSession(
      mission,
      selectedMode,
      minimalSupport ? true : !previewedSupport,
      minimalSupport ? [] : previewedPhraseIds
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View
        className="w-full self-center flex-row items-center justify-between px-4 py-2"
        style={{ maxWidth: 720 }}
      >
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          className="h-12 w-12 items-center justify-center rounded-full border border-transparent bg-surface-soft hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
        >
          <ArrowLeft size={20} color={iconColor('ink')} />
        </Pressable>

        <View className="flex-1 px-3">
          <Text className="text-xs font-semibold text-muted uppercase tracking-wider">
            {mission.neighborhood || 'België'}
          </Text>
          <Text className="text-16 font-bold text-ink truncate" numberOfLines={1}>
            {mission.title}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5 rounded-full bg-lime px-3 py-1.5">
          <Text className="text-xs font-extrabold text-[#17310F]">
            {mission.levelRange ?? 'A1'}
          </Text>
          <Text className="text-xs font-bold text-[#17310F]">
            · {mission.estimatedMinutes} min
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 32,
          gap: 16,
        }}
      >
        {finalSimulation ? (
          <View className="flex-row items-center gap-2 rounded-full bg-card-sage px-3.5 py-2">
            <Flag size={15} color={iconColor('success')} />
            <Text className="text-xs font-semibold text-accent-sage">
              {t.missions.finalSimulation}
            </Text>
          </View>
        ) : null}

        {/* Neighborhood Hero Artwork with Badge */}
        <View
          className="relative w-full overflow-hidden rounded-[26px]"
          style={{ height: 148, boxShadow: ELEVATION.card }}
        >
          <NeighborhoodArtwork />
          <View className="absolute inset-0 bg-black/30" />
          <View className="absolute left-4 top-3 px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-md">
            <Text className="text-xs font-bold uppercase tracking-wider text-white">
              ROLE-PLAY SCENARIO
            </Text>
          </View>
          <View className="absolute right-4 top-3 px-2.5 py-1 rounded-xl bg-lime">
            <Text className="text-xs font-extrabold text-[#17310F]">
              {mission.levelRange ?? 'A1'}
            </Text>
          </View>
          <View className="absolute left-4 bottom-3 right-4">
            <Text className="text-xs font-bold uppercase tracking-wider text-white/90">
              {mission.neighborhood}
            </Text>
            <Text className="font-display text-22 font-bold text-white leading-tight">
              {mission.title}
            </Text>
          </View>
        </View>

        {/* Situational Goal & Character Card */}
        <View
          className="gap-3.5 rounded-[24px] border border-border-subtle/50 bg-surface p-4 shadow-sm"
          style={{ boxShadow: ELEVATION.card }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="rounded-full bg-language-soft px-3 py-1">
                <Text className="text-xs font-bold text-language">Belgisch-Nederlands</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1.5">
              <UserRound size={15} color={iconColor('muted')} />
              <Text className="text-xs font-bold text-ink">
                {mission.character.name} ({mission.character.role})
              </Text>
            </View>
          </View>

          <View className="h-px bg-border-subtle/40" />

          <View className="gap-1.5">
            <SectionLabel>JOUW DOEL IN DEZE SCÈNE</SectionLabel>
            <Text className="text-16 font-bold leading-6 text-ink">
              {mission.learnerGoal}
            </Text>
            <Text className="text-13 leading-5 text-muted">
              📍 {mission.setting}
            </Text>
            {mission.stretchGoal ? (
              <Text className="text-13 leading-5 text-primary mt-0.5">
                ✦ {t.briefing.stretchChallenge} {mission.stretchGoal}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Model Useful Phrase Card with Direct Audition */}
        <View
          className="gap-3 rounded-[24px] border border-primary/25 bg-surface p-4 shadow-sm"
          style={{ boxShadow: ELEVATION.card }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-extrabold uppercase tracking-wider text-primary">
              HANDIGE ZIN OM TE STARTEN
            </Text>
            <View className="rounded-full bg-lime px-2 py-0.5">
              <Text className="text-xs font-bold text-[#17310F]">Voorbeeldzin</Text>
            </View>
          </View>

          <Text className="font-display text-18 font-bold leading-6 text-ink">
            “{primaryModelPhrase.form}”
          </Text>
          <Text className="text-13 text-muted leading-4">
            {primaryModelPhrase.meaning}
          </Text>

          <View className="pt-1 flex-row items-center gap-3 flex-wrap">
            <Pressable
              onPress={() => void handleAudition(primaryModelPhrase.form)}
              disabled={isAuditioning}
              accessibilityRole="button"
              accessibilityLabel={`Beluister uitspraak: ${primaryModelPhrase.form}`}
              className={`min-h-12 flex-row items-center gap-2 rounded-full px-4 py-2 border transition-all active:scale-95 ${
                isAuditioning
                  ? 'bg-action border-action'
                  : 'bg-surface-soft border-border-interactive/40 hover:bg-surface-hover'
              }`}
            >
              <Volume2
                size={16}
                color={iconColor(isAuditioning ? 'white' : 'brand')}
              />
              <Text
                className={`text-13 font-bold ${
                  isAuditioning ? 'text-white' : 'text-ink'
                }`}
              >
                {isAuditioning ? 'Aan het afspelen…' : 'Beluister uitspraak'}
              </Text>
            </Pressable>

            {visiblePhrases.length > 1 ? (
              <Pressable
                onPress={revealPhrases}
                accessibilityRole="button"
                accessibilityLabel="Toon meer voorbeeldzinnen"
                className="min-h-12 items-center justify-center px-3"
              >
                <Text className="text-xs font-bold text-language">
                  {showPhrases
                    ? 'Minder zinnen tonen'
                    : `Meer zinnen bekijken (${visiblePhrases.length})`}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {showPhrases && visiblePhrases.length > 1 ? (
            <View className="gap-2 border-t border-border-subtle/40 pt-2.5 mt-1">
              {visiblePhrases.slice(1).map(phrase => (
                <View key={phrase.id} className="gap-1 rounded-xl bg-surface-soft p-3">
                  <Text className="text-14 font-semibold text-ink">“{phrase.form}”</Text>
                  <Text className="text-xs text-muted">{phrase.meaning}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Practice Mode Selector Card */}
        <View
          className="gap-2.5 rounded-[24px] border border-border-subtle/50 bg-surface p-4 shadow-sm"
          style={{ boxShadow: ELEVATION.card }}
        >
          <View className="flex-row items-center justify-between">
            <SectionLabel>OEFENMODUS</SectionLabel>
            <Pressable
              onPress={() => setShowModeSheet(true)}
              accessibilityRole="button"
              accessibilityLabel="Wijzig modus"
              className="flex-row items-center gap-1"
            >
              <Text className="text-xs font-bold text-language">Wijzig</Text>
              <ChevronDown size={14} color={iconColor('language')} />
            </Pressable>
          </View>

          <View className="flex-row gap-2">
            {MODES.map(mode => {
              const isSelected = selectedMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setSelectedMode(mode)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  className={`min-h-12 flex-1 items-center justify-center rounded-2xl border px-2 transition-all ${
                    isSelected
                      ? 'border-language bg-language-soft'
                      : 'border-border-interactive/40 bg-surface hover:bg-surface-hover'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold capitalize ${
                      isSelected ? 'text-language' : 'text-body'
                    }`}
                  >
                    {modeDescriptions[mode].title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Helpful Tip */}
        <View className="flex-row items-center gap-2.5 rounded-[20px] bg-card-sage p-3.5">
          <HelpCircle size={18} color={iconColor('success')} />
          <Text className="text-xs leading-4 text-body flex-1">
            Je kunt tijdens het gesprek op elk moment hints vragen of even vertalen.
          </Text>
        </View>
      </ScrollView>

      {/* Direct Bottom Action Bar */}
      <View className="border-t border-border-subtle bg-canvas px-4 pt-3 pb-3">
        <View className="w-full self-center gap-2" style={{ maxWidth: 720 }}>
          <Button
            label={finalSimulation ? t.missions.startFinalSimulation : 'Start Scenario ▶'}
            onPress={handleStart}
            size="lg"
            className="w-full"
            icon={<Play size={18} color={iconColor('brandText')} />}
          />
        </View>
      </View>

      {/* Mode Selection Sheet */}
      <Sheet
        visible={!minimalSupport && showModeSheet}
        onClose={() => setShowModeSheet(false)}
        title={t.briefing.selectMode}
        size="compact"
      >
        <View className="gap-2">
          {MODES.map(mode => {
            const selected = selectedMode === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => {
                  setSelectedMode(mode);
                  setShowModeSheet(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                className={`min-h-[72px] flex-row items-center gap-3 rounded-2xl border p-4 ${
                  selected
                    ? 'border-language bg-language-soft'
                    : 'border-border-interactive bg-surface'
                } hover:bg-surface-hover focus:border-2 focus:border-focus`}
              >
                <View className="flex-1 gap-1">
                  <Text className="text-14 font-semibold text-ink">
                    {modeDescriptions[mode].title}
                  </Text>
                  <Text className="text-13 leading-5 text-muted">
                    {modeDescriptions[mode].desc}
                  </Text>
                </View>
                {selected ? <Check size={19} color={iconColor('brand')} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </SafeAreaView>
  );
};
