import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { I18nProvider } from '../../features/i18n';
import { Button, EmptyState, SectionLabel } from '../../components/ui';

export default function PhraseScreen() {
  const router = useRouter();
  const archive = useArchive();
  const { phraseId } = useLocalSearchParams<{ phraseId: string }>();
  const [notice, setNotice] = useState<string | null>(null);

  const phrase = archive.phrases.find(p => p.id === phraseId);
  const evidence = archive.observations.filter(
    o => o.itemId === phraseId || o.candidateForm.toLowerCase() === phrase?.form.toLowerCase()
  );

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 3000);
  };

  if (!phrase) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas p-6" edges={['top', 'bottom']}>
        <EmptyState message="That phrase is not in your archive." />
        <View className="mt-4">
          <Button label="Close" onPress={() => router.back()} variant="secondary" />
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
        <View className="w-full self-center flex-row items-center justify-between px-4 py-2" style={{ maxWidth: 1200 }}>
          <Text className="text-lg font-semibold text-ink">Target phrase</Text>
          <Button label="Close" onPress={() => router.back()} variant="ghost" size="sm" />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            width: '100%',
            maxWidth: 720,
            alignSelf: 'center',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 40,
            gap: 20,
          }}
        >
          <View className="gap-1">
            <Text className="text-2xl font-semibold text-ink">"{phrase.form}"</Text>
            <Text className="text-sm text-body">{phrase.meaning}</Text>
          </View>

          {phrase.usageNote ? (
            <Text className="text-sm leading-6 text-body">{phrase.usageNote}</Text>
          ) : null}

          <View className="gap-1.5 rounded-2xl bg-surface-soft p-4">
            <Detail label="Recall state" value={phrase.recallStatus} capitalize />
            <Detail label="Next review interval" value={`${phrase.scheduling.intervalDays} days`} />
            <Detail label="Due now" value={phrase.scheduling.due ? 'Yes' : 'No'} />
            <Detail label="Independent uses" value={String(phrase.stats.unassistedCount)} />
            <Detail label="Uses with help" value={String(phrase.stats.assistedCount)} />
          </View>

          <Button
            label="Practise this now"
            onPress={async () => {
              await archive.resetPhrase(phrase.id);
              flash('Reset. It is due again now.');
            }}
            variant="secondary"
            className="self-start"
          />

          <View className="gap-2.5">
            <SectionLabel>Evidence ({evidence.length})</SectionLabel>

            {evidence.length === 0 ? (
              <EmptyState message="No evidence recorded for this phrase yet." className="py-6" />
            ) : (
              evidence.map(obs => (
                <View key={obs.observationId} className="gap-2 rounded-2xl bg-surface-soft p-4">
                  <Text className="text-sm font-medium text-ink">"{obs.quote}"</Text>
                  <View className="flex-row items-center justify-between gap-2">
                    <Text
                      className={`text-xs font-semibold ${
                        obs.retrieval === 'unassisted' ? 'text-accent-sage' : 'text-primary'
                      }`}
                    >
                      {obs.retrieval === 'unassisted' ? 'used independently' : obs.retrieval} (
                      {obs.modality})
                    </Text>
                    <Text className="text-xs text-muted">
                      {new Date(obs.recordedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    <Button
                      label="Hide"
                      onPress={() => {
                        void archive.hideObservation(obs.observationId);
                        flash('Hidden. It no longer counts toward progress.');
                      }}
                      variant="ghost"
                      size="sm"
                    />
                    <Button
                      label="That's not right"
                      onPress={() => {
                        void archive.disputeObservation(obs.observationId);
                        flash('Disputed and removed from your progress.');
                      }}
                      variant="ghost"
                      size="sm"
                    />
                  </View>
                </View>
              ))
            )}
          </View>

          {notice ? <Text className="text-sm font-medium text-accent-sage">{notice}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </I18nProvider>
  );
}

const Detail: React.FC<{ label: string; value: string; capitalize?: boolean }> = ({
  label,
  value,
  capitalize,
}) => (
  <View className="min-h-10 flex-row items-center justify-between gap-3">
    <Text className="text-sm text-muted">{label}</Text>
    <Text className={`text-sm font-medium text-ink ${capitalize ? 'capitalize' : ''}`}>
      {value}
    </Text>
  </View>
);
