import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { CONSENT_VERSION } from '../../features/archive/schema';
import { getTranslations } from '../../features/i18n';
import { LanguageCode, UiLanguage, UserPreferences } from '../../types';
import { Button, Card, ChipRow, SectionLabel } from '../../components/ui';
import { Text } from 'react-native';

const TARGET_LANGUAGES: Array<{ id: LanguageCode; label: string }> = [
  { id: 'es', label: '🇪🇸 Spanish' },
  { id: 'fr', label: '🇫🇷 French' },
  { id: 'de', label: '🇩🇪 German' },
  { id: 'it', label: '🇮🇹 Italian' },
  { id: 'ja', label: '🇯🇵 Japanese' },
];

const UI_LANGUAGES: Array<{ id: UiLanguage; label: string }> = [
  { id: 'en', label: '🇬🇧 English' },
  { id: 'fr', label: '🇫🇷 Français' },
  { id: 'es', label: '🇪🇸 Español' },
  { id: 'nl', label: '🇳🇱 Nederlands' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { preferences, savePreferences, consent } = useArchive();

  const [learningLanguage, setLearningLanguage] = useState<LanguageCode>(
    preferences.learningLanguage
  );
  const [explanationLanguage, setExplanationLanguage] = useState<UiLanguage>(
    preferences.explanationLanguage
  );
  const [comfortLevel, setComfortLevel] = useState<UserPreferences['comfortLevel']>(
    preferences.comfortLevel
  );
  const [primaryGoal, setPrimaryGoal] = useState<UserPreferences['primaryGoal']>(
    preferences.primaryGoal
  );
  const [voiceConsent, setVoiceConsent] = useState(consent.voice?.granted ?? false);
  const [analysisConsent, setAnalysisConsent] = useState(
    consent.savedAnalysis?.granted ?? false
  );

  const t = getTranslations(explanationLanguage);

  const handleContinue = async () => {
    await savePreferences({
      ...preferences,
      learningLanguage,
      explanationLanguage,
      comfortLevel,
      primaryGoal,
      voiceProcessingConsent: voiceConsent,
      savedAnalysisConsent: analysisConsent,
    });

    await consent.recordConsent('voice', voiceConsent);
    await consent.recordConsent('saved_analysis', analysisConsent);

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
          padding: 20,
          paddingBottom: 40,
          gap: 20,
        }}
      >
          <View className="gap-1.5">
            <Text className="text-2xl font-semibold tracking-tight text-ink">
              {t.nav.brandTitle}
            </Text>
            <Text className="text-sm leading-relaxed text-body">
              Choose your language, comfort level, goal, and privacy options. No placement test.
            </Text>
          </View>

          <View className="gap-2">
            <SectionLabel>{t.settings.targetLangLabel}</SectionLabel>
            <ChipRow
              value={learningLanguage}
              onChange={id => setLearningLanguage(id as LanguageCode)}
              options={TARGET_LANGUAGES}
            />
          </View>

          <View className="gap-2">
            <SectionLabel>{t.settings.uiLangLabel}</SectionLabel>
            <ChipRow
              value={explanationLanguage}
              onChange={id => setExplanationLanguage(id as UiLanguage)}
              options={UI_LANGUAGES}
            />
          </View>

          <View className="gap-2">
            <SectionLabel>{t.settings.comfortLabel}</SectionLabel>
            <ChipRow
              value={comfortLevel}
              onChange={id => setComfortLevel(id as UserPreferences['comfortLevel'])}
              options={[
                { id: 'beginner', label: t.settings.comfortBeginner },
                { id: 'elementary', label: t.settings.comfortElementary },
                { id: 'intermediate', label: t.settings.comfortIntermediate },
                { id: 'not_sure', label: t.settings.comfortNotSure },
              ]}
            />
          </View>

          <View className="gap-2">
            <SectionLabel>{t.settings.goalLabel}</SectionLabel>
            <ChipRow
              value={primaryGoal}
              onChange={id => setPrimaryGoal(id as UserPreferences['primaryGoal'])}
              options={[
                { id: 'travel', label: t.settings.goalTravel },
                { id: 'relocation', label: t.settings.goalRelocation },
                { id: 'work', label: t.settings.goalWork },
                { id: 'social', label: t.settings.goalSocial },
                { id: 'explore', label: t.settings.goalExplore },
              ]}
            />
          </View>

          <Card className="gap-3 bg-surface-sunken">
            <SectionLabel>Before you start</SectionLabel>
            <Text className="text-xs leading-relaxed text-body">
              When you speak, your voice is processed by an AI provider to produce the
              character's reply. Your conversation is stored on this device. Only the turns
              needed for review are sent for assessment, and nothing is used to train a
              model. You can change or withdraw this at any time in Settings.
            </Text>

            <ConsentRow
              label="Live voice processing"
              description="Required for speaking to a character. Without it you can still type your turns."
              value={voiceConsent}
              onChange={setVoiceConsent}
            />

            <ConsentRow
              label="Conversation analysis"
              description="Lets the app check your transcript for phrases you produced, which is how progress is measured. Without it, sessions are still saved but no evidence is recorded."
              value={analysisConsent}
              onChange={setAnalysisConsent}
            />

            <Text className="text-xs text-muted">Consent version {CONSENT_VERSION}</Text>
          </Card>

          <Button
            label="Start practising"
            onPress={handleContinue}
            size="lg"
          />
      </ScrollView>
    </SafeAreaView>
  );
}

interface ConsentRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

const ConsentRow: React.FC<ConsentRowProps> = ({ label, description, value, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-2 rounded-xl border border-border-subtle bg-surface p-3">
      <Text
        className="text-xs font-semibold text-ink"
        onPress={() => setOpen(prev => !prev)}
        accessibilityRole="button"
      >
        {label} {open ? '▾' : '▸'}
      </Text>
      {open ? <Text className="text-xs leading-relaxed text-body">{description}</Text> : null}
      <Button
        label={value ? 'Agreed' : 'Not agreed'}
        onPress={() => onChange(!value)}
        variant={value ? 'primary' : 'secondary'}
        size="sm"
        className="self-start"
      />
    </View>
  );
};
