import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Compass,
  MessagesSquare,
} from 'lucide-react-native';
import { MissionDefinition, PhraseItem } from '../types';
import { useI18n } from '../features/i18n';
import { Button } from './ui';
import { iconColor } from '../design/iconColor';

interface TalkScreenProps {
  currentLanguageName: string;
  featuredMission: MissionDefinition;
  duePhrases: PhraseItem[];
  onStartMission: (mission: MissionDefinition) => void;
  onExploreMissions: () => void;
  onPracticeDue: () => void;
}

/**
 * The mobile-first home screen.
 *
 * The mission is the product, so it owns the visual hierarchy. Review and
 * catalogue entry points stay available, but they are rows rather than equal
 * dashboard cards.
 */
export const TalkScreen: React.FC<TalkScreenProps> = ({
  currentLanguageName,
  featuredMission,
  duePhrases,
  onStartMission,
  onExploreMissions,
  onPracticeDue,
}) => {
  const { t } = useI18n();
  const mins = Math.max(2, duePhrases.length);

  const dueSummary =
    duePhrases.length > 0
      ? duePhrases.length === 1
        ? `1 ${t.talk.phrasesReadySingle}`
        : `${duePhrases.length} ${t.talk.phrasesReadyPlural.replace('{mins}', String(mins))}`
      : t.talk.allCaughtUp;

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 32,
          gap: 28,
        }}
      >
        <View className="gap-2">
          <Text className="text-sm font-semibold text-primary">
            {currentLanguageName} · {t.talk.tagPractice}
          </Text>
          <Text className="max-w-[560px] text-[28px] font-semibold leading-[34px] tracking-tight text-ink">
            {t.talk.heading}
          </Text>
          <Text className="max-w-[560px] text-[15px] leading-[22px] text-body">
            {t.talk.subheading}
          </Text>
        </View>

        <View className="overflow-hidden rounded-[28px] bg-card-warm p-5">
          <View className="mb-5 flex-row items-center justify-between">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface/70">
              <MessagesSquare size={23} color={iconColor('brand')} strokeWidth={2} />
            </View>
            <Text className="text-sm font-semibold text-primary">
              {featuredMission.levelRange} · {featuredMission.estimatedMinutes} {t.common.minutes}
            </Text>
          </View>

          <Text className="text-sm font-semibold text-muted">
            {featuredMission.neighborhood}
          </Text>
          <Text className="mt-2 text-[26px] font-semibold leading-[32px] tracking-tight text-ink">
            {featuredMission.title}
          </Text>
          <Text className="mt-2 text-[15px] leading-[22px] text-body" numberOfLines={3}>
            {featuredMission.setting}
          </Text>

          <View className="mt-5 border-t border-primary/10 pt-4">
            <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-muted">
              {t.common.goal}
            </Text>
            <Text className="mt-1.5 text-[15px] leading-[22px] text-ink">
              {featuredMission.learnerGoal}
            </Text>
          </View>

          <Button
            label={t.talk.startConversation}
            onPress={() => onStartMission(featuredMission)}
            size="lg"
            className="mt-5 min-h-14 w-full"
            icon={<ArrowRight size={18} color={iconColor('brandText')} strokeWidth={2.2} />}
          />
        </View>

        <View>
          <Pressable
            onPress={onPracticeDue}
            disabled={duePhrases.length === 0}
            accessibilityRole="button"
            accessibilityLabel={t.talk.practiseDueTitle}
            accessibilityState={{ disabled: duePhrases.length === 0 }}
            className={`min-h-[72px] flex-row items-center gap-3 rounded-2xl border border-transparent py-3 hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus ${
              duePhrases.length === 0 ? 'opacity-60' : ''
            }`}
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-surface-soft">
              <Clock3 size={20} color={iconColor('muted')} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-ink">
                {t.talk.practiseDueTitle}
              </Text>
              <Text className="mt-0.5 text-[13px] leading-[18px] text-muted">
                {dueSummary}
              </Text>
            </View>
            {duePhrases.length > 0 ? (
              <ChevronRight size={20} color={iconColor('muted')} />
            ) : null}
          </Pressable>

          <View className="h-px bg-border-subtle" />

          <Pressable
            onPress={onExploreMissions}
            accessibilityRole="button"
            accessibilityLabel={t.talk.browseAllButton}
            className="min-h-[72px] flex-row items-center gap-3 rounded-2xl border border-transparent py-3 hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-surface-soft">
              <Compass size={20} color={iconColor('muted')} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-ink">
                {t.talk.browseAllButton}
              </Text>
              <Text className="mt-0.5 text-[13px] leading-[18px] text-muted" numberOfLines={1}>
                {t.talk.neighborhoodDesc}
              </Text>
            </View>
            <ChevronRight size={20} color={iconColor('muted')} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};
