import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { getTranslations, I18nProvider } from '../../features/i18n';
import { RootHeader } from '../../components/RootHeader';
import { ProgressScreen } from '../../components/ProgressScreen';
import { DuePhrasesPracticeModal } from '../../components/DuePhrasesPracticeModal';

export default function ProgressTab() {
  const router = useRouter();
  const archive = useArchive();
  const t = getTranslations(archive.preferences.explanationLanguage);
  const [isPracticeDueOpen, setPracticeDueOpen] = React.useState(false);

  return (
    <I18nProvider
      language={archive.preferences.explanationLanguage}
      setLanguage={lang =>
        void archive.savePreferences({ ...archive.preferences, explanationLanguage: lang })
      }
    >
      <View className="flex-1 bg-canvas">
        <RootHeader title={t.nav.progress} />
        <ProgressScreen
          phrases={archive.phrases}
          sessions={archive.sessions}
          observations={archive.observations}
          learningLanguage={archive.preferences.learningLanguage}
          onPracticeDue={() => setPracticeDueOpen(true)}
          onSelectSession={s => router.push({ pathname: '/recap/[sessionId]', params: { sessionId: s.id } })}
          onDisputeObservation={id => void archive.disputeObservation(id)}
          onHideObservation={id => void archive.hideObservation(id)}
        />
      </View>

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
