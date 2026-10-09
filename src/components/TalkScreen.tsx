import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
import { ArrowRight, BarChart2, ChevronRight, Clock3, Compass, Mic } from 'lucide-react-native';
import { MissionDefinition, PhraseItem } from '../types';
import { useI18n } from '../features/i18n';
import { iconColor } from '../design/iconColor';
import { ELEVATION } from '../design/tokens';
import { ReferenceArtwork } from './ReferenceArtwork';

interface TalkScreenProps {
  currentLanguageName: string;
  featuredMission: MissionDefinition;
  duePhrases: PhraseItem[];
  onStartMission: (mission: MissionDefinition) => void;
  onExploreMissions: () => void;
  onPracticeDue: () => void;
  onViewProgress: () => void;
}

/** The Lingo reference home, mapped to the app's real learning actions. */
export const TalkScreen: React.FC<TalkScreenProps> = ({
  currentLanguageName, featuredMission, duePhrases,
  onStartMission, onExploreMissions, onPracticeDue, onViewProgress,
}) => {
  const { t } = useI18n();
  const dueSummary = duePhrases.length > 0
    ? t.talk.reviewButton.replace('{count}', String(duePhrases.length)) : t.talk.allCaughtUp;
  const actions = [
    { title: t.progress.tabPhrasesShort, description: dueSummary, Icon: Clock3,
      tint: 'bg-card-sage', color: 'success', onPress: onPracticeDue, disabled: duePhrases.length === 0 },
    { title: t.nav.missions, description: t.talk.browseAllButton, Icon: Compass,
      tint: 'bg-card-sky', color: 'info', onPress: onExploreMissions },
    { title: t.nav.talk, description: t.talk.startConversation, Icon: Mic,
      tint: 'bg-card-warm', color: 'brand', onPress: () => onStartMission(featuredMission) },
    { title: t.nav.progress, description: t.progress.tabHistory, Icon: BarChart2,
      tint: 'bg-lilac-soft', color: 'lilac', onPress: onViewProgress },
  ];
  return <View className="flex-1 bg-canvas">
    <ScrollView contentContainerStyle={{ width: '100%', maxWidth: 720, alignSelf: 'center',
      paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 16 }}>
      <View className="gap-2">
        <Text className="text-xs font-semibold text-language">{currentLanguageName} · {t.talk.tagPractice}</Text>
        <Text className="font-display text-[28px] font-bold leading-[34px] tracking-tight text-ink">{t.talk.heading}</Text>
        <Text className="text-sm leading-5 text-body">{t.talk.subheading}</Text>
      </View>
      <View className="relative h-[190px]">
        <ReferenceArtwork kind="city" />
        <Pressable onPress={onPracticeDue} disabled={duePhrases.length === 0} accessibilityRole="button"
          accessibilityLabel={dueSummary} accessibilityState={{ disabled: duePhrases.length === 0 }}
          className="absolute bottom-1 left-0 min-h-[94px] w-[238px] max-w-[90%] gap-2 rounded-[24px] border border-surface bg-surface/95 p-4 hover:bg-surface-hover focus:border-2 focus:border-focus"
          style={{ boxShadow: ELEVATION.card }}>
          <Text className="font-display text-base font-bold text-ink">{t.progress.readyToPractise}</Text>
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full border-4 border-language-soft"><Clock3 size={22} color={iconColor('language')} /></View>
            <View className="min-w-0 flex-1"><Text className="font-display text-[24px] font-bold text-ink">{duePhrases.length}</Text>
              <Text className="text-xs text-muted">{t.progress.tabPhrasesShort}</Text></View>
            <ChevronRight size={18} color={iconColor('language')} />
          </View>
        </Pressable>
      </View>
      <Text className="font-display text-[20px] font-bold text-ink">{t.talk.currentLesson}</Text>
      <View className="overflow-hidden rounded-[28px]" style={{ minHeight: 190, boxShadow: ELEVATION.card }}>
        <ReferenceArtwork kind="coffee" shaded />
        <View className="flex-1 justify-end gap-2 p-5" style={{ paddingTop: 24 }}>
          <Text className="text-xs font-semibold text-white">{featuredMission.neighborhood}</Text>
          <Text className="font-display text-[24px] font-bold leading-[30px] tracking-tight text-white">{featuredMission.title}</Text>
          <View className="flex-row items-center gap-2"><View className="rounded-xl bg-lime px-3 py-1"><Text className="text-xs font-bold text-lime-text">{featuredMission.levelRange}</Text></View>
            <Text className="text-sm font-medium text-white">{featuredMission.estimatedMinutes} {t.common.minutes}</Text></View>
          <Pressable onPress={() => onStartMission(featuredMission)} accessibilityRole="button" accessibilityLabel={t.talk.startConversation}
            className="mt-1 min-h-12 self-start flex-row items-center justify-center gap-2 rounded-full border-2 border-transparent bg-lime px-4 hover:opacity-90 active:opacity-80 focus:border-focus">
            <Text className="text-sm font-bold text-lime-text">{t.talk.startConversation}</Text><ArrowRight size={18} color={iconColor('limeText')} />
          </Pressable>
        </View>
      </View>
      <View className="gap-3">
        <Text className="font-display text-[20px] font-bold text-ink">{t.talk.quickPractice}</Text>
        <View className="flex-row gap-2">{actions.map(action => <Pressable key={action.title} onPress={action.onPress} disabled={action.disabled}
          accessibilityRole="button" accessibilityState={{ disabled: !!action.disabled }} accessibilityLabel={`${action.title}. ${action.description}`}
          className={`min-h-[112px] min-w-0 flex-1 items-center gap-2 rounded-[22px] border border-transparent px-1 py-3 hover:opacity-85 active:opacity-75 focus:border-2 focus:border-focus ${action.tint}`}
          style={{ boxShadow: ELEVATION.card }}>
          <View className="h-12 w-12 items-center justify-center rounded-[16px] bg-surface/70"><action.Icon size={24} color={iconColor(action.color)} /></View>
          <Text className="text-center text-xs font-bold leading-[17px] text-ink">{action.title}</Text>
        </Pressable>)}</View>
      </View>
      <Pressable onPress={onExploreMissions} accessibilityRole="button" accessibilityLabel={t.talk.browseAllButton}
        className="min-h-[72px] flex-row items-center gap-3 rounded-[24px] border border-transparent bg-warning-soft p-4 hover:opacity-90 focus:border-2 focus:border-focus" style={{ boxShadow: ELEVATION.card }}>
        <View className="h-12 w-12 items-center justify-center rounded-[16px] bg-language"><Compass size={23} color={iconColor('languageText')} /></View>
        <View className="min-w-0 flex-1 gap-1"><Text className="font-display text-base font-bold text-ink">{t.talk.exploreTopics}</Text>
          <Text className="text-xs text-body">{t.talk.browseAllButton}</Text></View><ChevronRight size={18} color={iconColor('language')} />
      </Pressable>
    </ScrollView>
  </View>;
};
