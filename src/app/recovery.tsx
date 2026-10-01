import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useArchive } from '../features/archive/ArchiveProvider';
import { Button, Card, SectionLabel } from '../components/ui';
import { I18nProvider } from '../features/i18n';
import { MISSION_CATALOG } from '../data/missions';

/**
 * App-kill recovery (§7.11).
 *
 * A session left open when the app died is offered as "review what happened" or
 * "discard". Nothing is silently resumed and nothing is silently deleted.
 */
export default function RecoveryScreen() {
  const router = useRouter();
  const archive = useArchive();

  const interrupted = archive.interruptedSessions;

  if (interrupted.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Text className="text-center text-sm text-muted">
          Nothing was left unfinished.
        </Text>
        <View className="mt-4">
          <Button label="Back" onPress={() => router.back()} variant="secondary" size="sm" />
        </View>
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
        <View className="border-b border-border-subtle px-4 py-3" style={{ paddingTop: 52 }}>
          <Text className="font-display text-lg font-semibold text-ink">
            Unfinished conversation
          </Text>
          <Text className="mt-0.5 text-xs text-body">
            The app closed while you were talking. Your transcript was saved.
          </Text>
        </View>

        <View className="gap-3 p-4">
          <SectionLabel>Sessions to review</SectionLabel>

          {interrupted.map(item => {
            const mission = MISSION_CATALOG.find(m => m.id === item.missionId);
            const session = archive.sessions.find(s => s.id === item.id);

            return (
              <Card key={item.id} className="gap-3">
                <View className="gap-1">
                  <Text className="text-sm font-semibold text-ink">
                    {mission?.title ?? item.missionId}
                  </Text>
                  <Text className="text-xs text-muted">
                    Started {new Date(item.startedAt).toLocaleString()} · {item.state}
                  </Text>
                  {session ? (
                    <Text className="text-xs text-muted">
                      {session.passages.length} turns saved
                    </Text>
                  ) : null}
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button
                      label="Review"
                      onPress={() => router.push({ pathname: '/recap/[sessionId]', params: { sessionId: item.id } })}
                      size="sm"
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label="Discard"
                      onPress={() => void archive.deleteSession(item.id)}
                      variant="secondary"
                      size="sm"
                    />
                  </View>
                </View>
              </Card>
            );
          })}

          <Button
            label="Continue to the app"
            onPress={() => router.replace('/(tabs)')}
            variant="ghost"
            size="sm"
            className="mt-2 self-start"
          />
        </View>
      </View>
    </I18nProvider>
  );
}
