import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { I18nProvider } from '../../features/i18n';
import { Button, SectionLabel } from '../../components/ui';
import { CONSENT_VERSION } from '../../features/archive/schema';
import { LEARNING_POLICY_VERSION } from '../../features/learning/policy';

export default function SettingsPrivacyScreen() {
  const router = useRouter();
  const archive = useArchive();
  const params = useLocalSearchParams<{ section?: string }>();

  const [notice, setNotice] = useState<string | null>(null);
  const [confirmErase, setConfirmErase] = useState(false);

  const flash = useCallback((message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 3500);
  }, []);

  return (
    <I18nProvider
      language={archive.preferences.explanationLanguage}
      setLanguage={lang =>
        void archive.savePreferences({ ...archive.preferences, explanationLanguage: lang })
      }
    >
      <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
        <View className="w-full self-center flex-row items-center justify-between px-4 py-2" style={{ maxWidth: 1200 }}>
          <Text className="text-xl font-semibold text-ink">
            {params.section === 'privacy' ? 'Privacy & data' : 'Privacy & data'}
          </Text>
          <Button label="Done" onPress={() => router.back()} variant="ghost" size="sm" />
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
            gap: 24,
          }}
        >
          <View className="gap-2">
            <SectionLabel>What is stored where</SectionLabel>
            <View className="gap-2 rounded-2xl bg-surface-soft p-4">
              <Text className="text-sm leading-6 text-body">
                Your conversations, phrase history and evidence ledger are stored only on this
                device. They are not synced anywhere.
              </Text>
              <Text className="text-sm leading-6 text-body">
                When you end a session, the transcript turns you produced is sent to an AI
                provider for review so phrases can be matched. Nothing else leaves the device,
                and nothing is used to train a model.
              </Text>
              <Text className="text-sm leading-6 text-body">
                Files you export or share leave the app. Once shared, they cannot be recalled by
                clearing this app.
              </Text>
            </View>
          </View>

          <View className="gap-2">
            <SectionLabel>Consent</SectionLabel>
            <View className="gap-3 rounded-2xl bg-surface-soft p-4">
              <ConsentLine
                label="Live voice processing"
                granted={archive.consent.voice?.granted ?? false}
                onWithdraw={() => {
                  void archive.consent.withdrawConsent('voice');
                  flash('Voice processing withdrawn. Speaking is disabled.');
                }}
              />
              <ConsentLine
                label="Conversation analysis"
                granted={archive.consent.savedAnalysis?.granted ?? false}
                onWithdraw={() => {
                  void archive.consent.withdrawConsent('saved_analysis');
                  flash('Analysis withdrawn. No new evidence will be recorded.');
                }}
              />
              <Text className="text-xs text-muted">Consent version {CONSENT_VERSION}</Text>
            </View>
          </View>

          <View className="gap-2">
            <SectionLabel>Your data</SectionLabel>
            <View className="rounded-2xl bg-surface-soft p-4">
              <Button
                label="Export my archive"
                onPress={async () => {
                  const { shareTextFile } = await import('../../lib/share');
                  const json = await archive.exportArchive();
                  const result = await shareTextFile(
                    `learnbyrp-archive-${new Date().toISOString().slice(0, 10)}.json`,
                    json,
                    'application/json'
                  );
                  flash(result.ok ? 'Archive exported.' : 'Export failed.');
                }}
                variant="secondary"
                className="self-start"
              />
            </View>
          </View>

          <View className="gap-2.5 rounded-2xl border border-danger/30 bg-danger-soft p-4">
            <Text className="text-sm font-semibold text-danger">Erase all learning data</Text>
            <Text className="text-sm leading-5 text-danger">
              Deletes every session, observation and schedule on this device. This cannot be
              undone.
            </Text>
            <Button
              label={confirmErase ? 'Tap again to confirm' : 'Erase everything'}
              onPress={async () => {
                if (!confirmErase) {
                  setConfirmErase(true);
                  return;
                }
                await archive.clearAllLearningData();
                setConfirmErase(false);
                flash('All learning data erased.');
              }}
              variant="danger"
              className="self-start"
            />
          </View>

          <View className="gap-1">
            <SectionLabel>Versions</SectionLabel>
            <Text className="text-xs text-muted">
              Learning policy v{LEARNING_POLICY_VERSION} · Consent {CONSENT_VERSION}
            </Text>
          </View>

          {notice ? <Text className="text-sm font-medium text-accent-sage">{notice}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </I18nProvider>
  );
}

interface ConsentLineProps {
  label: string;
  granted: boolean;
  onWithdraw: () => void;
}

const ConsentLine: React.FC<ConsentLineProps> = ({ label, granted, onWithdraw }) => (
  <View className="min-h-12 flex-row items-center justify-between gap-3">
    <View className="flex-1">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <Text className={`text-xs ${granted ? 'text-accent-sage' : 'text-muted'}`}>
        {granted ? 'Granted' : 'Withdrawn'}
      </Text>
    </View>
    {granted ? (
      <Button label="Withdraw" onPress={onWithdraw} variant="secondary" size="sm" />
    ) : null}
  </View>
);
