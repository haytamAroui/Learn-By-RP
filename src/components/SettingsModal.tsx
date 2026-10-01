import React, { useState } from 'react';
import { Platform, Pressable, Switch, Text, View } from 'react-native';
import { AlertTriangle, CheckCircle2, Download, Monitor, Moon, Shield, Sun, Trash2, Upload, Volume2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { UserPreferences, LanguageCode, UiLanguage, Mode } from '../types';
import { archiveRepository } from '../features/archive/archiveRepository';
import { useI18n, getTranslations } from '../features/i18n';
import { useTheme } from '../features/theme';
import { ThemePreference } from '../lib/themePreference';

/**
 * Appearance is a three-way choice. `system` is a real mode, so the option must
 * exist here rather than being inferred from whichever theme is currently
 * showing.
 */
const APPEARANCE_OPTIONS: Array<{
  id: ThemePreference;
  label: string;
  Icon: typeof Sun;
}> = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'system', label: 'System', Icon: Monitor },
];
import { shareTextFile } from '../lib/share';
import { Button, ChipRow, SectionLabel } from './ui';
import { Sheet, ConfirmDialog } from './Sheet';
import { iconColor } from '../design/iconColor';

interface SettingsModalProps {
  visible: boolean;
  preferences: UserPreferences;
  onSavePreferences: (prefs: UserPreferences) => void;
  onClearAllData: () => void;
  onDataRestored?: () => void;
  onClose: () => void;
}

const TARGET_LANGUAGE_FLAGS: Record<LanguageCode, string> = {
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  ja: '🇯🇵',
};

const UI_LANGUAGE_FLAGS: Record<UiLanguage, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  es: '🇪🇸',
  nl: '🇳🇱',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  preferences,
  onSavePreferences,
  onClearAllData,
  onDataRestored,
  onClose,
}) => {
  const { setLanguage: setGlobalUiLanguage } = useI18n();
  const { isDark, preference, setPreference } = useTheme();
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<{ text: string; success: boolean } | null>(null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  React.useEffect(() => {
    if (visible) {
      setPrefs(preferences);
      setExportNotice(null);
      setImportNotice(null);
      setConfirmClear(false);
    }
  }, [visible, preferences]);

  // Preview translations follow the currently selected explanation language.
  const t = getTranslations(prefs.explanationLanguage);

  const patch = (updates: Partial<UserPreferences>) => {
    setPrefs(prev => ({ ...prev, ...updates }));
  };

  const handleExportJson = async () => {
    const json = await archiveRepository.exportArchiveJson();
    const result = await shareTextFile(
      `mission-coach-archive-${new Date().toISOString().slice(0, 10)}.json`,
      json,
      'application/json'
    );
    if (result.ok) {
      setExportNotice(t.recap.downloadSuccess || 'Archive exported.');
    } else {
      setExportNotice('Export failed.');
    }
  };

  const handleImportFile = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (picked.canceled) return;

      const asset = picked.assets?.[0];
      if (!asset) return;

      const content = await readPickedFile(asset);
      const res = await archiveRepository.importArchiveJson(content);

      if (res.success) {
        const restored = await archiveRepository.getPreferences();
        setPrefs(restored);
        setGlobalUiLanguage(restored.explanationLanguage);
        setImportNotice({ text: res.message, success: true });
        onDataRestored?.();
      } else {
        setImportNotice({ text: res.message, success: false });
      }
    } catch (e) {
      setImportNotice({
        text: e instanceof Error ? e.message : 'Failed to read archive file.',
        success: false,
      });
    }
  };

  const handleSave = () => {
    void archiveRepository.savePreferences(prefs);
    onSavePreferences(prefs);
    setGlobalUiLanguage(prefs.explanationLanguage);
    onClose();
  };

  return (
    <>
      <Sheet
        visible={visible}
        onClose={onClose}
        title={t.settings.title}
        footer={
          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <Button label={t.common.cancel} onPress={onClose} variant="secondary" size="sm" />
            </View>
            <View className="flex-1">
              <Button label={t.settings.saveButton} onPress={handleSave} size="sm" />
            </View>
          </View>
        }
      >
        <View className="gap-2">
          <SectionLabel>Appearance</SectionLabel>
          <View className="flex-row gap-2.5">
            {APPEARANCE_OPTIONS.map(option => {
              // Selection is by saved preference, not by resolved theme: on
              // "System" with a dark device, two options would otherwise light up.
              const isActive = preference === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setPreference(option.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={option.label}
                  className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border p-3 focus:border-2 focus:border-focus ${
                    isActive ? 'border-primary bg-card-warm' : 'border-border-subtle bg-surface'
                  }`}
                >
                  <option.Icon
                    size={16}
                    color={isActive ? iconColor('brand') : iconColor('muted')}
                  />
                  <Text
                    className={`text-xs font-medium ${
                      isActive ? 'font-semibold text-primary' : 'text-muted'
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {preference === 'system' ? (
            <Text className="text-xs text-muted">
              Following your device{isDark ? ' (dark)' : ' (light)'}.
            </Text>
          ) : null}
        </View>

        <View className="gap-3">
          <SectionLabel>{t.settings.sectionLang}</SectionLabel>

          <View className="gap-1.5">
            <Text className="text-xs font-medium text-ink">{t.settings.targetLangLabel}</Text>
            <ChipRow
              value={prefs.learningLanguage}
              onChange={id => patch({ learningLanguage: id as LanguageCode })}
              options={(Object.keys(TARGET_LANGUAGE_FLAGS) as LanguageCode[]).map(id => ({
                id,
                label: `${TARGET_LANGUAGE_FLAGS[id]} ${t.languages[id]}`,
              }))}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-medium text-ink">{t.settings.uiLangLabel}</Text>
            <ChipRow
              value={prefs.explanationLanguage}
              onChange={id => {
                const newUi = id as UiLanguage;
                patch({ explanationLanguage: newUi });
                setGlobalUiLanguage(newUi);
              }}
              options={(Object.keys(UI_LANGUAGE_FLAGS) as UiLanguage[]).map(id => ({
                id,
                label: `${UI_LANGUAGE_FLAGS[id]} ${t.languages[id]}`,
              }))}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-medium text-ink">{t.settings.comfortLabel}</Text>
            <ChipRow
              value={prefs.comfortLevel}
              onChange={id => patch({ comfortLevel: id as UserPreferences['comfortLevel'] })}
              options={[
                { id: 'beginner', label: t.settings.comfortBeginner },
                { id: 'elementary', label: t.settings.comfortElementary },
                { id: 'intermediate', label: t.settings.comfortIntermediate },
                { id: 'not_sure', label: t.settings.comfortNotSure },
              ]}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-medium text-ink">{t.settings.goalLabel}</Text>
            <ChipRow
              value={prefs.primaryGoal}
              onChange={id => patch({ primaryGoal: id as UserPreferences['primaryGoal'] })}
              options={[
                { id: 'travel', label: t.settings.goalTravel },
                { id: 'relocation', label: t.settings.goalRelocation },
                { id: 'work', label: t.settings.goalWork },
                { id: 'social', label: t.settings.goalSocial },
                { id: 'explore', label: t.settings.goalExplore },
              ]}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-medium text-ink">{t.settings.modeLabel}</Text>
            <ChipRow
              value={prefs.modeDefault}
              onChange={id => patch({ modeDefault: id as Mode })}
              options={[
                { id: 'guided', label: t.modes.guided },
                { id: 'immersion', label: t.modes.immersion },
                { id: 'focused', label: t.modes.focused },
              ]}
            />
          </View>
        </View>

        <View className="gap-3 rounded-2xl border border-border-subtle bg-surface-sunken p-4">
          <View className="flex-row items-center gap-1.5">
            <Volume2 size={16} color={iconColor('brand')} />
            <Text className="text-xs font-semibold text-ink">{t.settings.sectionVoice}</Text>
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-medium text-ink">{t.settings.speechSpeedLabel}</Text>
            <ChipRow
              value={String(prefs.speechRate ?? 1.0)}
              onChange={id => patch({ speechRate: parseFloat(id) })}
              options={[
                { id: '0.8', label: t.settings.speedSlower },
                { id: '1.0', label: t.settings.speedNatural },
                { id: '1.2', label: t.settings.speedBrisk },
              ]}
            />
          </View>

          <ToggleRow
            label={t.settings.autoPlayLabel}
            value={prefs.autoPlaySpeech}
            onChange={next => patch({ autoPlaySpeech: next })}
          />
        </View>

        <View className="gap-3 rounded-2xl border border-border-subtle bg-surface-sunken p-4">
          <View className="flex-row items-center gap-1.5">
            <Shield size={16} color={iconColor('brand')} />
            <Text className="text-xs font-semibold text-ink">{t.settings.sectionPrivacy}</Text>
          </View>

          <Text className="text-xs leading-relaxed text-body">
            {t.settings.privacyDisclosure}
          </Text>

          <ToggleRow
            label={t.settings.liveVoiceLabel}
            description={t.settings.liveVoiceDesc}
            value={prefs.voiceProcessingConsent}
            onChange={next => patch({ voiceProcessingConsent: next })}
          />
          <ToggleRow
            label={t.settings.savedAnalysisLabel}
            description={t.settings.savedAnalysisDesc}
            value={prefs.savedAnalysisConsent}
            onChange={next => patch({ savedAnalysisConsent: next })}
          />
        </View>

        <View className="gap-3">
          <SectionLabel>{t.settings.sectionArchive}</SectionLabel>

          <View className="gap-2.5">
            <View className="gap-2.5 rounded-2xl border border-border-subtle bg-surface p-4">
              <Text className="text-xs font-medium text-ink">
                {t.settings.exportArchiveTitle}
              </Text>
              <Text className="text-xs text-muted">{t.settings.exportArchiveDesc}</Text>
              <Button
                label={t.settings.exportArchiveButton}
                onPress={handleExportJson}
                variant="secondary"
                size="sm"
                className="self-start"
                icon={<Download size={14} color={iconColor('muted')} />}
              />
            </View>

            <View className="gap-2.5 rounded-2xl border border-border-subtle bg-surface p-4">
              <Text className="text-xs font-medium text-ink">
                {t.settings.restoreArchiveTitle}
              </Text>
              <Text className="text-xs text-muted">{t.settings.restoreArchiveDesc}</Text>
              <Button
                label={t.settings.restoreArchiveButton}
                onPress={handleImportFile}
                variant="secondary"
                size="sm"
                className="self-start"
                icon={<Upload size={14} color={iconColor('muted')} />}
              />
            </View>
          </View>

          {exportNotice ? (
            <View className="flex-row items-center gap-1.5">
              <CheckCircle2 size={14} color={iconColor('success')} />
              <Text className="text-xs font-medium text-accent-sage">{exportNotice}</Text>
            </View>
          ) : null}

          {importNotice ? (
            <View className="flex-row items-center gap-1.5">
              {importNotice.success ? (
                <CheckCircle2 size={14} color={iconColor('success')} />
              ) : (
                <AlertTriangle size={14} color={iconColor('danger')} />
              )}
              <Text
                className={`flex-1 text-xs font-medium ${
                  importNotice.success ? 'text-accent-sage' : 'text-danger'
                }`}
              >
                {importNotice.text}
              </Text>
            </View>
          ) : null}

          <View className="gap-2 rounded-2xl border border-danger/20 bg-danger-soft p-4">
            <Text className="text-xs font-medium text-danger">{t.settings.eraseTitle}</Text>
            <Text className="text-xs text-danger">{t.settings.eraseDesc}</Text>
            <Button
              label={t.settings.eraseButton}
              onPress={() => setConfirmClear(true)}
              variant="danger"
              size="sm"
              className="self-start"
              icon={<Trash2 size={14} color={iconColor('danger')} />}
            />
          </View>
        </View>
      </Sheet>

      <ConfirmDialog
        visible={confirmClear}
        title={t.settings.eraseTitle}
        message={t.settings.eraseDesc}
        confirmLabel={t.settings.eraseConfirm}
        cancelLabel={t.common.cancel}
        destructive
        onConfirm={() => {
          onClearAllData();
          setConfirmClear(false);
          onClose();
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  );
};

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, value, onChange }) => (
  <View className="flex-row items-center justify-between gap-3">
    <View className="flex-1">
      <Text className="text-xs font-medium text-ink">{label}</Text>
      {description ? <Text className="text-xs text-muted">{description}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: iconColor('borderSubtle'), true: iconColor('brandButton') }}
      thumbColor="#ffffff"
      accessibilityLabel={label}
    />
  </View>
);

async function readPickedFile(asset: DocumentPicker.DocumentPickerAsset): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);
    return response.text();
  }

  const file = new File(asset.uri);
  return file.text();
}
