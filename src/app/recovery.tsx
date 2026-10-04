import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas p-6" edges={['top', 'bottom']}>
        <Text className="text-center text-sm text-muted">
          Nothing was left unfinished.
        </Text>
        <View className="mt-4">
          <Button label="Back" onPress={() => router.back()} variant="secondary" size="sm" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <I18nProvider
      language={archive.preferences.explanationLanguage}
      setLanguage={lang =>
        void archive.savePreferences({ ...archive.preferences, explanationLanguage: lang })
      }
    >
      <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-ink">
            Unfinished conversation
          </Text>
          <Text className="mt-0.5 text-xs text-body">
            The app closed while you were talking. Your transcript was saved.
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            width: '100%',
            maxWidth: 720,
            alignSelf: 'center',
            padding: 16,
            paddingBottom: 40,
            gap: 12,
          }}
        >
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
                    <Button label="Resume" size="sm" onPress={() => router.push({
                      pathname: '/session/[sessionId]', params: { sessionId: item.id },
                    })} />
                  </View>
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
        </ScrollView>
      </SafeAreaView>
    </I18nProvider>
  );
}
