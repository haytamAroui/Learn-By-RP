import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { getTranslations, I18nProvider } from '../../features/i18n';
import { MissionBriefingScreen } from '../../components/MissionBriefingScreen';
import { Button } from '../../components/ui';
import { MISSION_CATALOG } from '../../data/missions';
import { MissionDefinition, Mode, SessionRecord, SupportExposure } from '../../types';
import { LEARNING_POLICY_VERSION } from '../../features/learning/policy';

export default function MissionBriefingRoute() {
  const router = useRouter();
  const archive = useArchive();
  const t = getTranslations(archive.preferences.explanationLanguage);
  const { missionId } = useLocalSearchParams<{ missionId: string }>();
  const mission = MISSION_CATALOG.find(item => item.id === missionId);

  if (!mission) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-canvas p-6">
        <Text className="text-center text-sm text-muted">
          {t.settings.missionUnavailable}
        </Text>
        <Button
          label={t.settings.goBack}
          onPress={() => router.back()}
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
      state: 'preflight',
      startedAt: now,
      passages: [],
      supportExposures,
      observations: [],
      taskOutcome: 'unknown',
      sceneState: {
        sceneId: selectedMission.id,
        revision: 1,
        facts: { ...selectedMission.character },
        learnerKnows: [selectedMission.learnerGoal],
        characterKnows: selectedMission.character.knowledgeBoundary,
        checkpoints: [
          {
            id: 'cp-start',
            description: 'Session start',
            timestamp: now,
          },
        ],
        isFinished: false,
        outcome: 'unknown',
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
        onBack={() => router.back()}
        onStartSession={handleStartSession}
      />
    </I18nProvider>
  );
}
