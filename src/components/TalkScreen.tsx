import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
import {
  BookOpen,
  ChevronRight,
  Compass,
  Headphones,
  Mic,
  Play,
  Sparkles,
} from 'lucide-react-native';
import { MissionDefinition, PhraseItem } from '../types';
import { useI18n } from '../features/i18n';
import { iconColor } from '../design/iconColor';
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

/**
 * Faithfully implements the Lingo Original 1 (Home) screen:
 * - Friendly greeting with streak chip (🔥 12) + profile portrait
 * - City skyline hero with floating goal ring card
 * - Current Lesson card with café coffee/croissant artwork, A1 pill & continue CTA
 * - The 4 iconic practice tiles (Vocabulary, Listening, Speaking, Skills)
 * - Explore Topics card
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
          maxWidth: 600,
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 40,
          gap: 18,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Lingo Original 1 Greeting Header */}
        <View className="flex-row items-center justify-between gap-3 pt-1">
          <View className="flex-1">
            <Text className="font-display text-[26px] font-bold tracking-tight text-ink">
              Hi, Haytam 👋
            </Text>
            <Text className="text-xs text-muted">
              {t.talk.subheading || 'Glad you are learning today!'}
            </Text>
          </View>

          <View className="flex-row items-center gap-2.5">
            {/* Streak Chip */}
            <View className="min-h-12 px-3 rounded-full bg-surface border border-border-interactive/70 flex-row items-center gap-1.5 shadow-sm">
              <Text className="text-xs font-extrabold text-ink">🔥 12</Text>
            </View>

            {/* Profile Avatar Portrait */}
            <Pressable
              onPress={onViewProgress}
              accessibilityRole="button"
              accessibilityLabel="View learner profile"
              className="h-12 w-12 rounded-full overflow-hidden border-2 border-surface shadow-sm bg-[#FFE5B9] active:scale-95 transition-all"
            >
              <ReferenceArtwork kind="girl" />
            </Pressable>
          </View>
        </View>

        {/* Lingo City Hero Banner with Floating Goal Card */}
        <View className="relative h-[172px] w-full overflow-hidden rounded-[28px] border border-border-interactive/40 shadow-sm bg-[#E2F1E7]">
          <ReferenceArtwork kind="city" />

          {/* Floating Glass Goal Card */}
          <View className="absolute left-3.5 bottom-3 w-[240px] rounded-[20px] bg-surface/90 border border-surface p-3 shadow-lg backdrop-blur-md">
            <Text className="font-display text-sm font-bold text-ink">
              Today's Goal
            </Text>
            <View className="flex-row items-center gap-2.5 mt-1">
              <View className="h-10 w-10 rounded-full border-4 border-language-soft items-center justify-center border-t-language">
                <Text className="text-xs font-bold text-language">
                  {dueCount > 0 ? `${dueCount}` : '3m'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-extrabold text-ink">
                  {dueCount > 0 ? `${dueCount} phrases` : '3 / 20'}
                </Text>
                <Text className="text-xs text-muted">
                  {dueCount > 0 ? 'ready for review' : 'minutes learned'}
                </Text>
              </View>
              <Pressable
                onPress={dueCount > 0 ? onPracticeDue : onViewProgress}
                accessibilityRole="button"
                accessibilityLabel="View today's learning goal"
                className="min-h-12 min-w-12 items-center justify-center rounded-full hover:bg-surface-hover active:scale-90"
              >
                <ChevronRight size={18} color={iconColor('muted')} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Lingo Current Lesson Card (Café artwork + croissant + lime CTA) */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-display text-lg font-bold text-ink">
              Current Lesson
            </Text>
            <Pressable
              onPress={() => onStartMission(featuredMission)}
              accessibilityRole="button"
              accessibilityLabel="Open current lesson"
              className="min-h-12 min-w-12 items-center justify-center"
            >
              <ChevronRight size={18} color={iconColor('muted')} />
            </Pressable>
          </View>

          <View className="relative h-[175px] w-full overflow-hidden rounded-[24px] bg-[#503C30] shadow-md border border-border-interactive/30">
            <ReferenceArtwork kind="coffee" />
            <View className="absolute inset-0 bg-black/45" />

            {/* Level Pill */}
            <View className="absolute right-4 top-3.5 px-2.5 py-1 rounded-xl bg-lime border border-lime">
              <Text className="text-xs font-extrabold text-[#17310F]">
                {featuredMission.levelRange ?? 'A1'}
              </Text>
            </View>

            {/* Lesson Content Overlay */}
            <View className="absolute left-4 right-4 bottom-3.5 gap-1">
              <Text className="text-xs font-medium text-white/80">
                {currentLanguageName} · {featuredMission.neighborhood}
              </Text>
              <Text className="font-display text-xl font-bold text-white leading-tight truncate">
                {featuredMission.title}
              </Text>

              <View className="flex-row items-center justify-between pt-1.5">
                <Pressable
                  onPress={() => onStartMission(featuredMission)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.talk.startConversation} with ${featuredMission.character.name}`}
                  className="min-h-12 flex-row items-center gap-2 rounded-full bg-lime px-4 py-2 hover:opacity-95 active:scale-[0.98] transition-all"
                >
                  <Play size={16} color="#17310F" fill="#17310F" />
                  <Text className="text-xs font-extrabold text-[#17310F]">
                    {t.talk.startConversation}
                  </Text>
                </Pressable>

                <View className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Text className="text-xs font-bold text-white">
                    {featuredMission.estimatedMinutes} min
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Lingo 4 Iconic Practice Cards Grid */}
        <View className="gap-2.5">
          <Text className="font-display text-lg font-bold text-ink">
            Quick Practice
          </Text>
          <View className="flex-row gap-2.5">
            {/* Vocabulary Tile */}
            <Pressable
              onPress={onPracticeDue}
              accessibilityRole="button"
              accessibilityLabel="Vocabulary: new words"
              className="min-h-[104px] flex-1 items-center justify-center gap-1 rounded-[22px] bg-[#E8F2EE] p-2 border border-[#DEF3EC] active:scale-95 transition-all"
            >
              <View className="h-10 w-10 rounded-2xl bg-white/90 items-center justify-center shadow-xs">
                <BookOpen size={20} color="#0E8F7E" />
              </View>
              <Text className="text-xs font-bold text-[#1F3437]">
                Vocabulary
              </Text>
              <Text className="text-xs text-[#55646A]">
                {dueCount > 0 ? `${dueCount} due` : 'New words'}
              </Text>
            </Pressable>

            {/* Listening Tile */}
            <Pressable
              onPress={() => onStartMission(featuredMission)}
              accessibilityRole="button"
              accessibilityLabel="Listening: dialogs"
              className="min-h-[104px] flex-1 items-center justify-center gap-1 rounded-[22px] bg-[#E8F4F1] p-2 border border-[#C9E7F2] active:scale-95 transition-all"
            >
              <View className="h-10 w-10 rounded-2xl bg-white/90 items-center justify-center shadow-xs">
                <Headphones size={20} color="#0E7FA3" />
              </View>
              <Text className="text-xs font-bold text-[#1F3437]">
                Listening
              </Text>
              <Text className="text-xs text-[#55646A]">Dialogs</Text>
            </Pressable>

            {/* Speaking Tile */}
            <Pressable
              onPress={onExploreMissions}
              accessibilityRole="button"
              accessibilityLabel="Speaking: Flemish roleplay scenarios"
              className="min-h-[104px] flex-1 items-center justify-center gap-1 rounded-[22px] bg-[#FFF2EA] p-2 border border-[#FFD8CB] active:scale-95 transition-all"
            >
              <View className="h-10 w-10 rounded-2xl bg-white/90 items-center justify-center shadow-xs">
                <Mic size={20} color="#E4533C" />
              </View>
              <Text className="text-xs font-bold text-[#1F3437]">Speaking</Text>
              <Text className="text-xs text-[#55646A]">Flemish</Text>
            </Pressable>

            {/* Skills / Grammar Tile */}
            <Pressable
              onPress={onViewProgress}
              accessibilityRole="button"
              accessibilityLabel="Skills: short exercises"
              className="min-h-[104px] flex-1 items-center justify-center gap-1 rounded-[22px] bg-[#F5EEFA] p-2 border border-[#E0D8FF] active:scale-95 transition-all"
            >
              <View className="h-10 w-10 rounded-2xl bg-white/90 items-center justify-center shadow-xs">
                <Sparkles size={20} color="#7A63E0" />
              </View>
              <Text className="text-xs font-bold text-[#1F3437]">Skills</Text>
              <Text className="text-xs text-[#55646A]">Grammar</Text>
            </Pressable>
          </View>
        </View>

        {/* Lingo Explore Topics Card */}
        <Pressable
          onPress={onExploreMissions}
          accessibilityRole="button"
          accessibilityLabel={t.talk.browseAllButton}
          className="min-h-[72px] w-full flex-row items-center gap-3.5 rounded-[22px] bg-gradient-to-r from-[#FFF1DC] to-[#FFE4C2] px-4 py-3 border border-[#F2DEB8] active:scale-[0.99] transition-all"
        >
          <View className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#18C2B2] to-[#0B8F86] items-center justify-center shadow-sm">
            <Compass size={22} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="font-display text-sm font-bold text-ink">
              {t.talk.exploreTopics}
            </Text>
            <Text className="text-xs text-[#687579]">
              Travel, work, daily life, and Flemish culture
            </Text>
          </View>
          <ChevronRight size={18} color="#687579" />
        </Pressable>
      </ScrollView>
    </View>
  );
};
