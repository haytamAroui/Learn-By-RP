import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  Repeat2,
  X,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LearningObservation, MissionDefinition, SessionRecord } from '../types';
import {
  COMMUNICATIVE_SKILLS_CATALOG,
  MISSION_CATALOG,
} from '../data/missions';
import { archiveRepository } from '../features/archive/archiveRepository';
import { useI18n } from '../features/i18n';
import { shareTextFile } from '../lib/share';
import { Button, EmptyState, SectionLabel } from './ui';
import { Sheet } from './Sheet';
import { iconColor } from '../design/iconColor';

interface RecapScreenProps {
  session: SessionRecord;
  onClose: () => void;
  onRetryMission: (mission: MissionDefinition) => void;
  onNextMission?: (mission: MissionDefinition) => void;
}

const skillName = (id?: string) =>
  COMMUNICATIVE_SKILLS_CATALOG.find(skill => skill.id === id)?.name;

export const RecapScreen: React.FC<RecapScreenProps> = ({
  session,
  onClose,
  onRetryMission,
  onNextMission,
}) => {
  const { t } = useI18n();
  const [showEvidence, setShowEvidence] = useState(false);
  const [observations, setObservations] = useState<LearningObservation[]>(session.observations ?? []);
  const [shareState, setShareState] = useState<'idle' | 'done' | 'failed'>('idle');

  React.useEffect(() => {
    setObservations(session.observations ?? []);
    setShareState('idle');
    setShowEvidence(false);
  }, [session.id, session.observations]);

  const currentMission = MISSION_CATALOG.find(mission => mission.id === session.missionId);
  const nextMission = currentMission?.nextMissionId
    ? MISSION_CATALOG.find(mission => mission.id === currentMission.nextMissionId)
    : undefined;

  const independentSkill = useMemo(
    () => session.skillObservations?.find(observation => observation.retrieval === 'unassisted'),
    [session.skillObservations]
  );

  const supportedSkill = useMemo(
    () => session.skillObservations?.find(observation => observation.retrieval === 'assisted'),
    [session.skillObservations]
  );

  const demonstratedSkillName = skillName(independentSkill?.skillId);
  const practiceSkillName =
    skillName(supportedSkill?.skillId) ??
    currentMission?.primarySkillIds
      .map(id => skillName(id))
      .find(name => name && name !== demonstratedSkillName);

  const handleHide = (obsId: string) => {
    void archiveRepository.hideObservation(obsId);
    setObservations(current => current.filter(observation => observation.observationId !== obsId));
  };

  const handleDispute = (obsId: string) => {
    void archiveRepository.disputeObservation(obsId);
    setObservations(current => current.filter(observation => observation.observationId !== obsId));
  };

  const handleShareReceipt = async () => {
    const receipt = await archiveRepository.exportLearningReceiptText(session);
    const result = await shareTextFile(
      `learnbyrp-receipt-${session.id}.txt`,
      receipt,
      'text/plain'
    );
    setShareState(result.ok ? 'done' : 'failed');
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <View className="w-full self-center flex-row items-center justify-between px-4 py-2" style={{ maxWidth: 1200 }}>
        <Text className="text-sm font-semibold text-muted">{t.recap.title}</Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
          className="h-12 w-12 items-center justify-center rounded-full border border-transparent bg-surface-soft hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
        >
          <X size={21} color={iconColor('ink')} />
        </Pressable>
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
        <View className="items-center gap-3">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-card-sage">
            <CheckCircle2 size={38} color={iconColor('success')} />
          </View>
          <Text className="text-center text-[28px] font-semibold leading-[34px] tracking-tight text-ink">
            {t.recap.tag}
          </Text>
          <Text className="max-w-[560px] text-center text-[15px] leading-[22px] text-body">
            {session.summary || currentMission?.learnerGoal || t.recap.communicativeOutcome}
          </Text>
        </View>

        <View className="gap-4">
          {demonstratedSkillName ? (
            <View className="gap-2 rounded-[24px] bg-card-sage p-5">
              <Text className="text-xs font-semibold uppercase tracking-wider text-accent-sage">
                {t.recap.unassisted}
              </Text>
              <Text className="text-[18px] font-semibold leading-6 text-ink">
                {demonstratedSkillName}
              </Text>
              <Text className="text-sm leading-5 text-body">
                {t.progress.coldAttempt}
              </Text>
            </View>
          ) : null}

          {(session.actionableFeedback?.[0] || practiceSkillName) ? (
            <View className="gap-2 rounded-[24px] bg-surface-soft p-5">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t.progress.readyToPractise}
              </Text>
              {practiceSkillName ? (
                <Text className="text-[18px] font-semibold leading-6 text-ink">
                  {practiceSkillName}
                </Text>
              ) : null}
              {session.actionableFeedback?.[0] ? (
                <Text className="text-sm leading-5 text-body">
                  {session.actionableFeedback[0]}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View className="gap-2">
          {nextMission && onNextMission ? (
            <Button
              label={t.recap.continueNextMission}
              onPress={() => onNextMission(nextMission)}
              size="lg"
              icon={<ArrowRight size={18} color={iconColor('brandText')} />}
            />
          ) : (
            <Button label={t.common.close} onPress={onClose} size="lg" />
          )}

          {currentMission ? (
            <Button
              label={t.common.retryTurn}
              onPress={() => onRetryMission(currentMission)}
              variant="secondary"
              icon={<Repeat2 size={17} color={iconColor('muted')} />}
            />
          ) : null}

          <Button
            label={`${t.common.evidence} · ${observations.length}`}
            onPress={() => setShowEvidence(true)}
            variant="ghost"
            icon={<Eye size={17} color={iconColor('brand')} />}
          />
        </View>

        <View className="flex-row flex-wrap items-center justify-center gap-2">
          <Text className="text-xs text-muted">
            {session.passages.length} {t.recap.turnsCount}
          </Text>
          <Text className="text-xs text-muted">·</Text>
          <Text className="text-xs text-muted">
            {session.coldAttempt ? t.progress.coldAttempt : t.progress.assistedAttempt}
          </Text>
          <Text className="text-xs text-muted">·</Text>
          <Text className="text-xs capitalize text-muted">
            {t.modes[session.mode] || session.mode}
          </Text>
        </View>
      </ScrollView>

      <Sheet
        visible={showEvidence}
        onClose={() => setShowEvidence(false)}
        title={t.recap.validatedEvidence}
      >
        {observations.length === 0 ? (
          <EmptyState message={t.recap.noPhrasesValidated} />
        ) : (
          <View className="gap-3">
            {observations.map(observation => (
              <View key={observation.observationId} className="gap-3 rounded-2xl bg-surface-soft p-4">
                <View className="gap-1">
                  <Text className="text-[15px] font-semibold text-ink">
                    “{observation.candidateForm}”
                  </Text>
                  <Text className="text-sm text-muted">{observation.meaning}</Text>
                </View>

                <View className="rounded-2xl bg-surface p-3">
                  <Text className="text-xs text-muted">{t.common.yourProduction}</Text>
                  <Text className="mt-1 text-sm font-medium text-ink">
                    “{observation.quote}”
                  </Text>
                </View>

                <View className="flex-row items-center justify-between gap-2">
                  <Text
                    className={`text-xs font-semibold ${
                      observation.retrieval === 'unassisted'
                        ? 'text-accent-sage'
                        : 'text-primary'
                    }`}
                  >
                    {observation.retrieval === 'unassisted'
                      ? t.recap.unassisted
                      : t.recap.assisted}
                  </Text>
                  <View className="flex-row flex-wrap gap-1">
                    <Button
                      label={t.progress.hideEvidence}
                      onPress={() => handleHide(observation.observationId)}
                      variant="ghost"
                      size="sm"
                    />
                    <Button
                      label={t.progress.disputeEvidence}
                      onPress={() => handleDispute(observation.observationId)}
                      variant="ghost"
                      size="sm"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="gap-2 border-t border-border-subtle pt-3">
          <SectionLabel>{t.common.evidence}</SectionLabel>
          <Button
            label={
              shareState === 'done'
                ? t.recap.downloadSuccess
                : shareState === 'failed'
                  ? 'Share failed'
                  : t.recap.downloadReceipt
            }
            onPress={handleShareReceipt}
            variant="secondary"
            icon={<Download size={17} color={iconColor('muted')} />}
          />
        </View>
      </Sheet>
    </SafeAreaView>
  );
};
