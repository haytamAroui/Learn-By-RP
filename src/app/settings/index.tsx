import React from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronRight,
  Monitor,
  Moon,
  Shield,
  Sun,
} from 'lucide-react-native';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { getTranslations } from '../../features/i18n';
import { useTheme } from '../../features/theme';
import { ThemePreference } from '../../lib/themePreference';
import {
  AccommodationKind,
  LanguageCode,
  Mode,
  UiLanguage,
  UserPreferences,
} from '../../types';
import { Button, ChipRow, SectionLabel } from '../../components/ui';
import { iconColor } from '../../design/iconColor';

const TARGET_LANGUAGE_FLAGS: Record<LanguageCode, string> = {
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  ja: '🇯🇵',
  nl: '🇧🇪',
};

const UI_LANGUAGE_FLAGS: Record<UiLanguage, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  es: '🇪🇸',
  nl: '🇳🇱',
};

const APPEARANCE_OPTIONS: Array<{
  id: ThemePreference;
  Icon: typeof Sun;
}> = [
  { id: 'light', Icon: Sun },
  { id: 'dark', Icon: Moon },
  { id: 'system', Icon: Monitor },
];

export default function SettingsScreen() {
  const router = useRouter();
  const archive = useArchive();
  const { preference, setPreference } = useTheme();
  const t = getTranslations(archive.preferences.explanationLanguage);

  const patch = (updates: Partial<UserPreferences>) =>
    void archive.savePreferences({ ...archive.preferences, ...updates });

  const toggleAccommodation = (kind: AccommodationKind, enabled: boolean) => {
    const current = new Set(archive.preferences.accommodations?.enabled ?? []);
    if (enabled) current.add(kind);
    else current.delete(kind);
    patch({ accommodations: { enabled: [...current] } });
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <View className="w-full self-center flex-row items-center gap-3 px-4 py-2" style={{ maxWidth: 1200 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          className="h-12 w-12 items-center justify-center rounded-full bg-surface-soft hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
        >
          <ArrowLeft size={21} color={iconColor('ink')} />
        </Pressable>
        <Text className="flex-1 text-2xl font-semibold tracking-tight text-ink">
          {t.settings.title}
        </Text>
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
          gap: 28,
        }}
      >
        <View className="gap-3">
          <SectionLabel>{t.settings.appearanceLabel}</SectionLabel>
          <View className="flex-row gap-2">
            {APPEARANCE_OPTIONS.map(option => {
              const selected = preference === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setPreference(option.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className={`min-h-12 flex-1 items-center justify-center gap-1 rounded-2xl border px-2 ${
                    selected
                      ? 'border-primary bg-card-warm'
                      : 'border-border-interactive bg-surface'
                  } hover:bg-surface-hover focus:border-2 focus:border-focus`}
                >
                  <option.Icon
                    size={18}
                    color={selected ? iconColor('brand') : iconColor('muted')}
                  />
                  <Text
                    className={`text-xs font-semibold ${
                      selected ? 'text-primary' : 'text-body'
                    }`}
                  >
                    {option.id === 'light'
                      ? t.settings.appearanceLight
                      : option.id === 'dark'
                        ? t.settings.appearanceDark
                        : t.settings.appearanceSystem}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-4">
          <SectionLabel>{t.settings.sectionLang}</SectionLabel>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink">{t.settings.targetLangLabel}</Text>
            <ChipRow
              value={archive.preferences.learningLanguage}
              onChange={id => patch({ learningLanguage: id as LanguageCode })}
              options={(Object.keys(TARGET_LANGUAGE_FLAGS) as LanguageCode[]).map(id => ({
                id,
                label: `${TARGET_LANGUAGE_FLAGS[id]} ${t.languages[id]}`,
              }))}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink">{t.settings.uiLangLabel}</Text>
            <ChipRow
              value={archive.preferences.explanationLanguage}
              onChange={id => patch({ explanationLanguage: id as UiLanguage })}
              options={(Object.keys(UI_LANGUAGE_FLAGS) as UiLanguage[]).map(id => ({
                id,
                label: `${UI_LANGUAGE_FLAGS[id]} ${t.languages[id]}`,
              }))}
            />
          </View>
        </View>

        <View className="gap-4">
          <SectionLabel>{t.settings.modeLabel}</SectionLabel>
          <ChipRow
            value={archive.preferences.modeDefault}
            onChange={id => patch({ modeDefault: id as Mode })}
            options={[
              { id: 'guided', label: t.modes.guided.split(' (')[0] },
              { id: 'immersion', label: t.modes.immersion.split(' (')[0] },
              { id: 'focused', label: t.modes.focused.split(' (')[0] },
            ]}
          />
        </View>

        <View className="gap-4">
          <SectionLabel>{t.settings.sectionVoice}</SectionLabel>
          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink">{t.settings.speechSpeedLabel}</Text>
            <ChipRow
              value={String(archive.preferences.speechRate ?? 1)}
              onChange={id => patch({ speechRate: Number(id) })}
              options={[
                { id: '0.8', label: t.settings.speedSlower },
                { id: '1', label: t.settings.speedNatural },
                { id: '1.2', label: t.settings.speedBrisk },
              ]}
            />
          </View>

          <View className="min-h-12 flex-row items-center justify-between gap-4">
            <Text className="flex-1 text-sm font-medium text-ink">{t.settings.autoPlayLabel}</Text>
            <Switch
              value={archive.preferences.autoPlaySpeech}
              onValueChange={value => patch({ autoPlaySpeech: value })}
              trackColor={{
                false: iconColor('borderSubtle'),
                true: iconColor('brandButton'),
              }}
              thumbColor={iconColor('brandText')}
              accessibilityLabel={t.settings.autoPlayLabel}
            />
          </View>
        </View>

        <View className="gap-4">
          <SectionLabel>{t.settings.accommodationsLabel}</SectionLabel>
          {([
            ['captions_always', t.settings.captionsAlwaysLabel],
            ['slower_speech_default', t.settings.slowerSpeechDefaultLabel],
            ['typed_preferred', t.settings.typedPreferredLabel],
            ['haptic_turn_cues', t.settings.hapticTurnCuesLabel],
          ] as Array<[AccommodationKind, string]>).map(([kind, label]) => (
            <View key={kind} className="min-h-12 flex-row items-center justify-between gap-4">
              <Text className="flex-1 text-sm font-medium text-ink">{label}</Text>
              <Switch
                value={(archive.preferences.accommodations?.enabled ?? []).includes(kind)}
                onValueChange={value => toggleAccommodation(kind, value)}
                trackColor={{
                  false: iconColor('borderSubtle'),
                  true: iconColor('brandButton'),
                }}
                thumbColor={iconColor('brandText')}
                accessibilityLabel={label}
              />
            </View>
          ))}
        </View>

        <View className="gap-3">
          <SectionLabel>{t.settings.sectionPrivacy}</SectionLabel>
          <Pressable
            onPress={() => router.push('/settings/privacy')}
            accessibilityRole="button"
            className="min-h-[72px] flex-row items-center gap-3 rounded-2xl bg-surface-soft px-4 py-3 hover:bg-surface-hover active:opacity-75 focus:border-2 focus:border-focus"
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-card-warm">
              <Shield size={20} color={iconColor('brand')} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-ink">{t.settings.sectionPrivacy}</Text>
              <Text className="mt-0.5 text-xs leading-5 text-muted" numberOfLines={2}>
                {t.settings.privacyDisclosure}
              </Text>
            </View>
            <ChevronRight size={20} color={iconColor('muted')} />
          </Pressable>
        </View>

        <Button
          label={t.common.back}
          onPress={() => router.back()}
          variant="ghost"
          className="self-start"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
