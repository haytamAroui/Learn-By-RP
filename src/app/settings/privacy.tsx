import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
      <View className="flex-1 bg-canvas">
        <View className="flex-row items-center justify-between border-b border-border-subtle px-3.5 py-3" style={{ paddingTop: 52 }}>
          <Text className="font-display text-lg font-semibold text-ink">
            {params.section === 'privacy' ? 'Privacy' : 'Settings'}
          </Text>
          <Button label="Done" onPress={() => router.back()} variant="ghost" size="sm" />
        </View>

        <View style={{ flex: 1 }} className="gap-5 p-4">
          <View className="gap-2">
            <SectionLabel>What is stored where</SectionLabel>
            <View className="gap-2 rounded-2xl border border-border-subtle bg-surface-sunken p-4">
              <Text className="text-xs leading-relaxed text-body">
                Your conversations, phrase history and evidence ledger are stored only on this
                device. They are not synced anywhere.
              </Text>
              <Text className="text-xs leading-relaxed text-body">
                When you end a session, the transcript turns you produced is sent to an AI
                provider for review so phrases can be matched. Nothing else leaves the device,
                and nothing is used to train a model.
              </Text>
              <Text className="text-xs leading-relaxed text-body">
                Files you export or share leave the app. Once shared, they cannot be recalled by
                clearing this app.
              </Text>
            </View>
          </View>

          <View className="gap-2">
            <SectionLabel>Consent</SectionLabel>
            <View className="gap-3 rounded-2xl border border-border-subtle bg-surface p-4">
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
            <View className="gap-2.5 rounded-2xl border border-border-subtle bg-surface p-4">
              <Button
                label="Export my archive"
                onPress={async () => {
                  const { shareTextFile } = await import('../../lib/share');
                  const json = await archive.exportArchive();
                  const result = await shareTextFile(
                    `mission-coach-archive-${new Date().toISOString().slice(0, 10)}.json`,
                    json,
                    'application/json'
                  );
                  flash(result.ok ? 'Archive exported.' : 'Export failed.');
                }}
                variant="secondary"
                size="sm"
                className="self-start"
              />
            </View>
          </View>

          <View className="gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <Text className="text-xs font-medium text-red-500">Erase all learning data</Text>
            <Text className="text-xs text-red-400">
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
              size="sm"
              className="self-start"
            />
          </View>

          <View className="gap-1">
            <SectionLabel>Versions</SectionLabel>
            <Text className="text-xs text-muted">
              Learning policy v{LEARNING_POLICY_VERSION} · Consent {CONSENT_VERSION}
            </Text>
          </View>

          {notice ? <Text className="text-xs font-medium text-accent-sage">{notice}</Text> : null}
        </View>
      </View>
    </I18nProvider>
  );
}

interface ConsentLineProps {
  label: string;
  granted: boolean;
  onWithdraw: () => void;
}

const ConsentLine: React.FC<ConsentLineProps> = ({ label, granted, onWithdraw }) => (
  <View className="flex-row items-center justify-between gap-3">
    <View className="flex-1">
      <Text className="text-xs font-medium text-ink">{label}</Text>
      <Text className={`text-xs ${granted ? 'text-accent-sage' : 'text-muted'}`}>
        {granted ? 'Granted' : 'Withdrawn'}
      </Text>
    </View>
    {granted ? (
      <Button label="Withdraw" onPress={onWithdraw} variant="secondary" size="sm" />
    ) : null}
  </View>
);
