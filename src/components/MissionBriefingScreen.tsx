import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Flag,
  HelpCircle,
  MessageCircle,
  Play,
  RotateCcw,
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
  onStartSession: (mission: MissionDefinition, mode: Mode, coldAttempt: boolean, previewedPhraseIds: string[]) => void;
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
  const [step, setStep] = useState<BriefingStep>('detail');
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
    setShowPhrases(true);
    setPreviewedSupport(true);
  };

  const handleAudition = async (text: string) => {
    try {
      setIsAuditioning(true);
      if (!voiceTransportRef.current) {
        voiceTransportRef.current = new NativeVoiceTransport(() => true);
      }
      await speakWithBestAvailable(voiceTransportRef.current, text, {
        language: 'nl',
        locale: 'nl-BE',
        speed: 1,
        voice: 'despina',
      });
    } catch (e) {
      console.warn('Pronunciation audition failed:', e);
    } finally {
      setIsAuditioning(false);
    }
  };

  const handleBack = () => {
    if (step === 'prepare') {
      setStep('objectives');
    } else if (step === 'objectives') {
      setStep('detail');
    } else {
      onBack();
    }
  };

  const skillLabels: Record<string, string> = {
    'skill-request-substitution': t.briefing.skillRequestSubstitution,
    'skill-inquire-specifications': t.briefing.skillInquireSpecifications,
    'skill-propose-alternative': t.briefing.skillProposeAlternative,
    'skill-communicative-repair': t.briefing.skillCommunicativeRepair,
    'skill-wayfinding-transit': t.briefing.skillWayfindingTransit,
  };

  const modeDescriptions: Record<Mode, { title: string; desc: string }> = {
    guided: { title: t.modes.guided, desc: t.modes.guidedDesc },
    immersion: { title: t.modes.immersion, desc: t.modes.immersionDesc },
    focused: { title: t.modes.focused, desc: t.modes.focusedDesc },
  };

  const stepNumber = step === 'detail' ? 1 : step === 'objectives' ? 2 : 3;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      {/* Top Bar with Step Progress Counter */}
      <View className="w-full self-center flex-row items-center justify-between px-4 py-2" style={{ maxWidth: 720 }}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          className="h-12 w-12 items-center justify-center rounded-full border border-transparent bg-surface-soft hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
        >
          <ArrowLeft size={20} color={iconColor('ink')} />
        </Pressable>

        {/* Step Indicator Pill */}
        <View className="flex-row items-center gap-1.5 rounded-full bg-surface-soft px-3 py-1.5 border border-border-interactive/30">
          <View className="flex-row gap-1 items-center">
            <View className={`h-2 w-2 rounded-full ${stepNumber >= 1 ? 'bg-primary' : 'bg-surface-sunken'}`} />
            <View className={`h-2 w-2 rounded-full ${stepNumber >= 2 ? 'bg-primary' : 'bg-surface-sunken'}`} />
            <View className={`h-2 w-2 rounded-full ${stepNumber >= 3 ? 'bg-primary' : 'bg-surface-sunken'}`} />
          </View>
          <Text className="text-xs font-bold text-muted ml-1">
            {stepNumber} / 3
          </Text>
        </View>

        <View className="rounded-full bg-surface-soft px-3 py-1.5 border border-border-interactive/30">
          <Text className="text-xs font-semibold text-muted">
            {mission.levelRange} · {mission.estimatedMinutes} {t.common.minutes}
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
          paddingTop: 16,
          paddingBottom: 32,
          gap: 20,
        }}
      >
        {/* ============================================================== */}
        {/* STEP 1: SCENARIO PREVIEW (scenario-detail)                     */}
        {/* ============================================================== */}
        {step === 'detail' ? (
          <>
            <View className="items-center gap-3">
              {finalSimulation ? (
                <View className="flex-row items-center gap-2 rounded-full bg-card-sage px-3 py-2">
                  <Flag size={15} color={iconColor('success')} />
                  <Text className="text-xs font-semibold text-accent-sage">
                    {t.missions.finalSimulation}
                  </Text>
                </View>
              ) : null}

              {/* Neighborhood Hero Artwork with Badge */}
              <View className="relative w-full overflow-hidden rounded-[28px]" style={{ height: 160, boxShadow: ELEVATION.card }}>
                <NeighborhoodArtwork />
                <View className="absolute inset-0 bg-black/30" />
                <View className="absolute left-4 top-3 px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-md">
                  <Text className="text-xs font-bold uppercase tracking-wider text-white">
                    ROLE-PLAY · {mission.estimatedMinutes} MIN
                  </Text>
                </View>
                <View className="absolute right-4 top-3 px-2.5 py-1 rounded-xl bg-lime">
                  <Text className="text-xs font-extrabold text-[#17310F]">
                    {mission.levelRange}
                  </Text>
                </View>
                <View className="absolute left-4 bottom-3 right-4">
                  <Text className="text-xs font-bold uppercase tracking-wider text-white/90">
                    {mission.neighborhood}
                  </Text>
                  <Text className="font-display text-24 font-bold text-white leading-tight">
                    {mission.title}
                  </Text>
                </View>
              </View>

              <Text className="text-center text-15 leading-6 text-body max-w-[560px]">
                {mission.setting}
              </Text>
            </View>

            {/* Context & Intentions Card */}
            <View className="gap-4 rounded-[24px] border border-border-subtle/50 bg-surface p-5" style={{ boxShadow: ELEVATION.card }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="rounded-full bg-language-soft px-3 py-1">
                    <Text className="text-xs font-bold text-language">Belgian Dutch</Text>
                  </View>
                  <View className="rounded-full bg-surface-soft px-3 py-1 border border-border-interactive/30">
                    <Text className="text-xs font-semibold text-muted">A1 Beginner</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <UserRound size={16} color={iconColor('muted')} />
                  <Text className="text-xs font-semibold text-ink">
                    {mission.character.name}
                  </Text>
                </View>
              </View>

              <View className="h-px bg-border-subtle" />

              <View className="gap-2">
                <SectionLabel>Your Situational Goal</SectionLabel>
                <Text className="text-17 font-semibold leading-6 text-ink">
                  {mission.learnerGoal}
                </Text>
                {mission.stretchGoal ? (
                  <Text className="text-14 leading-5 text-muted">
                    {t.briefing.stretchChallenge} {mission.stretchGoal}
                  </Text>
                ) : null}
              </View>

              <View className="h-px bg-border-subtle" />

              <View className="gap-2.5">
                <SectionLabel>You'll practise:</SectionLabel>
                <View className="gap-2">
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-6 w-6 rounded-full bg-card-sage items-center justify-center">
                      <Check size={14} color={iconColor('success')} />
                    </View>
                    <Text className="text-14 font-medium text-ink">
                      A polite Belgian Dutch greeting and natural opening
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-6 w-6 rounded-full bg-card-sage items-center justify-center">
                      <Check size={14} color={iconColor('success')} />
                    </View>
                    <Text className="text-14 font-medium text-ink">
                      A clear request with polite particles (alstublieft)
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-6 w-6 rounded-full bg-card-sage items-center justify-center">
                      <Check size={14} color={iconColor('success')} />
                    </View>
                    <Text className="text-14 font-medium text-ink">
                      Inquiring about specifications, options, or price
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-6 w-6 rounded-full bg-card-sage items-center justify-center">
                      <Check size={14} color={iconColor('success')} />
                    </View>
                    <Text className="text-14 font-medium text-ink">
                      Communicative repair and graceful recovery if stuck
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : null}

        {/* ============================================================== */}
        {/* STEP 2: MISSION OBJECTIVES (scenario-objectives)               */}
        {/* ============================================================== */}
        {step === 'objectives' ? (
          <>
            <View className="gap-2">
              <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">
                MISSION BRIEFING
              </Text>
              <Text className="font-display text-28 font-bold leading-tight tracking-tight text-ink">
                What would success look like?
              </Text>
              <Text className="text-15 leading-6 text-muted">
                You decide what to say; there isn't a single magic answer. Focus on clear, everyday communication.
              </Text>
            </View>

            {/* 4 Clean Intention Rows matching Lingo Atelier */}
            <View className="gap-3">
              <View className="flex-row items-center gap-3.5 rounded-[20px] border border-border-interactive/30 bg-surface p-4 shadow-sm">
                <View className="h-12 w-12 rounded-2xl bg-[#FFE6DD] items-center justify-center">
                  <MessageCircle size={22} color="#E4533C" />
                </View>
                <View className="flex-1">
                  <Text className="text-15 font-bold text-ink">Start warmly</Text>
                  <Text className="text-13 text-muted">Greet {mission.character.name} with “Dag!” or “Goeiemorgen”</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3.5 rounded-[20px] border border-border-interactive/30 bg-surface p-4 shadow-sm">
                <View className="h-12 w-12 rounded-2xl bg-[#DFF2EA] items-center justify-center">
                  <Sparkles size={22} color="#0E8F7E" />
                </View>
                <View className="flex-1">
                  <Text className="text-15 font-bold text-ink">Ask for something</Text>
                  <Text className="text-13 text-muted">{mission.learnerGoal}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3.5 rounded-[20px] border border-border-interactive/30 bg-surface p-4 shadow-sm">
                <View className="h-12 w-12 rounded-2xl bg-[#FFF0CF] items-center justify-center">
                  <Check size={22} color="#B7791F" />
                </View>
                <View className="flex-1">
                  <Text className="text-15 font-bold text-ink">Check details or price</Text>
                  <Text className="text-13 text-muted">Ask “Hoeveel kost dat?” or confirm specifications</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3.5 rounded-[20px] border border-border-interactive/30 bg-surface p-4 shadow-sm">
                <View className="h-12 w-12 rounded-2xl bg-[#ECE6FF] items-center justify-center">
                  <RotateCcw size={22} color="#7A63E0" />
                </View>
                <View className="flex-1">
                  <Text className="text-15 font-bold text-ink">Handle a surprise</Text>
                  <Text className="text-13 text-muted">Ask them to repeat or clarify if you miss a word</Text>
                </View>
              </View>
            </View>

            {/* Interlocutor & Practice Mode Summary Card */}
            <View className="flex-row items-center justify-between rounded-[22px] border border-border-subtle bg-surface-soft p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface">
                  <UserRound size={18} color={iconColor('muted')} />
                </View>
                <View>
                  <Text className="text-xs font-semibold text-muted">Partner</Text>
                  <Text className="text-14 font-bold text-ink">{mission.character.name} ({mission.character.role})</Text>
                </View>
              </View>

              {!minimalSupport ? (
                <Pressable
                  onPress={() => setShowModeSheet(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Change practice mode"
                  className="min-h-12 flex-row items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 border border-border-interactive/40"
                >
                  <Text className="text-xs font-bold text-primary">
                    {modeDescriptions[selectedMode].title}
                  </Text>
                  <ChevronRight size={14} color={iconColor('brand')} />
                </Pressable>
              ) : null}
            </View>
          </>
        ) : null}

        {/* ============================================================== */}
        {/* STEP 3: GET READY (scenario-prepare)                           */}
        {/* ============================================================== */}
        {step === 'prepare' ? (
          <>
            <View className="gap-2">
              <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">
                GET READY
              </Text>
              <Text className="font-display text-28 font-bold leading-tight tracking-tight text-ink">
                Your {mission.neighborhood} moment.
              </Text>
              <Text className="text-15 leading-6 text-muted">
                You're in Belgian Dutch everyday life. {mission.character.name} is waiting to help.
              </Text>
            </View>

            {/* Featured Model Phrase Card with Pronunciation Audition */}
            <View className="gap-3 rounded-[24px] border border-primary/25 bg-surface p-5 shadow-sm" style={{ boxShadow: ELEVATION.card }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  YOU CAN SAY
                </Text>
                <View className="rounded-full bg-lime px-2.5 py-0.5">
                  <Text className="text-xs font-bold text-[#17310F]">Model phrase</Text>
                </View>
              </View>

              <Text className="font-display text-20 font-bold leading-7 text-ink">
                “{primaryModelPhrase.form}”
              </Text>
              <Text className="text-14 text-muted leading-5">
                {primaryModelPhrase.meaning}
              </Text>

              <View className="pt-2 flex-row items-center gap-3">
                <Pressable
                  onPress={() => void handleAudition(primaryModelPhrase.form)}
                  disabled={isAuditioning}
                  accessibilityRole="button"
                  accessibilityLabel="Hear pronunciation"
                  className="min-h-12 flex-row items-center gap-2 rounded-full bg-surface-soft px-4 py-2 border border-border-interactive/50 hover:bg-surface-hover active:scale-95 transition-all"
                >
                  <Volume2 size={18} color={iconColor('brand')} />
                  <Text className="text-13 font-bold text-ink">
                    {isAuditioning ? 'Playing audio…' : 'Hear pronunciation'}
                  </Text>
                </Pressable>

                {!showPhrases ? (
                  <Pressable
                    onPress={revealPhrases}
                    accessibilityRole="button"
                    accessibilityLabel="View more phrases"
                    className="min-h-12 items-center justify-center px-3"
                  >
                    <Text className="text-xs font-semibold text-primary">
                      More phrases ({visiblePhrases.length})
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {showPhrases && visiblePhrases.length > 1 ? (
                <View className="gap-2 border-t border-border-subtle pt-3 mt-1">
                  {visiblePhrases.slice(1).map(phrase => (
                    <View key={phrase.id} className="gap-1 rounded-xl bg-surface-soft p-3">
                      <Text className="text-14 font-semibold text-ink">“{phrase.form}”</Text>
                      <Text className="text-xs text-muted">{phrase.meaning}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Need Help notice card */}
            <View className="flex-row items-start gap-3 rounded-[22px] bg-card-sage p-4">
              <HelpCircle size={20} color={iconColor('success')} style={{ marginTop: 2 }} />
              <View className="flex-1 gap-1">
                <Text className="text-14 font-bold text-ink">Need help during the scene?</Text>
                <Text className="text-13 leading-5 text-body">
                  During roleplay, you can tap the hint button or coach card anytime. We'll remember whether you used guidance for your learning ledger.
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Persistent Bottom Action Bar */}
      <View className="border-t border-border-subtle bg-canvas px-4 pt-3 pb-3">
        <View className="w-full self-center gap-2" style={{ maxWidth: 720 }}>
          {step === 'detail' ? (
            <Button
              label="See mission goals"
              onPress={() => setStep('objectives')}
              size="lg"
              className="w-full"
              icon={<ArrowRight size={18} color={iconColor('brandText')} />}
            />
          ) : step === 'objectives' ? (
            <Button
              label="Prepare my conversation"
              onPress={() => setStep('prepare')}
              size="lg"
              className="w-full"
              icon={<ArrowRight size={18} color={iconColor('brandText')} />}
            />
          ) : (
            <Button
              label={finalSimulation ? t.missions.startFinalSimulation : 'Enter the scene'}
              onPress={() =>
                onStartSession(
                  mission,
                  selectedMode,
                  minimalSupport ? true : !previewedSupport,
                  minimalSupport ? [] : previewedPhraseIds
                )
              }
              size="lg"
              className="w-full"
              icon={<Play size={18} color={iconColor('brandText')} />}
            />
          )}

          {step === 'detail' ? (
            <Button
              label="Skip straight to conversation"
              onPress={() =>
                onStartSession(
                  mission,
                  selectedMode,
                  minimalSupport ? true : !previewedSupport,
                  minimalSupport ? [] : previewedPhraseIds
                )
              }
              variant="ghost"
              size="sm"
              className="self-center"
            />
          ) : null}
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
