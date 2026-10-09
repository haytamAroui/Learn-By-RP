import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
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
import { useArchive } from '../features/archive/ArchiveProvider';
import { useI18n } from '../features/i18n';
import { createRecapPhraseExposures } from '../features/learning/supportSurfaces';
import { sceneResultCopyKey } from '../features/learning/sceneOutcome';
import { shareTextFile } from '../lib/share';
import { Button, EmptyState, SectionLabel } from './ui';
import { Sheet } from './Sheet';
import { iconColor } from '../design/iconColor';
import { ELEVATION } from '../design/tokens';

interface RecapScreenProps {
  session: SessionRecord;
  onClose: () => void;
  onRetryMission: (mission: MissionDefinition) => void;
  onNextMission?: (mission: MissionDefinition) => void;
}

export const RecapScreen: React.FC<RecapScreenProps> = ({
  session,
  onClose,
  onRetryMission,
  onNextMission,
}) => {
  const { t } = useI18n();
  const archive = useArchive();

  const skillName = (id?: string) => {
    if (!id) return undefined;
    switch (id) {
      case 'skill-request-substitution':
        return t.skills.requestSubstitution.name;
      case 'skill-propose-alternative':
        return t.skills.proposeAlternative.name;
      case 'skill-inquire-specifications':
        return t.skills.inquireSpecifications.name;
      case 'skill-wayfinding-transit':
        return t.skills.wayfindingTransit.name;
      case 'skill-communicative-repair':
        return t.skills.communicativeRepair.name;
      case 'skill-request-repetition':
        return t.skills.requestRepetition.name;
      case 'skill-ask-clarification':
        return t.skills.askClarification.name;
      case 'skill-check-understanding':
        return t.skills.checkUnderstanding.name;
      default:
        return COMMUNICATIVE_SKILLS_CATALOG.find(skill => skill.id === id)?.name;
    }
  };
  const [showEvidence, setShowEvidence] = useState(false);
  const [observations, setObservations] = useState<LearningObservation[]>(
    (session.observations ?? []).filter(o => !o.hidden && !o.userDisputed)
  );
  const [shareState, setShareState] = useState<'idle' | 'done' | 'failed'>('idle');

  React.useEffect(() => {
    setObservations((session.observations ?? []).filter(o => !o.hidden && !o.userDisputed));
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

  const sceneResultText = t.recap[sceneResultCopyKey(session.sceneState.outcome)];

  const demonstratedSkillName = skillName(independentSkill?.skillId);
  const practiceSkillName =
    skillName(supportedSkill?.skillId) ??
    currentMission?.primarySkillIds
      .map(id => skillName(id))
      .find(name => name && name !== demonstratedSkillName);

  const handleHide = async (obsId: string) => {
    try {
      await archive.hideObservation(obsId);
      setObservations(current => current.filter(observation => observation.observationId !== obsId));
    } catch (error) {
      console.warn('Could not hide observation', error);
    }
  };

  const handleDispute = async (obsId: string) => {
    try {
      await archive.disputeObservation(obsId);
      setObservations(current => current.filter(observation => observation.observationId !== obsId));
    } catch (error) {
      console.warn('Could not dispute observation', error);
    }
  };

  const handleShowEvidence = async () => {
    const exposures = createRecapPhraseExposures({
      existing: session.supportExposures ?? [],
      sessionId: session.id,
      observations,
      recordedAt: new Date().toISOString(),
    });

    try {
      await archiveRepository.appendSupportExposures(session.id, exposures);
      setShowEvidence(true);
    } catch (error) {
      console.warn('Could not persist recap support exposure', error);
    }
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
        showsVerticalScrollIndicator={true}
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
          {session.programContext?.finalSimulation ? (
            <View className="items-center gap-1 rounded-2xl bg-card-warm px-4 py-3">
              <Text className="text-xs font-semibold text-primary">
                {t.recap.finalSimulationLabel}
              </Text>
              <Text className="text-center text-xs leading-5 text-muted">
                {t.recap.noOfficialScore}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="gap-2 rounded-[24px] border border-border-subtle/50 bg-surface p-5" style={{ boxShadow: ELEVATION.card }}>
          <SectionLabel>{t.recap.sceneResult}</SectionLabel>
          <Text className="text-[17px] font-semibold leading-6 text-ink">
            {sceneResultText}
          </Text>
          {session.summary ? (
            <Text className="text-sm leading-5 text-body">{session.summary}</Text>
          ) : null}
        </View>

        <View className="gap-4">
          <SectionLabel>{t.recap.skillEvidenceTitle}</SectionLabel>
          {demonstratedSkillName ? (
            <View className="gap-2 rounded-[24px] bg-card-sage p-5">
              <Text className="text-xs font-semibold uppercase tracking-wider text-accent-sage">
                {t.recap.unassisted}
              </Text>
              <Text className="text-[18px] font-semibold leading-6 text-ink">
                {demonstratedSkillName}
              </Text>
              <Text className="text-sm leading-5 text-body">
                {t.recap.independentToday}
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

        {/*
          How this session was processed, and where records live.

          This is a notice, not an action, so it sits in the body of the receipt rather
          than behind the Evidence sheet. It was dropped during a redesign without a
          decision being recorded: the wording still existed in all four locales under
          `settings`, and only the call to it was removed, which is the shape a privacy
          notice disappearing quietly takes.

          Reused from `settings` rather than duplicated into `recap`. The sentence is
          approved copy in four locales; a second copy under a different key would be
          free to drift from the one a learner already consented to in Settings.

          Note for review: this says records are stored locally on the device. That is
          accurate for the IndexedDB and native archives. Confirm it remains accurate if
          hosted persistence is ever enabled for a learner, because a disclosure that is
          confidently wrong is worse than none.
        */}
        <View className="gap-2 rounded-2xl border border-border-subtle p-4">
          <SectionLabel>{t.settings.sectionPrivacy}</SectionLabel>
          <Text className="text-[13px] leading-5 text-muted">
            {t.settings.privacyDisclosure}
          </Text>
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
            onPress={() => void handleShowEvidence()}
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
                  ? t.settings.shareFailed
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
