import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { getTranslations, I18nProvider } from '../../features/i18n';
import { RootHeader } from '../../components/RootHeader';
import { MissionsScreen } from '../../components/MissionsScreen';
import { MISSION_CATALOG } from '../../data/missions';

export default function MissionsTab() {
  const router = useRouter();
  const archive = useArchive();
  const t = getTranslations(archive.preferences.explanationLanguage);


  const availableMissions = MISSION_CATALOG.filter(
    m => m.language === archive.preferences.learningLanguage
  );

  return (
    <I18nProvider
      language={archive.preferences.explanationLanguage}
      setLanguage={lang =>
        void archive.savePreferences({ ...archive.preferences, explanationLanguage: lang })
      }
    >
      <View className="flex-1 bg-canvas">
        <RootHeader title={t.nav.missions} />
        <MissionsScreen
          missions={availableMissions}
          onSelectMission={mission =>
            router.push({
              pathname: '/mission/[missionId]',
              params: { missionId: mission.id },
            })
          }
        />
      </View>

    </I18nProvider>
  );
}
