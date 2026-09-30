import React from 'react';
import { Compass, BookOpen, MessageSquare, BarChart2, Sliders, Globe, Sun, Moon, Sparkles } from 'lucide-react';
import { LanguageCode, UiLanguage } from '../types';
import { useI18n } from '../features/i18n';
import { useTheme } from '../features/theme';
import { TabType } from './BottomNav';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  learningLanguage: LanguageCode;
  onChangeLanguage?: (lang: LanguageCode) => void;
  uiLanguage?: UiLanguage;
  onChangeUiLanguage?: (lang: UiLanguage) => void;
  selectedLevel?: string;
  onChangeLevel?: (lvl: string) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  learningLanguage,
  onChangeLanguage,
  uiLanguage = 'en',
  onChangeUiLanguage,
  selectedLevel = 'all',
  onChangeLevel,
  onOpenSettings
}) => {
  const { t } = useI18n();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-canvas/90 backdrop-blur-md transition-colors duration-200">
      {/* Top Controls Row (Amiko Style) */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3 border-b border-border-subtle/40">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
            <Compass className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-display text-base sm:text-lg font-semibold tracking-tight text-heading truncate">
              {t.nav.brandTitle}
            </span>
          </div>
        </div>

        {/* Amiko Style Selectors (I Speak / I'm Learning / Level) */}
        <div className="hidden md:flex items-center gap-4">
          {/* I Speak */}
          {onChangeUiLanguage && (
            <label className="flex flex-col gap-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
              <span>I speak</span>
              <select
                value={uiLanguage}
                onChange={e => onChangeUiLanguage(e.target.value as UiLanguage)}
                className="rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs font-semibold text-heading focus:border-primary focus:outline-none cursor-pointer hover:border-primary/40 transition-colors"
                title="Select interface language"
              >
                <option value="en">🇬🇧 English</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="es">🇪🇸 Español</option>
                <option value="nl">🇳🇱 Nederlands</option>
              </select>
            </label>
          )}

          {/* I'm Learning */}
          {onChangeLanguage && (
            <label className="flex flex-col gap-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
              <span>I'm learning</span>
              <select
                value={learningLanguage}
                onChange={e => onChangeLanguage(e.target.value as LanguageCode)}
                className="rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs font-semibold text-heading focus:border-primary focus:outline-none cursor-pointer hover:border-primary/40 transition-colors"
                title="Select language to practice"
              >
                <option value="es">🇪🇸 Spanish</option>
                <option value="fr">🇫🇷 French</option>
                <option value="de">🇩🇪 German</option>
                <option value="it">🇮🇹 Italian</option>
                <option value="ja">🇯🇵 Japanese</option>
              </select>
            </label>
          )}

          {/* Level Filter */}
          {onChangeLevel && (
            <label className="flex flex-col gap-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
              <span>Level</span>
              <select
                value={selectedLevel}
                onChange={e => onChangeLevel(e.target.value)}
                className="rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs font-semibold text-heading focus:border-primary focus:outline-none cursor-pointer hover:border-primary/40 transition-colors"
                title="Filter by CEFR level"
              >
                <option value="all">All Levels</option>
                <option value="A1">L1 · A1 Beginner</option>
                <option value="A2">L2 · A2 Elementary</option>
                <option value="B1">L3 · B1 Intermediate</option>
              </select>
            </label>
          )}
        </div>

        {/* Right Actions: Practice status, Theme toggle, Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile target language selector */}
          <div className="md:hidden flex items-center">
            {onChangeLanguage && (
              <select
                value={learningLanguage}
                onChange={e => onChangeLanguage(e.target.value as LanguageCode)}
                className="rounded-lg border border-border-subtle bg-surface px-2 py-1 text-xs font-semibold text-heading focus:outline-none cursor-pointer"
                aria-label="Target language"
              >
                <option value="es">🇪🇸 ES</option>
                <option value="fr">🇫🇷 FR</option>
                <option value="de">🇩🇪 DE</option>
                <option value="it">🇮🇹 IT</option>
                <option value="ja">🇯🇵 JA</option>
              </select>
            )}
          </div>

          {/* Turns / Status badge (Amiko style) */}
          <span className="hidden lg:inline-flex items-center gap-1 rounded-full border border-border-subtle bg-card-warm px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3 w-3" />
            <span>AI Practice · Ready</span>
          </span>

          {/* Theme Toggle (Anthropic style Sun/Moon) */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface text-muted transition-colors hover:text-heading hover:bg-surface-hover active:scale-95"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-primary" />}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface text-muted transition-colors hover:text-heading hover:bg-surface-hover active:scale-95"
            title={t.nav.settingsTooltip}
            aria-label={t.nav.settingsTooltip}
          >
            <Sliders className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Row 2: Desktop Tabs Bar (Amiko app-tabs style) */}
      <div className="hidden md:flex mx-auto max-w-6xl px-6 pt-1">
        <nav aria-label="Main Navigation" className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-heading'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('characters')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-semibold transition-all ${
              activeTab === 'characters'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-heading'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Characters</span>
          </button>

          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-semibold transition-all ${
              activeTab === 'vocab'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-heading'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Vocabulary</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-semibold transition-all ${
              activeTab === 'progress'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-heading'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Progress & Evidence</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
