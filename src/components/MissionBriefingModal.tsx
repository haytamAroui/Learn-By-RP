import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Eye, EyeOff, Mic, Play } from 'lucide-react-native';
import { MissionDefinition, Mode } from '../types';
import { useI18n } from '../features/i18n';
import { Button, SectionLabel } from './ui';
import { Sheet } from './Sheet';
import { iconColor } from '../design/iconColor';

interface MissionBriefingModalProps {
  mission: MissionDefinition | null;
  initialMode: Mode;
  onClose: () => void;
  onStartSession: (mission: MissionDefinition, mode: Mode, isColdAttempt: boolean) => void;
}

const MODES: Mode[] = ['guided', 'immersion', 'focused'];

export const MissionBriefingModal: React.FC<MissionBriefingModalProps> = ({
  mission,
  initialMode,
  onClose,
  onStartSession,
}) => {
  const { t } = useI18n();
  const [selectedMode, setSelectedMode] = useState<Mode>(initialMode);
  const [coldAttempt, setColdAttempt] = useState<boolean>(true);

  const modeDescriptions: Record<Mode, { title: string; desc: string }> = {
    guided: { title: t.modes.guided, desc: t.modes.guidedDesc },
    immersion: { title: t.modes.immersion, desc: t.modes.immersionDesc },
    focused: { title: t.modes.focused, desc: t.modes.focusedDesc },
  };

  if (!mission) return null;

  return (
    <Sheet
      visible
      onClose={onClose}
      title={`${mission.neighborhood} · ${mission.estimatedMinutes} ${t.common.minutes}`}
      footer={
        <View className="gap-2">
          <Text className="text-center text-xs text-muted">
            {t.common.speakingWith}{' '}
            <Text className="font-medium text-ink">{mission.character.name}</Text>
          </Text>
          <Button
            label={t.briefing.startMissionButton}
            onPress={() => onStartSession(mission, selectedMode, coldAttempt)}
            size="lg"
            icon={<Play size={16} color={iconColor('brandText')} />}
          />
        </View>
      }
    >
      <View className="gap-1">
        <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
          {t.briefing.tag}
        </Text>
        <Text className="font-display text-2xl font-bold text-ink">{mission.title}</Text>
        <Text className="text-sm leading-relaxed text-body">{mission.setting}</Text>
      </View>

      <View className="gap-3 rounded-2xl border border-border-subtle bg-surface-sunken p-4">
        <Text className="text-xs text-body">
          <Text className="font-semibold text-ink">{t.briefing.withWhom} </Text>
          {mission.character.name} ({mission.character.role})
        </Text>

        <View className="gap-1">
          <Text className="text-xs text-ink">
            <Text className="font-semibold">{t.briefing.primaryGoal} </Text>
            {mission.learnerGoal}
          </Text>
          {mission.stretchGoal ? (
            <Text className="text-xs text-muted">
              <Text className="font-semibold">{t.briefing.stretchChallenge} </Text>
              {mission.stretchGoal}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="gap-2">
        <SectionLabel>{t.briefing.selectMode}</SectionLabel>
        <View className="gap-2">
          {MODES.map(mode => {
            const isActive = selectedMode === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => setSelectedMode(mode)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                className={`gap-1 rounded-xl border p-3 ${
                  isActive ? 'border-primary bg-card-warm' : 'border-border-subtle bg-surface'
                }`}
              >
                <Text className="text-xs font-semibold text-ink">
                  {modeDescriptions[mode].title}
                </Text>
                <Text className="text-xs text-body">{modeDescriptions[mode].desc}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-3 rounded-2xl border border-border-subtle bg-surface p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 flex-row items-start gap-2">
            {coldAttempt ? (
              <EyeOff size={16} color={iconColor('success')} style={{ marginTop: 1 }} />
            ) : (
              <Eye size={16} color={iconColor('brand')} style={{ marginTop: 1 }} />
            )}
            <View className="flex-1 gap-0.5">
              <Text className="text-xs font-semibold text-ink">
                {coldAttempt ? t.briefing.coldAttemptTitle : t.briefing.previewPhrasesTitle}
              </Text>
              <Text className="text-xs text-muted">
                {coldAttempt ? t.briefing.coldAttemptDesc : t.briefing.previewPhrasesDesc}
              </Text>
            </View>
          </View>

          <Button
            label={coldAttempt ? t.common.showTranslation : t.common.hideTranslation}
            onPress={() => setColdAttempt(prev => !prev)}
            size="sm"
            variant="secondary"
            className={
              coldAttempt
                ? 'border-accent-sage/20 bg-card-sage'
                : 'border-primary/20 bg-card-warm'
            }
            textClassName={coldAttempt ? 'text-accent-sage' : 'text-primary'}
          />
        </View>

        {!coldAttempt ? (
          <View className="gap-2 border-t border-border-subtle pt-3">
            <Text className="text-xs font-medium text-muted">
              {t.briefing.usefulPhrasesTitle}
            </Text>
            {mission.usefulPhrases.slice(0, 3).map(phrase => (
              <View
                key={phrase.id}
                className="flex-row items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-sunken p-2.5"
              >
                <Text className="flex-1 text-xs font-semibold text-ink">
                  "{phrase.form}"
                </Text>
                <Text className="text-xs text-muted" numberOfLines={2}>
                  {phrase.meaning}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View className="flex-row items-start gap-2">
        <Mic size={14} color={iconColor('muted')} style={{ marginTop: 1 }} />
        <Text className="flex-1 text-xs text-muted">{t.settings.privacyDisclosure}</Text>
      </View>
    </Sheet>
  );
};
