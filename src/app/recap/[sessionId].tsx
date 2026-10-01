import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { I18nProvider } from '../../features/i18n';
import { RecapModal } from '../../components/RecapModal';
import { MISSION_CATALOG } from '../../data/missions';
import { SessionRecord } from '../../types';

export default function RecapScreen() {
  const router = useRouter();
  const archive = useArchive();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [session, setSession] = useState<SessionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const found = archive.sessions.find(s => s.id === sessionId) ?? null;
      if (cancelled) return;
      setSession(found);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, archive.sessions]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <Text className="text-xs text-muted">Loading your receipt…</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Text className="text-center text-sm text-muted">
          This session is not in your archive. It may have been deleted.
        </Text>
        <Text className="mt-3 text-xs text-primary" onPress={() => router.back()}>
          Go back
        </Text>
      </View>
    );
  }

  return (
    <I18nProvider
      language={archive.preferences.explanationLanguage}
      setLanguage={lang =>
        void archive.savePreferences({ ...archive.preferences, explanationLanguage: lang })
      }
    >
      <View className="flex-1 bg-canvas">
        <RecapModal
          session={session}
          onClose={() => router.back()}
          onNextMission={mission => {
            router.replace({
              pathname: '/session/[sessionId]',
              params: {
                sessionId: `session-${Date.now()}`,
                missionId: mission.id,
                mode: archive.preferences.modeDefault,
                coldAttempt: 'true',
              },
            });
          }}
        />
      </View>
    </I18nProvider>
  );
}
