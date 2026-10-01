import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { MISSION_CATALOG } from '../../data/missions';
import { getTranslations, I18nProvider } from '../../features/i18n';
import { useSessionCoordinator } from '../../features/session/SessionProvider';
import { RootHeader } from '../../components/RootHeader';
import { TalkScreen } from '../../components/TalkScreen';
import { MissionBriefingModal } from '../../components/MissionBriefingModal';
import { DuePhrasesPracticeModal } from '../../components/DuePhrasesPracticeModal';
import { MissionDefinition, Mode, SessionRecord } from '../../types';

export default function TalkTab() {
  const router = useRouter();
  const archive = useArchive();
  const session = useSessionCoordinator();

  const [briefing, setBriefing] = React.useState<MissionDefinition | null>(null);
  const [isPracticeDueOpen, setPracticeDueOpen] = React.useState(false);

  const t = getTranslations(archive.preferences.explanationLanguage);

  const availableMissions = MISSION_CATALOG.filter(
    mission => mission.language === archive.preferences.learningLanguage
  );
  const featuredMission = availableMissions[0] ?? MISSION_CATALOG[0];

  const handleStartSession = async (
    mission: MissionDefinition,
    mode: Mode,
    isColdAttempt: boolean
  ) => {
    setBriefing(null);

    // Persist before streaming begins, so a process kill leaves a recoverable
    // session rather than nothing.
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
          {
            id: 'cp-start',
            description: 'Session start',
            timestamp: new Date().toISOString(),
          },
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
        void archive.savePreferences({
          ...archive.preferences,
          explanationLanguage: lang,
        })
      }
    >
      <View className="flex-1 bg-canvas">
        <RootHeader title={t.nav.brandTitle} />
        <TalkScreen
          currentLanguageName={
            t.languages[archive.preferences.learningLanguage] ??
            archive.preferences.learningLanguage
          }
          featuredMission={featuredMission}
          duePhrases={archive.duePhrases}
          onStartMission={setBriefing}
          onExploreMissions={() => router.push('/(tabs)/missions')}
          onPracticeDue={() => setPracticeDueOpen(true)}
        />
      </View>

      <MissionBriefingModal
        mission={briefing}
        initialMode={archive.preferences.modeDefault}
        onClose={() => setBriefing(null)}
        onStartSession={handleStartSession}
      />

      <DuePhrasesPracticeModal
        visible={isPracticeDueOpen}
        duePhrases={archive.duePhrases}
        onClose={() => setPracticeDueOpen(false)}
        onCompleted={() => void archive.refresh()}
        onRecordReview={async input => {
          const { archiveRepository } = await import(
            '../../features/archive/archiveRepository'
          );
          await archiveRepository.recordDrillReview(input);
          await archive.refresh();
        }}
      />
    </I18nProvider>
  );
}
