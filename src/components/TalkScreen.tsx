import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
import {
  ArrowRight,
  Clock3,
  Compass,
  MessageCircle,
  Mic,
  Sparkles,
} from 'lucide-react-native';
import { MissionDefinition, PhraseItem } from '../types';
import { useI18n } from '../features/i18n';
import { iconColor } from '../design/iconColor';
import { ELEVATION } from '../design/tokens';

interface TalkScreenProps {
  currentLanguageName: string;
  featuredMission: MissionDefinition;
  duePhrases: PhraseItem[];
  onStartMission: (mission: MissionDefinition) => void;
  onExploreMissions: () => void;
  onPracticeDue: () => void;
  onViewProgress: () => void;
}

/**
 * Modern, clean, hero-focused Home screen for everyday Belgian Dutch practice.
 * Eliminates visual noise and provides one clear primary action.
 */
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

  const dueCount = duePhrases.length;

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 640,
          alignSelf: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Friendly Top Welcome */}
        <View className="gap-1.5">
          <View className="self-start flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-surface-soft border border-border-subtle/50">
            <Text className="text-xs font-semibold text-brand-primary">
              🇧🇪 {currentLanguageName}
            </Text>
            <Text className="text-xs text-muted">·</Text>
            <Text className="text-xs text-muted font-medium">
              {t.talk.tagPractice}
            </Text>
          </View>
          <Text className="font-display text-[26px] font-bold tracking-tight text-ink mt-1">
            {t.talk.heading}
          </Text>
          <Text className="text-sm leading-5 text-muted">
            {t.talk.subheading}
          </Text>
        </View>

        {/* Primary Hero Mission Card */}
        <View
          className="rounded-[28px] border border-border-subtle/60 bg-surface p-6 gap-4"
          style={{ boxShadow: ELEVATION.card }}
        >
          {/* Character and Context Header */}
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 rounded-2xl bg-brand-primary/10 items-center justify-center border border-brand-primary/20">
                <MessageCircle size={24} color={iconColor('brandText')} />
              </View>
              <View className="gap-0.5">
                <Text className="text-sm font-bold text-ink">
                  {featuredMission.character.name}
                </Text>
                <Text className="text-xs text-muted">
                  {featuredMission.character.role} · {featuredMission.neighborhood}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1.5">
              <View className="px-2.5 py-0.5 rounded-full bg-accent-sage/20 border border-accent-sage/30">
                <Text className="text-xs font-bold text-accent-sage">
                  {featuredMission.levelRange}
                </Text>
              </View>
              <Text className="text-xs font-medium text-muted">
                {featuredMission.estimatedMinutes} min
              </Text>
            </View>
          </View>

          {/* Mission Job & Title */}
          <View className="gap-1.5 py-1">
            <Text className="font-display text-xl font-bold text-ink leading-tight">
              {featuredMission.title}
            </Text>
            <Text className="text-sm leading-relaxed text-body">
              {featuredMission.learnerGoal}
            </Text>
          </View>

          {/* Big, Inviting Primary Action */}
          <Pressable
            onPress={() => onStartMission(featuredMission)}
            accessibilityRole="button"
            accessibilityLabel={`${t.talk.startConversation} with ${featuredMission.character.name}`}
            className="min-h-[52px] w-full flex-row items-center justify-center gap-2 rounded-2xl bg-action px-5 hover:opacity-95 active:scale-[0.98] transition-all focus:border-2 focus:border-focus"
          >
            <Mic size={20} color={iconColor('brandText')} />
            <Text className="text-base font-bold text-brandText">
              {t.talk.startConversation}
            </Text>
            <ArrowRight size={18} color={iconColor('brandText')} />
          </Pressable>
        </View>

        {/* Due Phrases Review Bar (Only shown when phrases are due) */}
        {dueCount > 0 ? (
          <Pressable
            onPress={onPracticeDue}
            accessibilityRole="button"
            accessibilityLabel={`${dueCount} phrases due for review`}
            className="min-h-12 flex-row items-center justify-between rounded-2xl border border-accent-sage/30 bg-card-sage/60 px-4 py-3 hover:opacity-90 active:scale-[0.99] transition-all"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 rounded-xl bg-accent-sage/20 items-center justify-center">
                <Clock3 size={18} color={iconColor('success')} />
              </View>
              <View className="gap-0.5">
                <Text className="text-sm font-bold text-ink">
                  {t.progress.readyToPractise} ({dueCount})
                </Text>
                <Text className="text-xs text-muted">
                  Spaced repetition retrieval
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-xs font-bold text-accent-sage">
                {t.common.start}
              </Text>
              <ArrowRight size={14} color={iconColor('success')} />
            </View>
          </Pressable>
        ) : null}

        {/* Situations & Progress Links */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={onExploreMissions}
            accessibilityRole="button"
            accessibilityLabel={t.talk.browseAllButton}
            className="min-h-[56px] flex-1 flex-row items-center gap-3 rounded-2xl border border-border-subtle/50 bg-surface px-4 py-3 hover:bg-surface-hover active:scale-[0.98] transition-all"
          >
            <View className="h-9 w-9 rounded-xl bg-surface-soft items-center justify-center">
              <Compass size={18} color={iconColor('ink')} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-muted">
                {t.nav.missions}
              </Text>
              <Text className="text-sm font-bold text-ink truncate">
                {t.talk.exploreTopics}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={onViewProgress}
            accessibilityRole="button"
            accessibilityLabel={t.nav.progress}
            className="min-h-[56px] flex-1 flex-row items-center gap-3 rounded-2xl border border-border-subtle/50 bg-surface px-4 py-3 hover:bg-surface-hover active:scale-[0.98] transition-all"
          >
            <View className="h-9 w-9 rounded-xl bg-surface-soft items-center justify-center">
              <Sparkles size={18} color={iconColor('brandText')} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-muted">
                {t.nav.progress}
              </Text>
              <Text className="text-sm font-bold text-ink truncate">
                {t.progress.tabHistory}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};
