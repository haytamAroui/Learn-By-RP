import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { I18nProvider } from '../../features/i18n';
import { RootHeader } from '../../components/RootHeader';
import { MissionsScreen } from '../../components/MissionsScreen';
import { MissionBriefingModal } from '../../components/MissionBriefingModal';
import { MISSION_CATALOG } from '../../data/missions';
import { MissionDefinition, Mode, SessionRecord } from '../../types';
import { useSessionCoordinator } from '../../features/session/SessionProvider';

export default function MissionsTab() {
  const router = useRouter();
  const archive = useArchive();
  const session = useSessionCoordinator();

  const [briefing, setBriefing] = React.useState<MissionDefinition | null>(null);

  const availableMissions = MISSION_CATALOG.filter(
    m => m.language === archive.preferences.learningLanguage
  );

  const handleStartSession = async (
    mission: MissionDefinition,
    mode: Mode,
    isColdAttempt: boolean
  ) => {
    setBriefing(null);

    const record: SessionRecord = {
      id: `session-${Date.now()}`,
      missionId: mission.id,
      missionVersion: mission.version,
      language: mission.language,
      mode,
      coldAttempt: isColdAttempt,
      state: 'preflight',
      startedAt: new Date().toISOString(),
      passages: [],
      supportExposures: [],
      observations: [],
      taskOutcome: 'unknown',
      sceneState: {
        sceneId: mission.id,
        revision: 1,
        facts: { ...mission.character },
        learnerKnows: [mission.learnerGoal],
        characterKnows: mission.character.knowledgeBoundary,
        checkpoints: [
          { id: 'cp-start', description: 'Session start', timestamp: new Date().toISOString() },
        ],
        isFinished: false,
        outcome: 'unknown',
      },
    };

    await archive.beginSession(record);
    session.start(record.id);
    session.dispatch('PREFLIGHT');

    router.push({
      pathname: '/session/[sessionId]',
      params: {
        sessionId: record.id,
        missionId: mission.id,
        mode,
        coldAttempt: String(isColdAttempt),
      },
    });
  };

  return (
    <I18nProvider
      language={archive.preferences.explanationLanguage}
      setLanguage={lang =>
        void archive.savePreferences({ ...archive.preferences, explanationLanguage: lang })
      }
    >
      <View className="flex-1 bg-canvas">
        <RootHeader title="Missions" />
        <MissionsScreen
          missions={availableMissions}
          onSelectMission={setBriefing}
        />
      </View>

      <MissionBriefingModal
        mission={briefing}
        initialMode={archive.preferences.modeDefault}
        onClose={() => setBriefing(null)}
        onStartSession={handleStartSession}
      />
    </I18nProvider>
  );
}
