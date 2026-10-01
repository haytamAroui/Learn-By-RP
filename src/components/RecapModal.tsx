import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { ArrowRight, Download, Repeat } from 'lucide-react-native';
import { SessionRecord, LearningObservation, MissionDefinition } from '../types';
import { MISSION_CATALOG } from '../data/missions';
import { archiveRepository } from '../features/archive/archiveRepository';
import { useI18n } from '../features/i18n';
import { shareTextFile } from '../lib/share';
import { Button, EmptyState, SectionLabel } from './ui';
import { Sheet } from './Sheet';
import { iconColor } from '../design/iconColor';

interface RecapModalProps {
  session: SessionRecord | null;
  onClose: () => void;
  onNextMission?: (mission: MissionDefinition) => void;
  onUpdateObservation?: (obsId: string, updates: Partial<LearningObservation>) => void;
}

export const RecapModal: React.FC<RecapModalProps> = ({
  session,
  onClose,
  onNextMission,
  onUpdateObservation,
}) => {
  const { t } = useI18n();
  const [observations, setObservations] = useState<LearningObservation[]>(
    session?.observations ?? []
  );
  const [shareState, setShareState] = useState<'idle' | 'done' | 'failed'>('idle');

  React.useEffect(() => {
    setObservations(session?.observations ?? []);
    setShareState('idle');
  }, [session?.id]);

  if (!session) return null;

  const currentMission = MISSION_CATALOG.find(m => m.id === session.missionId);
  const nextMission = currentMission?.nextMissionId
    ? MISSION_CATALOG.find(m => m.id === currentMission.nextMissionId)
    : null;

  const handleDispute = (obsId: string) => {
    void archiveRepository.disputeObservation(obsId);
    setObservations(prev => prev.filter(o => o.observationId !== obsId));
  };

  const handleHide = (obsId: string) => {
    void archiveRepository.hideObservation(obsId);
    setObservations(prev => prev.filter(o => o.observationId !== obsId));
  };

  const handleShareTextReceipt = async () => {
    const textReceipt = await archiveRepository.exportLearningReceiptText(session);
    const result = await shareTextFile(
      `mission-receipt-${session.id}.txt`,
      textReceipt,
      'text/plain'
    );
    setShareState(result.ok ? 'done' : 'failed');
  };

  return (
    <Sheet
      visible
      onClose={onClose}
      title={t.recap.title}
      footer={
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Button
              label={
                shareState === 'done'
                  ? t.recap.downloadSuccess
                  : shareState === 'failed'
                    ? 'Share failed'
                    : t.recap.downloadReceipt
              }
              onPress={handleShareTextReceipt}
              variant="secondary"
              size="sm"
              icon={<Download size={14} color={iconColor('muted')} />}
            />
          </View>
          <View className="flex-1">
            <Button label={t.common.close} onPress={onClose} size="sm" />
          </View>
        </View>
      }
    >
      <Text className="-mt-2 text-xs font-semibold uppercase tracking-wider text-primary">
        {t.recap.tag}
      </Text>

      <View className="gap-2 rounded-2xl border border-border-subtle bg-surface-sunken p-5">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t.recap.communicativeOutcome}
          </Text>
          <View className="rounded-lg border border-border-subtle bg-surface px-2.5 py-0.5">
            <Text className="text-xs font-semibold capitalize text-ink">
              {session.taskOutcome.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <Text className="text-sm font-medium text-ink">
          {session.summary || 'You engaged in natural conversation to achieve your goal.'}
        </Text>

        <View className="flex-row flex-wrap items-center gap-2 pt-1 text-xs text-muted">
          <Text>
            {session.passages.length} {t.recap.turnsCount}
          </Text>
          <Text>·</Text>
          <Text>{session.coldAttempt ? t.progress.coldAttempt : t.progress.assistedAttempt}</Text>
          <Text>·</Text>
          <Text className="capitalize">{t.modes[session.mode] || session.mode}</Text>
        </View>
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <SectionLabel>
            {t.recap.validatedEvidence} ({observations.length})
          </SectionLabel>
          <Text className="text-xs text-muted">{t.common.evidence}</Text>
        </View>

        {observations.length === 0 ? (
          <EmptyState message={t.recap.noPhrasesValidated} className="py-6" />
        ) : (
          observations.map(obs => (
            <View
              key={obs.observationId}
              className="gap-2 rounded-2xl border border-border-subtle bg-surface p-4"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-ink">
                    "{obs.candidateForm}"
                  </Text>
                  <Text className="text-xs text-muted">{obs.meaning}</Text>
                </View>

                <View
                  className={`rounded-lg border px-2 py-0.5 ${
                    obs.retrieval === 'unassisted'
                      ? 'border-accent-sage/20 bg-card-sage'
                      : 'border-primary/20 bg-card-warm'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold uppercase ${
                      obs.retrieval === 'unassisted' ? 'text-accent-sage' : 'text-primary'
                    }`}
                  >
                    {obs.retrieval === 'unassisted' ? t.recap.unassisted : t.recap.assisted} (
                    {obs.modality})
                  </Text>
                </View>
              </View>

              <View className="rounded-xl border border-border-subtle bg-surface-sunken p-2.5">
                <Text className="text-xs text-ink">
                  <Text className="text-muted">{t.common.yourProduction} </Text>
                  <Text className="font-semibold">"{obs.quote}"</Text>
                </Text>
              </View>

              <View className="flex-row items-center justify-between gap-2 pt-1">
                <Text className="text-xs text-muted">
                  {obs.rehearsal ? t.recap.rehearsal : t.progress.steadyTitle}
                </Text>

                <View className="flex-row gap-2">
                  <Button
                    label={t.progress.hideEvidence}
                    onPress={() => handleHide(obs.observationId)}
                    variant="ghost"
                    size="sm"
                  />
                  <Button
                    label={t.progress.disputeEvidence}
                    onPress={() => handleDispute(obs.observationId)}
                    variant="ghost"
                    size="sm"
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {session.actionableFeedback && session.actionableFeedback.length > 0 ? (
        <View className="gap-2 rounded-2xl border border-border-subtle bg-surface p-4">
          <SectionLabel>{t.settings.sectionPrivacy}</SectionLabel>
          {session.actionableFeedback.map((tip, idx) => (
            <View key={idx} className="flex-row items-start gap-2">
              <Text className="font-bold text-primary">·</Text>
              <Text className="flex-1 text-xs leading-relaxed text-body">{tip}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {nextMission && onNextMission ? (
        <View className="gap-2 rounded-2xl border border-primary/20 bg-card-warm p-4">
          <View className="flex-row items-center gap-2">
            <Repeat size={16} color={iconColor('brand')} />
            <Text className="text-xs font-semibold text-primary">{t.common.connectedLoop}</Text>
          </View>
          <Text className="text-xs leading-relaxed text-ink">
            <Text className="font-semibold">{nextMission.title}: </Text>
            {currentMission?.transferReason || nextMission.setting}
          </Text>
          <Button
            label={`${t.recap.continueNextMission} (${nextMission.character.name})`}
            onPress={() => onNextMission(nextMission)}
            size="sm"
            className="mt-1 self-start"
            icon={<ArrowRight size={14} color="#ffffff" />}
          />
        </View>
      ) : null}
    </Sheet>
  );
};
