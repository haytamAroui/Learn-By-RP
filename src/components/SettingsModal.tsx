import React, { useState, useRef } from 'react';
import { Shield, Download, Upload, Trash2, CheckCircle2, AlertTriangle, Volume2, Globe, Sparkles, Sun, Moon } from 'lucide-react';
import { UserPreferences, LanguageCode, UiLanguage, Mode } from '../types';
import { ArchiveStorage } from '../features/archive/storage';
import { useI18n, getTranslations } from '../features/i18n';
import { useTheme } from '../features/theme';

interface SettingsModalProps {
  preferences: UserPreferences;
  onSavePreferences: (prefs: UserPreferences) => void;
  onClearAllData: () => void;
  onDataRestored?: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  preferences,
  onSavePreferences,
  onClearAllData,
  onDataRestored,
  onClose
}) => {
  const { setLanguage: setGlobalUiLanguage } = useI18n();
  const { isDark, toggleTheme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<{ text: string; success: boolean } | null>(null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic preview translations based on currently selected explanationLanguage
  const t = getTranslations(prefs.explanationLanguage);

  const handleExportJson = () => {
    const json = ArchiveStorage.exportArchiveJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mission-coach-archive-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExportNotice(t.recap.downloadSuccess || 'Archive downloaded.');
    setTimeout(() => setExportNotice(null), 3500);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = ArchiveStorage.importArchiveJson(content);
      if (res.success) {
        setImportNotice({ text: res.message, success: true });
        const restored = ArchiveStorage.getPreferences();
        setPrefs(restored);
        setGlobalUiLanguage(restored.explanationLanguage);
        if (onDataRestored) onDataRestored();
      } else {
        setImportNotice({ text: res.message, success: false });
      }
      setTimeout(() => setImportNotice(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSave = () => {
    onSavePreferences(prefs);
    ArchiveStorage.savePreferences(prefs);
    setGlobalUiLanguage(prefs.explanationLanguage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-2xl sm:rounded-2xl bg-surface border border-border-subtle shadow-2xl overflow-hidden text-heading">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t.settings.subtitle}
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-heading">
              {t.settings.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-heading"
            aria-label={t.common.close}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 text-xs text-heading">
          {/* Theme & Display Mode */}
          <div className="space-y-3">
            <h3 className="font-semibold uppercase tracking-wider text-muted">
              Appearance
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-medium transition-all ${
                  !isDark
                    ? 'border-primary bg-card-warm text-primary font-semibold ring-1 ring-primary'
                    : 'border-border-subtle bg-surface text-muted hover:text-heading'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>Light (Warm Ivory)</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-medium transition-all ${
                  isDark
                    ? 'border-primary bg-card-warm text-primary font-semibold ring-1 ring-primary'
                    : 'border-border-subtle bg-surface text-muted hover:text-heading'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>Dark (Anthropic Slate)</span>
              </button>
            </div>
          </div>

          {/* Language setup */}
          <div className="space-y-3">
            <h3 className="font-semibold uppercase tracking-wider text-muted">
              {t.settings.sectionLang}
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="font-medium text-heading">{t.settings.targetLangLabel}</label>
                <select
                  value={prefs.learningLanguage}
                  onChange={e =>
                    setPrefs({ ...prefs, learningLanguage: e.target.value as LanguageCode })
                  }
                  className="mt-1 w-full rounded-xl border border-border-subtle bg-surface-sunken p-2.5 text-xs font-medium text-heading cursor-pointer focus:border-primary focus:outline-none"
                >
                  <option value="es">🇪🇸 {t.languages.es}</option>
                  <option value="fr">🇫🇷 {t.languages.fr}</option>
                  <option value="de">🇩🇪 {t.languages.de}</option>
                  <option value="it">🇮🇹 {t.languages.it}</option>
                  <option value="ja">🇯🇵 {t.languages.ja}</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-heading">{t.settings.uiLangLabel}</label>
                <select
                  value={prefs.explanationLanguage}
                  onChange={e => {
                    const newUi = e.target.value as UiLanguage;
                    setPrefs({ ...prefs, explanationLanguage: newUi });
                    setGlobalUiLanguage(newUi);
                  }}
                  className="mt-1 w-full rounded-xl border border-border-subtle bg-surface-sunken p-2.5 text-xs font-medium text-heading cursor-pointer focus:border-primary focus:outline-none"
                >
                  <option value="en">🇬🇧 {t.languages.en}</option>
                  <option value="fr">🇫🇷 {t.languages.fr}</option>
                  <option value="es">🇪🇸 {t.languages.es}</option>
                  <option value="nl">🇳🇱 {t.languages.nl}</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="font-medium text-heading">{t.settings.comfortLabel}</label>
                <select
                  value={prefs.comfortLevel}
                  onChange={e =>
                    setPrefs({ ...prefs, comfortLevel: e.target.value as any })
                  }
                  className="mt-1 w-full rounded-xl border border-border-subtle bg-surface-sunken p-2.5 text-xs text-heading cursor-pointer focus:border-primary focus:outline-none"
                >
                  <option value="beginner">{t.settings.comfortBeginner}</option>
                  <option value="elementary">{t.settings.comfortElementary}</option>
                  <option value="intermediate">{t.settings.comfortIntermediate}</option>
                  <option value="not_sure">{t.settings.comfortNotSure}</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-heading">{t.settings.goalLabel}</label>
                <select
                  value={prefs.primaryGoal}
                  onChange={e =>
                    setPrefs({ ...prefs, primaryGoal: e.target.value as any })
                  }
                  className="mt-1 w-full rounded-xl border border-border-subtle bg-surface-sunken p-2.5 text-xs text-heading cursor-pointer focus:border-primary focus:outline-none"
                >
                  <option value="travel">{t.settings.goalTravel}</option>
                  <option value="relocation">{t.settings.goalRelocation}</option>
                  <option value="work">{t.settings.goalWork}</option>
                  <option value="social">{t.settings.goalSocial}</option>
                  <option value="explore">{t.settings.goalExplore}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-medium text-heading">{t.settings.modeLabel}</label>
              <select
                value={prefs.modeDefault}
                onChange={e => setPrefs({ ...prefs, modeDefault: e.target.value as Mode })}
                className="mt-1 w-full rounded-xl border border-border-subtle bg-surface-sunken p-2.5 text-xs text-heading cursor-pointer focus:border-primary focus:outline-none"
              >
                <option value="guided">{t.modes.guided}</option>
                <option value="immersion">{t.modes.immersion}</option>
                <option value="focused">{t.modes.focused}</option>
              </select>
            </div>
          </div>

          {/* Voice & Audio Settings */}
          <div className="space-y-3 rounded-2xl bg-surface-sunken p-4 border border-border-subtle">
            <div className="flex items-center gap-1.5 font-semibold text-heading">
              <Volume2 className="h-4 w-4 text-primary" />
              <span>{t.settings.sectionVoice}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div>
                <label className="font-medium text-heading">{t.settings.speechSpeedLabel}</label>
                <select
                  value={prefs.speechRate ?? 1.0}
                  onChange={e =>
                    setPrefs({ ...prefs, speechRate: parseFloat(e.target.value) })
                  }
                  className="mt-1 w-full rounded-xl border border-border-subtle bg-surface p-2.5 text-xs text-heading cursor-pointer focus:border-primary focus:outline-none"
                >
                  <option value="0.8">{t.settings.speedSlower}</option>
                  <option value="1.0">{t.settings.speedNatural}</option>
                  <option value="1.2">{t.settings.speedBrisk}</option>
                </select>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={prefs.autoPlaySpeech}
                    onChange={e =>
                      setPrefs({ ...prefs, autoPlaySpeech: e.target.checked })
                    }
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-heading">{t.settings.autoPlayLabel}</span>
                </label>
              </div>
            </div>
          </div>

          {/* AI Privacy & Processing Consent */}
          <div className="space-y-3 rounded-2xl bg-surface-sunken p-4 border border-border-subtle">
            <div className="flex items-center gap-1.5 font-semibold text-heading">
              <Shield className="h-4 w-4 text-primary" />
              <span>{t.settings.sectionPrivacy}</span>
            </div>

            <p className="text-[11px] leading-relaxed text-body">
              {t.settings.privacyDisclosure}
            </p>

            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.voiceProcessingConsent}
                  onChange={e =>
                    setPrefs({ ...prefs, voiceProcessingConsent: e.target.checked })
                  }
                  className="mt-0.5 rounded text-primary focus:ring-primary"
                />
                <div>
                  <div className="font-medium text-heading">{t.settings.liveVoiceLabel}</div>
                  <div className="text-[11px] text-muted">
                    {t.settings.liveVoiceDesc}
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.savedAnalysisConsent}
                  onChange={e =>
                    setPrefs({ ...prefs, savedAnalysisConsent: e.target.checked })
                  }
                  className="mt-0.5 rounded text-primary focus:ring-primary"
                />
                <div>
                  <div className="font-medium text-heading">{t.settings.savedAnalysisLabel}</div>
                  <div className="text-[11px] text-muted">
                    {t.settings.savedAnalysisDesc}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* On-device export & data rights */}
          <div className="space-y-3">
            <h3 className="font-semibold uppercase tracking-wider text-muted">
              {t.settings.sectionArchive}
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col justify-between rounded-2xl border border-border-subtle p-4 bg-surface">
                <div>
                  <div className="font-medium text-heading">{t.settings.exportArchiveTitle}</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {t.settings.exportArchiveDesc}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-surface-sunken px-3 py-2 text-xs font-semibold text-heading hover:bg-surface-hover shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{t.settings.exportArchiveButton}</span>
                </button>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-border-subtle p-4 bg-surface">
                <div>
                  <div className="font-medium text-heading">{t.settings.restoreArchiveTitle}</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {t.settings.restoreArchiveDesc}
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-surface-sunken px-3 py-2 text-xs font-semibold text-heading hover:bg-surface-hover shadow-2xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{t.settings.restoreArchiveButton}</span>
                </button>
              </div>
            </div>

            {exportNotice && (
              <div className="text-xs text-accent-sage font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{exportNotice}</span>
              </div>
            )}

            {importNotice && (
              <div className={`text-xs font-medium flex items-center gap-1.5 ${importNotice.success ? 'text-accent-sage' : 'text-red-500'}`}>
                {importNotice.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                <span>{importNotice.text}</span>
              </div>
            )}

            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 space-y-2">
              <div className="font-medium text-red-500">{t.settings.eraseTitle}</div>
              <div className="text-[11px] text-red-400">
                {t.settings.eraseDesc}
              </div>

              {confirmClear ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllData();
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    {t.settings.eraseConfirm}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="text-xs text-muted hover:text-heading"
                  >
                    {t.common.cancel}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-400 pt-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{t.settings.eraseButton}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-subtle bg-surface-sunken px-4 py-3 sm:px-6 sm:py-4 pb-safe">
          <button
            onClick={onClose}
            className="text-xs font-medium text-muted hover:text-heading transition-colors"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-primary px-5 sm:px-6 py-2 sm:py-2.5 text-xs font-semibold text-white hover:bg-primary-dark shadow-xs transition-all active:scale-95"
          >
            {t.settings.saveButton}
          </button>
        </div>
      </div>
    </div>
  );
};

