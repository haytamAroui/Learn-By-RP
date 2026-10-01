import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  MessageCircle,
  Play,
  UserRound,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MissionDefinition, Mode } from '../types';
import { useI18n } from '../features/i18n';
import { Button, SectionLabel } from './ui';
import { Sheet } from './Sheet';
import { iconColor } from '../design/iconColor';

interface MissionBriefingScreenProps {
  mission: MissionDefinition;
  initialMode: Mode;
  onBack: () => void;
  onStartSession: (mission: MissionDefinition, mode: Mode, coldAttempt: boolean, previewedPhraseIds: string[]) => void;
}

const MODES: Mode[] = ['guided', 'immersion', 'focused'];

const SKILL_LABELS: Record<string, string> = {
  'skill-request-substitution': 'Ask for a change',
  'skill-inquire-specifications': 'Clarify details',
  'skill-propose-alternative': 'Propose an alternative',
  'skill-communicative-repair': 'Repair the conversation',
  'skill-wayfinding-transit': 'Ask for directions',
};

export const MissionBriefingScreen: React.FC<MissionBriefingScreenProps> = ({
  mission,
  initialMode,
  onBack,
  onStartSession,
}) => {
  const { t } = useI18n();
  const [selectedMode, setSelectedMode] = useState<Mode>(initialMode);
  const [showModeSheet, setShowModeSheet] = useState(false);
  const [showPhrases, setShowPhrases] = useState(false);
  const [previewedSupport, setPreviewedSupport] = useState(false);

  const visiblePhrases = mission.usefulPhrases.slice(0, 3);
  const previewedPhraseIds = previewedSupport ? visiblePhrases.map(phrase => phrase.id) : [];

  const revealPhrases = () => {
    setShowPhrases(true);
    setPreviewedSupport(true);
  };

  const modeDescriptions: Record<Mode, { title: string; desc: string }> = {
    guided: { title: t.modes.guided, desc: t.modes.guidedDesc },
    immersion: { title: t.modes.immersion, desc: t.modes.immersionDesc },
    focused: { title: t.modes.focused, desc: t.modes.focusedDesc },
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <View className="w-full self-center flex-row items-center justify-between px-4 py-2" style={{ maxWidth: 1200 }}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          className="h-12 w-12 items-center justify-center rounded-full border border-transparent bg-surface-soft hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
        >
          <ArrowLeft size={21} color={iconColor('ink')} />
        </Pressable>

        <Text className="text-sm font-semibold text-muted">
          {mission.levelRange} · {mission.estimatedMinutes} {t.common.minutes}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 32,
          gap: 28,
        }}
      >
        <View className="items-center gap-4">
          <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-card-warm">
            <MessageCircle size={34} color={iconColor('brand')} strokeWidth={1.8} />
          </View>

          <View className="items-center gap-2">
            <Text className="text-center text-sm font-semibold text-primary">
              {mission.neighborhood}
            </Text>
            <Text className="text-center text-[28px] font-semibold leading-[34px] tracking-tight text-ink">
              {mission.title}
            </Text>
            <Text className="max-w-[560px] text-center text-[15px] leading-[22px] text-body">
              {mission.setting}
            </Text>
          </View>
        </View>

        <View className="gap-5">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft">
              <UserRound size={21} color={iconColor('muted')} />
            </View>
            <View className="flex-1">
              <SectionLabel>{t.briefing.withWhom}</SectionLabel>
              <Text className="mt-1 text-base font-semibold text-ink">
                {mission.character.name} · {mission.character.role}
              </Text>
            </View>
          </View>

          <View className="h-px bg-border-subtle" />

          <View className="gap-2">
            <SectionLabel>{t.common.goal}</SectionLabel>
            <Text className="text-[17px] font-medium leading-[25px] text-ink">
              {mission.learnerGoal}
            </Text>
            {mission.stretchGoal ? (
              <Text className="text-sm leading-5 text-muted">
                {t.briefing.stretchChallenge} {mission.stretchGoal}
              </Text>
            ) : null}
          </View>

          <View className="h-px bg-border-subtle" />

          <View className="gap-3">
            <SectionLabel>{t.progress.skillsTab}</SectionLabel>
            <View className="gap-2">
              {mission.primarySkillIds.map(skillId => (
                <View key={skillId} className="flex-row items-center gap-3">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-card-sage">
                    <Check size={15} color={iconColor('success')} />
                  </View>
                  <Text className="flex-1 text-[15px] font-medium text-ink">
                    {SKILL_LABELS[skillId] ?? skillId.replace(/^skill-/, '').replace(/-/g, ' ')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="gap-3 rounded-[24px] bg-surface-soft p-4">
          <View className="flex-row items-start gap-3">
            {previewedSupport ? (
              <Eye size={20} color={iconColor('brand')} />
            ) : (
              <EyeOff size={20} color={iconColor('success')} />
            )}
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold text-ink">
                {previewedSupport ? t.briefing.previewPhrasesTitle : t.briefing.coldAttemptTitle}
              </Text>
              <Text className="text-sm leading-5 text-muted">
                {previewedSupport ? t.briefing.previewPhrasesDesc : t.briefing.coldAttemptDesc}
              </Text>
            </View>
          </View>

          {!showPhrases ? (
            <Button
              label={t.briefing.usefulPhrasesTitle}
              onPress={revealPhrases}
              variant="secondary"
            />
          ) : (
            <View className="gap-2 border-t border-border-subtle pt-3">
              {visiblePhrases.map(phrase => (
                <View key={phrase.id} className="gap-1 rounded-2xl bg-surface p-3">
                  <Text className="text-[15px] font-semibold text-ink">“{phrase.form}”</Text>
                  <Text className="text-sm leading-5 text-muted">{phrase.meaning}</Text>
                </View>
              ))}
              <Button
                label={t.common.hideTranslation}
                onPress={() => setShowPhrases(false)}
                variant="ghost"
                className="self-start"
              />
            </View>
          )}
        </View>

        <Pressable
          onPress={() => setShowModeSheet(true)}
          accessibilityRole="button"
          className="min-h-[64px] flex-row items-center gap-3 rounded-2xl border border-transparent py-2 hover:bg-surface-hover active:opacity-75 focus:border-2 focus:border-focus"
        >
          <View className="flex-1">
            <SectionLabel>{t.briefing.selectMode}</SectionLabel>
            <Text className="mt-1 text-sm font-semibold text-ink">
              {modeDescriptions[selectedMode].title}
            </Text>
          </View>
          <ChevronRight size={20} color={iconColor('muted')} />
        </Pressable>
      </ScrollView>

      <View className="border-t border-border-subtle bg-canvas px-4 pt-3 pb-2">
        <View className="w-full self-center" style={{ maxWidth: 720 }}>
          <Button
            label={t.briefing.startMissionButton}
            onPress={() =>
              onStartSession(
                mission,
                selectedMode,
                !previewedSupport,
                previewedPhraseIds
              )
            }
            size="lg"
            className="w-full"
            icon={<Play size={18} color={iconColor('brandText')} />}
          />
        </View>
      </View>

      <Sheet
        visible={showModeSheet}
        onClose={() => setShowModeSheet(false)}
        title={t.briefing.selectMode}
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
                    ? 'border-primary bg-card-warm'
                    : 'border-border-interactive bg-surface'
                } hover:bg-surface-hover focus:border-2 focus:border-focus`}
              >
                <View className="flex-1 gap-1">
                  <Text className="text-sm font-semibold text-ink">
                    {modeDescriptions[mode].title}
                  </Text>
                  <Text className="text-sm leading-5 text-muted">
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
