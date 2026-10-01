import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { I18nProvider } from '../../features/i18n';
import { LiveSessionView } from '../../components/LiveSessionView';
import { MISSION_CATALOG } from '../../data/missions';
import { MissionDefinition, Mode, SessionRecord } from '../../types';
import { useSessionCoordinator } from '../../features/session/SessionProvider';

export default function SessionScreen() {
  const router = useRouter();
  const archive = useArchive();
  const coordinator = useSessionCoordinator();
  const params = useLocalSearchParams<{
    sessionId: string;
    missionId: string;
    mode: string;
    coldAttempt: string;
  }>();

  const [mission] = useState<MissionDefinition | undefined>(() =>
    MISSION_CATALOG.find(m => m.id === params.missionId)
  );

  useEffect(() => {
    if (params.sessionId) {
      coordinator.start(params.sessionId);
      coordinator.dispatch('PREFLIGHT');
    }
    // Only on mount for this route instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.sessionId]);

  if (!mission) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Text className="text-center text-sm text-muted">That mission is no longer available.</Text>
        <Text className="mt-3 text-xs text-primary" onPress={() => router.back()}>
          Go back
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
          mode={(params.mode as Mode) ?? archive.preferences.modeDefault}
          coldAttempt={params.coldAttempt !== 'false'}
          onEndSession={handleEndSession}
          onCancel={async () => {
            // Cancelling preserves the transcript; the session is marked ended
            // so it is not offered as a live recovery candidate.
            coordinator.dispatch('END');
            router.back();
          }}
        />
      </View>
    </I18nProvider>
  );
}
