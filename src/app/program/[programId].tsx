import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { I18nProvider, getTranslations } from '../../features/i18n';
import { ROLEPLAY_PROGRAM_CATALOG } from '../../data/programs';
import { ProgramScreen } from '../../components/ProgramScreen';
import { Button } from '../../components/ui';

export default function ProgramRoute() {
  const router = useRouter();
  const archive = useArchive();
  const t = getTranslations(archive.preferences.explanationLanguage);
  const { programId, recommended, entryMode, match } = useLocalSearchParams<{
    programId: string;
    recommended?: string;
    entryMode?: 'observe_first' | 'guided_first' | 'warmup_first';
    match?: 'exact' | 'closest';
  }>();
  const program = ROLEPLAY_PROGRAM_CATALOG.find(candidate => candidate.id === programId);

  if (!program) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-canvas p-6">
        <Text className="text-center text-sm text-muted">{t.missions.programNotFound}</Text>
        <Button label={t.common.back} onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

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
      <ProgramScreen
        program={program}
        sessions={archive.sessions}
        recommendation={
          recommended === '1' && entryMode
            ? {
                entryMode,
                match: match === 'closest' ? 'closest' : 'exact',
              }
            : undefined
        }
        onBack={() =>
          recommended === '1' ? router.replace('/(tabs)') : router.back()
        }
        onStartMission={(mission, options) =>
          router.push({
            pathname: '/mission/[missionId]',
            params: {
              missionId: mission.id,
              programId: program.id,
              ...(options?.finalSimulation ? { finalSimulation: '1' } : {}),
            },
          })
        }
      />
    </I18nProvider>
  );
}
