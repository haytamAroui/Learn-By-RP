import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { getTranslations, I18nProvider } from '../../features/i18n';
import { LiveSessionView } from '../../components/LiveSessionView';
import { Button } from '../../components/ui';
import { MISSION_CATALOG } from '../../data/missions';
import { SessionRecord } from '../../types';
import { useSessionCoordinator } from '../../features/session/SessionProvider';
import { selectHistoricalCrossSessionSupport } from '../../features/learning/supportScope';
import type { ValidatedSkillEvidence } from '../../features/learning/skillEvidence';
import type { ValidatedPhraseEvidence } from '../../features/learning/learningCore';

export default function SessionScreen() {
  const router = useRouter();
  const archive = useArchive();
  const coordinator = useSessionCoordinator();
  const t = getTranslations(archive.preferences.explanationLanguage);
  const params = useLocalSearchParams<{
    sessionId: string;
    missionId: string;
    mode: string;
    coldAttempt: string;
  }>();

  const [persistedSession, setPersistedSession] = useState<SessionRecord | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!params.sessionId) {
        if (!cancelled) setSessionLoading(false);
        return;
      }

      const found = await archive.getSessionById(params.sessionId);
      if (cancelled) return;
      if (found && ['recap_ready', 'recap_unavailable'].includes(found.state)) {
        router.replace({ pathname: '/recap/[sessionId]', params: { sessionId: found.id } });
        return;
      }
      if (found) coordinator.start(found.id, 'preflight');
      setPersistedSession(found);
      setSessionLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // This route instance owns one durable session id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.sessionId]);

  const mission = MISSION_CATALOG.find(m => m.id === persistedSession?.missionId);

  if (sessionLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <Text className="text-xs text-muted">{t.settings.openingConversation}</Text>
      </View>
    );
  }

  if (!mission || !persistedSession) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-canvas p-6">
        <Text className="text-center text-sm text-muted">{t.settings.missionUnavailable}</Text>
        <Button
          label={t.settings.goBack}
          onPress={() => router.back()}
          variant="secondary"
        />
      </View>
    );
  }

  const historicalSupportExposures = selectHistoricalCrossSessionSupport({
    sessions: archive.sessions,
    currentSessionId: persistedSession.id,
    targetPhraseIds: mission.usefulPhrases.map(phrase => phrase.id),
    currentSessionStartedAt: persistedSession.startedAt,
  });

  const handleEndSession = async (
    session: SessionRecord,
    skillEvidence: ValidatedSkillEvidence,
    phraseEvidence: ValidatedPhraseEvidence
  ) => {
    // Persist transcript/exposures plus validator-issued phrase + skill evidence
    // in one transaction. Raw SessionRecord evidence arrays are not write paths.
    await archive.completeSession(
      session,
      [],
      skillEvidence,
      phraseEvidence
    );
    await coordinator.dispatch('ASSESS_OK');

    router.replace({ pathname: '/recap/[sessionId]', params: { sessionId: session.id } });
  };

  return (
    <I18nProvider
      language={archive.preferences.explanationLanguage}
      setLanguage={lang =>
        void archive.savePreferences({ ...archive.preferences, explanationLanguage: lang })
      }
    >
      <View className="flex-1 bg-canvas">
        <LiveSessionView
          mission={mission}
          initialSession={persistedSession}
          accommodations={archive.preferences.accommodations}
          preferredSpeechRate={archive.preferences.speechRate ?? 1}
          historicalSupportExposures={historicalSupportExposures}
          onEndSession={handleEndSession}
        />
      </View>
    </I18nProvider>
  );
}
