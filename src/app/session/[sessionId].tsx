import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { getTranslations, I18nProvider } from '../../features/i18n';
import { LiveSessionView } from '../../components/LiveSessionView';
import { MISSION_CATALOG } from '../../data/missions';
import { MissionDefinition, SessionRecord } from '../../types';
import { useSessionCoordinator } from '../../features/session/SessionProvider';

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

  const [mission] = useState<MissionDefinition | undefined>(() =>
    MISSION_CATALOG.find(m => m.id === params.missionId)
  );
  const [persistedSession, setPersistedSession] = useState<SessionRecord | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (params.sessionId) {
      coordinator.start(params.sessionId);
      coordinator.dispatch('PREFLIGHT');
    }

    (async () => {
      if (!params.sessionId) {
        if (!cancelled) setSessionLoading(false);
        return;
      }

      const found = await archive.getSessionById(params.sessionId);
      if (cancelled) return;
      setPersistedSession(found);
      setSessionLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // This route instance owns one durable session id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.sessionId]);

  if (sessionLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <Text className="text-xs text-muted">{t.settings.openingConversation}</Text>
      </View>
    );
  }

  if (!mission || !persistedSession) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Text className="text-center text-sm text-muted">{t.settings.missionUnavailable}</Text>
        <Text className="mt-3 text-xs text-primary" onPress={() => router.back()}>
          {t.settings.goBack}
        </Text>
      </View>
    );
  }

  const handleEndSession = async (session: SessionRecord) => {
    // Persist transcript, exposure ledger, validated observations and the
    // recomputed projection in one transaction.
    await archive.completeSession(session);
    coordinator.dispatch('END');
    coordinator.dispatch('ENDED');
    coordinator.dispatch('ASSESS_START');
    coordinator.dispatch('ASSESS_OK');

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
          onEndSession={handleEndSession}
        />
      </View>
    </I18nProvider>
  );
}
