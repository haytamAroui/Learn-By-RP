import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <EmptyState message="That phrase is not in your archive." />
        <View className="mt-4">
          <Button label="Close" onPress={() => router.back()} variant="secondary" size="sm" />
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
        <View className="flex-row items-center justify-between border-b border-border-subtle px-3.5 py-3" style={{ paddingTop: 52 }}>
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted">
            Target phrase
          </Text>
          <Button label="Close" onPress={() => router.back()} variant="ghost" size="sm" />
        </View>

        <View className="gap-4 p-4">
          <View className="gap-1">
            <Text className="font-display text-2xl font-bold text-ink">"{phrase.form}"</Text>
            <Text className="text-sm text-body">{phrase.meaning}</Text>
          </View>

          {phrase.usageNote ? (
            <Text className="text-xs leading-relaxed text-body">{phrase.usageNote}</Text>
          ) : null}

          <View className="gap-1.5 rounded-xl border border-border-subtle bg-surface-sunken p-4">
            <Detail label="Recall state" value={phrase.recallStatus} capitalize />
            <Detail label="Next review interval" value={`${phrase.scheduling.intervalDays} days`} />
            <Detail
              label="Due now"
              value={phrase.scheduling.due ? 'Yes' : 'No'}
            />
            <Detail
              label="Independent uses"
              value={String(phrase.stats.unassistedCount)}
            />
            <Detail label="Uses with help" value={String(phrase.stats.assistedCount)} />
          </View>

          <Button
            label="Practise this now"
            onPress={async () => {
              await archive.resetPhrase(phrase.id);
              flash('Reset. It is due again now.');
            }}
            variant="secondary"
            size="sm"
            className="self-start"
          />

          <View className="gap-2.5">
            <SectionLabel>Evidence ({evidence.length})</SectionLabel>

            {evidence.length === 0 ? (
              <EmptyState message="No evidence recorded for this phrase yet." className="py-6" />
            ) : (
              evidence.map(obs => (
                <View
                  key={obs.observationId}
                  className="gap-2 rounded-xl border border-border-subtle bg-surface p-3"
                >
                  <Text className="text-xs font-medium text-ink">"{obs.quote}"</Text>
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
                  <View className="flex-row gap-2">
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

          {notice ? <Text className="text-xs font-medium text-accent-sage">{notice}</Text> : null}
        </View>
      </View>
    </I18nProvider>
  );
}

const Detail: React.FC<{ label: string; value: string; capitalize?: boolean }> = ({
  label,
  value,
  capitalize,
}) => (
  <View className="flex-row items-center justify-between gap-3">
    <Text className="text-xs text-muted">{label}</Text>
    <Text className={`text-xs font-medium text-ink ${capitalize ? 'capitalize' : ''}`}>
      {value}
    </Text>
  </View>
);
