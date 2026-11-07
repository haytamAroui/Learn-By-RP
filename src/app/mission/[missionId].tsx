import React from 'react';
import { View } from 'react-native';
import { Text } from '../../components/AppText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { getTranslations, I18nProvider } from '../../features/i18n';
import { MissionBriefingScreen } from '../../components/MissionBriefingScreen';
import { Button } from '../../components/ui';
import { safeBack } from '../../lib/safeBack';
import { MISSION_CATALOG } from '../../data/missions';
import { MissionDefinition, Mode, SessionRecord, SupportExposure } from '../../types';
import { LEARNING_POLICY_VERSION } from '../../features/learning/policy';
import { getScene } from '../../content/scenes';
import { createInitialScene } from '../../features/roleplay/sceneReducer';
import { ALL_ROLEPLAY_PROGRAMS } from '../../data/programs';
import { buildProgramProjection, isProgramCoreComplete } from '../../features/program/projection';
import { isProgramActivatable } from '../../features/program/releaseGates';
import { ACTIVE_LEARNING_LANGUAGE } from '../../features/i18n/languagePolicy';

export default function MissionBriefingRoute() {
  const router = useRouter();
  const archive = useArchive();
  const t = getTranslations(archive.preferences.explanationLanguage);
  const params = useLocalSearchParams<{
    missionId: string;
    programId?: string;
    finalSimulation?: string;
  }>();
  const mission = MISSION_CATALOG.find(item => item.id === params.missionId);
  const program = params.programId
    ? ALL_ROLEPLAY_PROGRAMS.find(item => item.id === params.programId)
    : undefined;
  const requestedFinalSimulation = params.finalSimulation === '1';

  const programMissionRef =
    program && mission
      ? program.missionPlan.find(
          ref => ref.missionId === mission.id && ref.missionVersion === mission.version
        )
      : undefined;
  const finalMissionRef = program?.finalSimulation?.mission;
  const finalSimulationAllowed = Boolean(
    requestedFinalSimulation &&
      program &&
      mission &&
      isProgramActivatable(program) &&
      finalMissionRef?.missionId === mission.id &&
      finalMissionRef.missionVersion === mission.version &&
      isProgramCoreComplete(program, buildProgramProjection(program, archive.sessions))
  );
  const programContextAllowed = Boolean(
    program &&
      isProgramActivatable(program) &&
      (programMissionRef || finalSimulationAllowed)
  );

  if (
    !mission ||
    mission.language !== ACTIVE_LEARNING_LANGUAGE ||
    (params.programId && !programContextAllowed) ||
    (requestedFinalSimulation && !finalSimulationAllowed)
  ) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-canvas p-6">
        <Text className="text-center text-sm text-muted">
          {t.settings.missionUnavailable}
        </Text>
        <Button
          label={t.settings.goBack}
          onPress={() => safeBack(router)}
          variant="secondary"
        />
      </View>
    );
  }

  const handleStartSession = async (
    selectedMission: MissionDefinition,
    mode: Mode,
    coldAttempt: boolean,
    previewedPhraseIds: string[]
  ) => {
    const sessionId = `session-${Date.now()}`;
    const now = new Date().toISOString();

    const authoredScene = selectedMission.sceneId
      ? getScene(selectedMission.sceneId)
      : undefined;
    const initialScene = authoredScene
      ? createInitialScene(authoredScene, sessionId, 'attempt-1')
      : undefined;

    const supportExposures: SupportExposure[] = previewedPhraseIds.map((phraseId, index) => ({
      id: `exp-briefing-${sessionId}-${index}`,
      sessionId,
      attemptId: 'attempt-1',
      source: 'briefing',
      kind: 'briefing_exposure',
      targetPhraseId: phraseId,
      targetItemIds: [phraseId],
      exposure: 'visible',
      policyVersion: LEARNING_POLICY_VERSION,
      recordedAt: now,
    }));

    const record: SessionRecord = {
      id: sessionId,
      missionId: selectedMission.id,
      missionVersion: selectedMission.version,
      language: selectedMission.language,
      mode,
      coldAttempt,
      ...(program && programContextAllowed
        ? {
            programContext: {
              programId: program.id,
              programVersion: program.version,
              finalSimulation: finalSimulationAllowed,
            },
          }
        : {}),
      state: 'preflight',
      startedAt: now,
      passages: [],
      supportExposures,
      observations: [],
      taskOutcome: 'unknown',
      sceneState: {
        sceneId: initialScene?.sceneId ?? selectedMission.sceneId ?? selectedMission.id,
        revision: initialScene?.revision ?? 1,
        facts: initialScene?.facts ?? {},
        actionCounts: initialScene?.actionCounts ?? {},
        learnerKnows: authoredScene?.learnerKnows ?? [selectedMission.learnerGoal],
        characterKnows: authoredScene
          ? Object.values(authoredScene.characterKnows).flat()
          : selectedMission.character.knowledgeBoundary,
        checkpoints: [
          {
            id: 'cp-start',
            description: 'Session start',
            timestamp: now,
          },
          ...(initialScene?.checkpoints ?? []),
        ],
        isFinished: initialScene?.isFinished ?? false,
        outcome: initialScene?.outcome ?? 'unknown',
      },
    };

    await archive.beginSession(record);

    router.replace({
      pathname: '/session/[sessionId]',
      params: {
        sessionId: record.id,
        missionId: selectedMission.id,
        mode,
        coldAttempt: String(coldAttempt),
        ...(program && programContextAllowed ? { programId: program.id } : {}),
        ...(finalSimulationAllowed ? { finalSimulation: '1' } : {}),
      },
    });
  };

  return (
    <I18nProvider
      language={archive.preferences.explanationLanguage}
      setLanguage={lang =>
        void archive.savePreferences({
          ...archive.preferences,
          explanationLanguage: lang,
        })
      }
    >
      <MissionBriefingScreen
        mission={mission}
        initialMode={archive.preferences.modeDefault}
        minimalSupport={finalSimulationAllowed}
        finalSimulation={finalSimulationAllowed}
        onBack={() => safeBack(router)}
        onStartSession={handleStartSession}
      />
    </I18nProvider>
  );
}
