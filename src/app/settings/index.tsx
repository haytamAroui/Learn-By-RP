import React from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { Text } from '../../components/AppText';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronRight,
  Monitor,
  Moon,
  Shield,
  Sun,
  Volume2,
} from 'lucide-react-native';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { AVATARS } from '../../features/avatar/avatarCatalog';
import { getTranslations } from '../../features/i18n';
import { useTheme } from '../../features/theme';
import { ThemePreference } from '../../lib/themePreference';
import {
  DUTCH_REGIONAL_PROFILES,
  DutchRegionalProfileId,
} from '../../content/regionalProfiles';
import { speakWithBestAvailable } from '../../providers/voice/speechOutput';
import { NativeVoiceTransport } from '../../providers/voice/nativeVoiceTransport';
import {
  AccommodationKind,
  LanguageCode,
  Mode,
  UiLanguage,
  UserPreferences,
} from '../../types';
import { Button, ChipRow, SectionLabel } from '../../components/ui';
import { iconColor } from '../../design/iconColor';

const TARGET_LANGUAGE_FLAGS: Partial<Record<LanguageCode, string>> = {
  nl: '🇧🇪',
};

const UI_LANGUAGE_FLAGS: Partial<Record<UiLanguage, string>> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  nl: '🇧🇪',
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
  const [auditioningProfileId, setAuditioningProfileId] = React.useState<string | null>(null);
  const voiceTransportRef = React.useRef<NativeVoiceTransport | null>(null);

  const auditionProfile = async (profile: (typeof DUTCH_REGIONAL_PROFILES)[number]) => {
    try {
      setAuditioningProfileId(profile.id);
      if (!voiceTransportRef.current) {
        voiceTransportRef.current = new NativeVoiceTransport(() => true);
      }
      await speakWithBestAvailable(voiceTransportRef.current, profile.sampleText, {
        language: 'nl',
        locale: 'nl-BE',
        speed: archive.preferences.speechRate ?? 1,
        voiceGender: profile.defaultVoiceGender,
        style: profile.stylePrompt,
      });
    } catch (e) {
      console.warn('Audition failed:', e);
    } finally {
      setAuditioningProfileId(null);
    }
  };

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
        showsVerticalScrollIndicator={true}
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
        <View className="gap-3 rounded-[26px] border border-border-subtle/40 bg-surface p-4">
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
                      ? 'border-language bg-language-soft'
                      : 'border-border-interactive bg-surface'
                  } hover:bg-surface-hover focus:border-2 focus:border-focus`}
                >
                  <option.Icon
                    size={18}
                    color={selected ? iconColor('language') : iconColor('muted')}
                  />
                  <Text
                    className={`text-xs font-semibold ${
                      selected ? 'text-language' : 'text-body'
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

        <View className="gap-4 rounded-[26px] border border-border-subtle/40 bg-surface p-4">
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

        <View className="gap-4 rounded-[26px] border border-border-subtle/40 bg-surface p-4">
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

        <View className="gap-4 rounded-[26px] border border-border-subtle/40 bg-surface p-4">
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

          {archive.preferences.learningLanguage === 'nl' && (
            <View className="gap-3 pt-3 border-t border-border-subtle/30">
              <View className="gap-1">
                <Text className="text-sm font-semibold text-ink">
                  {t.settings.regionalProfileLabel}
                </Text>
                <Text className="text-xs leading-5 text-muted">
                  {t.settings.regionalProfileDesc}
                </Text>
              </View>

              <View className="gap-2.5">
                {DUTCH_REGIONAL_PROFILES.map(profile => {
                  const selected =
                    (archive.preferences.dutchRegionalProfile ?? 'vrt_standard') === profile.id;
                  const isAuditioning = auditioningProfileId === profile.id;

                  return (
                    <Pressable
                      key={profile.id}
                      onPress={() => patch({ dutchRegionalProfile: profile.id })}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${profile.name}, ${profile.tag}`}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        selected
                          ? 'border-brand-primary bg-surface-soft/80'
                          : 'border-border-subtle/40 bg-surface hover:bg-surface-soft/40'
                      }`}
                    >
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1 gap-1">
                          <View className="flex-row items-center gap-2 flex-wrap">
                            <Text className="text-sm font-bold text-ink">
                              {profile.name}
                            </Text>
                            <View className="px-2 py-0.5 rounded-full bg-surface-soft border border-border-subtle/50">
                              <Text className="text-xs font-semibold text-muted">
                                {profile.tag}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-xs text-brand-primary font-medium">
                            {profile.region}
                          </Text>
                          <Text className="text-xs text-muted leading-4 mt-0.5">
                            {profile.description}
                          </Text>
                        </View>

                        <Pressable
                          onPress={e => {
                            e.stopPropagation();
                            void auditionProfile(profile);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`${t.settings.auditionButtonLabel}: ${profile.name}`}
                          className={`min-h-12 px-3 rounded-xl flex-row items-center gap-1.5 self-center active:scale-95 ${
                            isAuditioning
                              ? 'bg-brand-primary'
                              : 'bg-surface-soft hover:bg-surface-hover border border-border-subtle/50'
                          }`}
                        >
                          <Volume2
                            size={16}
                            color={iconColor(isAuditioning ? 'brandText' : 'ink')}
                          />
                          <Text
                            className={`text-xs font-semibold ${
                              isAuditioning ? 'text-brandText' : 'text-ink'
                            }`}
                          >
                            {isAuditioning
                              ? t.settings.auditioningLabel
                              : t.settings.auditionButtonLabel}
                          </Text>
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <View className="gap-3 rounded-[26px] border border-border-subtle/40 bg-surface p-4">
          <SectionLabel>{t.settings.tutorLabel}</SectionLabel>
          <Text className="text-sm leading-6 text-muted">{t.settings.tutorDesc}</Text>
          <ChipRow
            options={[
              { id: '', label: t.settings.tutorAutoLabel },
              ...AVATARS.map(avatar => ({ id: avatar.id, label: avatar.label })),
            ]}
            value={archive.preferences.preferredAvatarId ?? ''}
            onChange={id => patch({ preferredAvatarId: id || undefined })}
          />
        </View>

        <View className="gap-4 rounded-[26px] border border-border-subtle/40 bg-surface p-4">
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

        <View className="gap-3 rounded-[26px] border border-border-subtle/40 bg-surface p-4">
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
