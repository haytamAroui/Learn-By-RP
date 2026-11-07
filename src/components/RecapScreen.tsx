import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  Download,
  Eye,
  Repeat2,
  Sparkles,
  Trophy,
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

  const learnerTurnsCount = session.passages.filter(p => p.speaker === 'user').length;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      {/* Top Header */}
      <View className="w-full self-center flex-row items-center justify-between px-4 py-2" style={{ maxWidth: 720 }}>
        <View className="flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full bg-accent-sage" />
          <Text className="text-14 font-bold text-ink">Scene finished</Text>
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
          className="h-12 w-12 items-center justify-center rounded-full border border-transparent bg-surface-soft hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
        >
          <X size={20} color={iconColor('ink')} />
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
          paddingTop: 16,
          paddingBottom: 36,
          gap: 20,
        }}
      >
        {/* Celebration Hero Banner matching Lingo Atelier */}
        <View className="items-center gap-3 py-2">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-card-sage shadow-sm">
            <Trophy size={36} color={iconColor('success')} />
          </View>

          <View className="items-center gap-1">
            <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">
              SCENE COMPLETE
            </Text>
            <Text className="text-center font-display text-28 font-bold leading-tight tracking-tight text-ink">
              You handled the {currentMission?.neighborhood ?? 'scene'}!
            </Text>
            <Text className="text-center text-14 text-muted max-w-[500px]">
              Now reflect on what felt easy, what needed help, and choose your next step.
            </Text>
          </View>

          {session.programContext?.finalSimulation ? (
            <View className="items-center gap-1 rounded-2xl bg-card-warm px-4 py-2.5">
              <Text className="text-xs font-semibold text-primary">
                {t.recap.finalSimulationLabel}
              </Text>
              <Text className="text-center text-xs leading-5 text-muted">
                {t.recap.noOfficialScore}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Session Snapshot Card */}
        <View className="gap-3 rounded-[24px] border border-border-subtle/50 bg-surface p-5 shadow-sm" style={{ boxShadow: ELEVATION.card }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-extrabold uppercase tracking-wider text-primary">
              SESSION SNAPSHOT
            </Text>
            <View className="rounded-full bg-language-soft px-2.5 py-0.5">
              <Text className="text-xs font-bold text-language">
                {session.coldAttempt ? 'Independent Attempt' : 'Guided Practice'}
              </Text>
            </View>
          </View>

          <Text className="text-16 font-semibold text-ink">
            {learnerTurnsCount} spoken / typed turns · {currentMission?.title ?? 'Conversation'}
          </Text>

          {/* Progress meter line */}
          <View className="h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
            <View className="h-full rounded-full bg-primary" style={{ width: '100%' }} />
          </View>

          <Text className="text-xs text-muted leading-4">
            Illustrative completion only. Not a formal proficiency score.
          </Text>
        </View>

        {/* Debrief & Reflection */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-display text-18 font-bold text-ink">
              Your debrief
            </Text>
            <Text className="text-xs font-semibold text-muted">
              Make the next try easier
            </Text>
          </View>

          {/* Situation Feedback Card */}
          <View className="rounded-[22px] bg-card-sage p-4 gap-2">
            <View className="flex-row items-center gap-2">
              <Check size={18} color={iconColor('success')} />
              <Text className="text-15 font-bold text-ink">
                You stayed in the situation
              </Text>
            </View>
            <Text className="text-13 leading-5 text-body">
              {sceneResultText} Practising a realistic communicative request connects Belgian Dutch directly to real-life purpose.
            </Text>
            {session.summary ? (
              <Text className="text-13 leading-5 text-muted pt-1 border-t border-border-subtle/20">
                {session.summary}
              </Text>
            ) : null}
          </View>

          {/* Next Steps / Transfer options */}
          <View className="gap-2.5">
            {currentMission ? (
              <Pressable
                onPress={() => onRetryMission(currentMission)}
                accessibilityRole="button"
                accessibilityLabel="Try that moment again"
                className="min-h-14 flex-row items-center gap-3.5 rounded-[20px] border border-border-subtle/60 bg-surface p-4 shadow-sm hover:bg-surface-hover active:scale-[0.99] transition-all"
              >
                <View className="h-10 w-10 rounded-2xl bg-[#FFE6DD] items-center justify-center">
                  <Repeat2 size={20} color="#E4533C" />
                </View>
                <View className="flex-1">
                  <Text className="text-15 font-bold text-ink">Try that moment again</Text>
                  <Text className="text-xs text-muted">Repeat without revealing the model answer</Text>
                </View>
                <ArrowRight size={18} color={iconColor('muted')} />
              </Pressable>
            ) : null}

            {nextMission && onNextMission ? (
              <Pressable
                onPress={() => onNextMission(nextMission)}
                accessibilityRole="button"
                accessibilityLabel="Transfer challenge"
                className="min-h-14 flex-row items-center gap-3.5 rounded-[20px] border border-border-subtle/60 bg-surface p-4 shadow-sm hover:bg-surface-hover active:scale-[0.99] transition-all"
              >
                <View className="h-10 w-10 rounded-2xl bg-[#DFF2EA] items-center justify-center">
                  <Compass size={20} color="#0E8F7E" />
                </View>
                <View className="flex-1">
                  <Text className="text-15 font-bold text-ink">Transfer challenge</Text>
                  <Text className="text-xs text-muted">{nextMission.title} · Next situation</Text>
                </View>
                <ArrowRight size={18} color={iconColor('muted')} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Skill Evidence Section */}
        <View className="gap-3">
          <SectionLabel>{t.recap.skillEvidenceTitle}</SectionLabel>
          {demonstratedSkillName ? (
            <View className="gap-1.5 rounded-[22px] bg-surface-soft p-4 border border-border-subtle/40">
              <Text className="text-xs font-extrabold uppercase tracking-wider text-accent-sage">
                {t.recap.unassisted}
              </Text>
              <Text className="text-16 font-bold text-ink">
                {demonstratedSkillName}
              </Text>
              <Text className="text-13 leading-5 text-body">
                {t.recap.independentToday}
              </Text>
            </View>
          ) : null}

          {(session.actionableFeedback?.[0] || practiceSkillName) ? (
            <View className="gap-1.5 rounded-[22px] bg-surface-soft p-4 border border-border-subtle/40">
              <Text className="text-xs font-extrabold uppercase tracking-wider text-muted">
                {t.progress.readyToPractise}
              </Text>
              {practiceSkillName ? (
                <Text className="text-16 font-bold text-ink">
                  {practiceSkillName}
                </Text>
              ) : null}
              {session.actionableFeedback?.[0] ? (
                <Text className="text-13 leading-5 text-body">
                  {session.actionableFeedback[0]}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Privacy Disclosure Notice */}
        <View className="gap-2 rounded-2xl border border-border-subtle p-4">
          <SectionLabel>{t.settings.sectionPrivacy}</SectionLabel>
          <Text className="text-13 leading-5 text-muted">
            {t.settings.privacyDisclosure}
          </Text>
        </View>

        {/* Primary Action Buttons */}
        <View className="gap-2.5 pt-1">
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

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                label={`${t.common.evidence} · ${observations.length}`}
                onPress={() => void handleShowEvidence()}
                variant="ghost"
                icon={<Eye size={17} color={iconColor('brand')} />}
              />
            </View>
            <View className="flex-1">
              <Button
                label={shareState === 'done' ? 'Receipt saved!' : 'Export receipt'}
                onPress={() => void handleShareReceipt()}
                variant="ghost"
                icon={<Download size={17} color={iconColor('muted')} />}
              />
            </View>
          </View>
        </View>

        {/* Session Metadata Footer */}
        <View className="flex-row flex-wrap items-center justify-center gap-2 pt-2">
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

      {/* Evidence Sheet */}
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
              <View key={observation.observationId} className="gap-2 rounded-2xl bg-surface-soft p-4">
                <View className="gap-1">
                  <Text className="text-15 font-semibold text-ink">
                    “{observation.candidateForm || observation.quote}”
                  </Text>
                  <Text className="text-xs text-muted">{observation.meaning}</Text>
                </View>
                <View className="flex-row items-center justify-between border-t border-border-subtle pt-2 mt-1">
                  <Text className="text-xs text-muted capitalize">
                    {observation.retrieval} · {observation.modality}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() => void handleDispute(observation.observationId)}
                      accessibilityRole="button"
                      accessibilityLabel="Dispute observation"
                      className="min-h-12 justify-center px-2"
                    >
                      <Text className="text-xs font-semibold text-warning">Dispute</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void handleHide(observation.observationId)}
                      accessibilityRole="button"
                      accessibilityLabel="Hide observation"
                      className="min-h-12 justify-center px-2"
                    >
                      <Text className="text-xs font-semibold text-muted">Hide</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </Sheet>
    </SafeAreaView>
  );
};
