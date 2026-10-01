import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ArrowRight, Clock, Repeat } from 'lucide-react-native';
import { MissionDefinition, PhraseItem, SessionRecord } from '../types';
import { useI18n } from '../features/i18n';
import { Button, Card, Pill } from './ui';
import { iconColor } from '../design/iconColor';

interface TalkScreenProps {
  currentLanguageName: string;
  currentMode: string;
  featuredMission: MissionDefinition;
  lastSession?: SessionRecord;
  duePhrases: PhraseItem[];
  onStartMission: (mission: MissionDefinition) => void;
  onExploreMissions: () => void;
  onPracticeDue: () => void;
  onOpenSettings?: () => void;
}

export const TalkScreen: React.FC<TalkScreenProps> = ({
  currentLanguageName,
  currentMode,
  featuredMission,
  lastSession,
  duePhrases,
  onStartMission,
  onExploreMissions,
  onPracticeDue,
  onOpenSettings,
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
      <View className="flex-row items-center justify-between gap-3 border-b border-border-subtle px-3.5 py-2.5">
        <Text className="font-display text-lg font-semibold tracking-tight text-ink">
          {t.nav.brandTitle}
        </Text>
        {onOpenSettings ? (
          <Button label="Settings" onPress={onOpenSettings} variant="ghost" size="sm" />
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 28, gap: 22 }}>
        <View className="gap-1.5">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <Text className="text-xs font-medium text-muted">
              {currentLanguageName} {t.talk.tagPractice}
            </Text>
            <Text className="text-muted">·</Text>
            <Text className="text-xs font-medium text-muted">
              {t.modes[currentMode as 'guided' | 'immersion' | 'focused'] || currentMode}
            </Text>
          </View>
          <Text className="font-display text-2xl font-medium leading-tight tracking-tight text-ink">
            {t.talk.heading}
          </Text>
          <Text className="text-xs leading-relaxed text-body">{t.talk.subheading}</Text>
        </View>

        <Card className="gap-4 p-5">
        <View className="gap-2.5">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <Text className="text-xs font-semibold text-ink">
              {featuredMission.neighborhood}
            </Text>
            <Text className="text-muted">·</Text>
            <Text className="text-xs text-muted">
              {featuredMission.estimatedMinutes} {t.common.minutes}
            </Text>
            <Text className="text-muted">·</Text>
            <Text className="text-xs text-muted">
              {t.common.level} {featuredMission.levelRange}
            </Text>
          </View>

          <Text className="font-display text-xl font-semibold leading-snug tracking-tight text-ink">
            {featuredMission.title}
          </Text>

          <Text className="text-sm leading-relaxed text-body">{featuredMission.setting}</Text>

          <View className="pt-1 flex-row flex-wrap items-baseline gap-1">
            <Text className="text-xs font-semibold text-ink">{t.common.goal} </Text>
            <Text className="text-xs text-body">{featuredMission.learnerGoal}</Text>
          </View>

          {featuredMission.transferReason ? (
            <View className="flex-row items-start gap-2 rounded-xl border border-primary/10 bg-card-warm p-3">
              <Repeat size={14} color={iconColor('brand')} style={{ marginTop: 1 }} />
              <Text className="flex-1 text-xs text-primary-dark dark:text-primary">
                <Text className="font-semibold">{t.common.connectedLoop} </Text>
                {featuredMission.transferReason}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="gap-3.5 border-t border-border-subtle pt-4">
          <Text className="text-xs text-muted">
            {t.common.speakingWith}{' '}
            <Text className="font-medium text-ink">{featuredMission.character.name}</Text> (
            {featuredMission.character.role})
          </Text>

          <Button
            label={t.talk.startConversation}
            onPress={() => onStartMission(featuredMission)}
            size="md"
            icon={<ArrowRight size={16} color="#ffffff" />}
          />
        </View>
      </Card>

      <View className="gap-4">
        <Card className="gap-3">
          <View className="gap-1">
            <Text className="text-xs font-medium text-muted">{t.talk.spacedRevisit}</Text>
            <Text className="font-display text-lg font-semibold text-ink">
              {t.talk.practiseDueTitle}
            </Text>
            <Text className="text-xs text-body">{dueSummary}</Text>
          </View>

          {duePhrases.length > 0 ? (
            <View className="gap-1.5">
              {duePhrases.slice(0, 2).map(phrase => (
                <View key={phrase.id} className="flex-row items-center gap-2">
                  <View className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <Text className="text-xs font-medium text-ink">"{phrase.form}"</Text>
                  <Text className="flex-1 text-xs text-muted" numberOfLines={1}>
                    — {phrase.meaning}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <Button
            label={t.talk.reviewButton.replace('{count}', String(duePhrases.length))}
            onPress={onPracticeDue}
            variant="secondary"
            disabled={duePhrases.length === 0}
            icon={<Clock size={14} color={iconColor('muted')} />}
          />
        </Card>

        <Card className="gap-3">
          <View className="gap-1">
            <Text className="text-xs font-medium text-muted">{t.talk.neighborhoodTitle}</Text>
            <Text className="font-display text-lg font-semibold text-ink">
              {t.talk.neighborhoodHeading}
            </Text>
            <Text className="text-xs leading-relaxed text-body">{t.talk.neighborhoodDesc}</Text>
            <Text className="text-xs text-muted">{t.talk.neighborhoodConsequence}</Text>
          </View>

          <Button
            label={t.talk.browseAllButton}
            onPress={onExploreMissions}
            variant="secondary"
            icon={<ArrowRight size={14} color={iconColor('muted')} />}
          />
        </Card>
      </View>

        {lastSession ? (
          <Pill
            label={`${lastSession.passages.length} turns · ${lastSession.taskOutcome.replace(/_/g, ' ')}`}
            tone="sage"
          />
        ) : null}
      </ScrollView>
    </View>
  );
};
