import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { I18nProvider } from '../../features/i18n';
import { RootHeader } from '../../components/RootHeader';
import { ProgressScreen } from '../../components/ProgressScreen';

export default function ProgressTab() {
  const router = useRouter();
  const archive = useArchive();

  return (
    <I18nProvider
      language={archive.preferences.explanationLanguage}
      setLanguage={lang =>
        void archive.savePreferences({ ...archive.preferences, explanationLanguage: lang })
      }
    >
      <View className="flex-1 bg-canvas">
        <RootHeader title="Progress" />
        <ProgressScreen
          phrases={archive.phrases}
          sessions={archive.sessions}
          observations={archive.observations}
          onSelectSession={s => router.push({ pathname: '/recap/[sessionId]', params: { sessionId: s.id } })}
          onDisputeObservation={id => void archive.disputeObservation(id)}
          onHideObservation={id => void archive.hideObservation(id)}
        />
      </View>
    </I18nProvider>
  );
}
