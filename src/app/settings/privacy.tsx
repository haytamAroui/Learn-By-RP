import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { getTranslations, I18nProvider } from '../../features/i18n';
import { Button, SectionLabel } from '../../components/ui';
import { CONSENT_VERSION } from '../../features/archive/schema';
import { LEARNING_POLICY_VERSION } from '../../features/learning/policy';

export default function SettingsPrivacyScreen() {
  const router = useRouter();
  const archive = useArchive();
  const t = getTranslations(archive.preferences.explanationLanguage);

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
            {t.settings.privacyTitle}
          </Text>
          <Button label={t.settings.doneLabel} onPress={() => router.back()} variant="ghost" size="sm" />
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
            <SectionLabel>{t.settings.privacyStorageLabel}</SectionLabel>
            <View className="gap-2 rounded-2xl bg-surface-soft p-4">
              <Text className="text-sm leading-6 text-body">
                {t.settings.privacyStorageLocal}
              </Text>
              <Text className="text-sm leading-6 text-body">
                {t.settings.privacyStorageAnalysis}
              </Text>
              <Text className="text-sm leading-6 text-body">
                {t.settings.privacyStorageExports}
              </Text>
            </View>
          </View>

          <View className="gap-2">
            <SectionLabel>{t.settings.consentLabel}</SectionLabel>
            <View className="gap-3 rounded-2xl bg-surface-soft p-4">
              <ConsentLine
                label={t.settings.liveVoiceLabel}
                granted={archive.consent.voice?.granted ?? false}
                grantedLabel={t.settings.grantedLabel}
                withdrawnLabel={t.settings.withdrawnLabel}
                withdrawLabel={t.settings.withdrawLabel}
                onWithdraw={() => {
                  void archive.consent.withdrawConsent('voice');
                  flash(t.settings.voiceWithdrawnNotice);
                }}
              />
              <ConsentLine
                label={t.settings.savedAnalysisLabel}
                granted={archive.consent.savedAnalysis?.granted ?? false}
                grantedLabel={t.settings.grantedLabel}
                withdrawnLabel={t.settings.withdrawnLabel}
                withdrawLabel={t.settings.withdrawLabel}
                onWithdraw={() => {
                  void archive.consent.withdrawConsent('saved_analysis');
                  flash(t.settings.analysisWithdrawnNotice);
                }}
              />
              <Text className="text-xs text-muted">
                {t.settings.consentVersionLabel} {CONSENT_VERSION}
              </Text>
            </View>
          </View>

          <View className="gap-2">
            <SectionLabel>{t.settings.yourDataLabel}</SectionLabel>
            <View className="rounded-2xl bg-surface-soft p-4">
              <Button
                label={t.settings.exportArchiveAction}
                onPress={async () => {
                  const { shareTextFile } = await import('../../lib/share');
                  const json = await archive.exportArchive();
                  const result = await shareTextFile(
                    `learnbyrp-archive-${new Date().toISOString().slice(0, 10)}.json`,
                    json,
                    'application/json'
                  );
                  flash(result.ok ? t.settings.archiveExportedNotice : t.settings.exportFailedNotice);
                }}
                variant="secondary"
                className="self-start"
              />
            </View>
          </View>

          <View className="gap-2.5 rounded-2xl border border-danger/30 bg-danger-soft p-4">
            <Text className="text-sm font-semibold text-danger">{t.settings.eraseAllTitle}</Text>
            <Text className="text-sm leading-5 text-danger">
              {t.settings.eraseAllDesc}
            </Text>
            <Button
              label={confirmErase ? t.settings.eraseConfirmTap : t.settings.eraseEverything}
              onPress={async () => {
                if (!confirmErase) {
                  setConfirmErase(true);
                  return;
                }
                await archive.clearAllLearningData();
                setConfirmErase(false);
                flash(t.settings.erasedNotice);
              }}
              variant="danger"
              className="self-start"
            />
          </View>

          <View className="gap-1">
            <SectionLabel>{t.settings.versionsLabel}</SectionLabel>
            <Text className="text-xs text-muted">
              {t.settings.learningPolicyLabel} v{LEARNING_POLICY_VERSION} · {t.settings.consentLabel} {CONSENT_VERSION}
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
  grantedLabel: string;
  withdrawnLabel: string;
  withdrawLabel: string;
  onWithdraw: () => void;
}

const ConsentLine: React.FC<ConsentLineProps> = ({
  label,
  granted,
  grantedLabel,
  withdrawnLabel,
  withdrawLabel,
  onWithdraw,
}) => (
  <View className="min-h-12 flex-row items-center justify-between gap-3">
    <View className="flex-1">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <Text className={`text-xs ${granted ? 'text-accent-sage' : 'text-muted'}`}>
        {granted ? grantedLabel : withdrawnLabel}
      </Text>
    </View>
    {granted ? (
      <Button label={withdrawLabel} onPress={onWithdraw} variant="secondary" size="sm" />
    ) : null}
  </View>
);
