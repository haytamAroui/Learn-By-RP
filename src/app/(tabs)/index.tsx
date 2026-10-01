import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { MISSION_CATALOG } from '../../data/missions';
import { getTranslations, I18nProvider } from '../../features/i18n';
import { RootHeader } from '../../components/RootHeader';
import { TalkScreen } from '../../components/TalkScreen';
import { DuePhrasesPracticeModal } from '../../components/DuePhrasesPracticeModal';

export default function TalkTab() {
  const router = useRouter();
  const archive = useArchive();

  const [isPracticeDueOpen, setPracticeDueOpen] = React.useState(false);

  const t = getTranslations(archive.preferences.explanationLanguage);

  const availableMissions = MISSION_CATALOG.filter(
    mission => mission.language === archive.preferences.learningLanguage
  );
  const featuredMission = availableMissions[0] ?? MISSION_CATALOG[0];

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
          onStartMission={mission =>
            router.push({
              pathname: '/mission/[missionId]',
              params: { missionId: mission.id },
            })
          }
          onExploreMissions={() => router.push('/(tabs)/missions')}
          onPracticeDue={() => setPracticeDueOpen(true)}
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
