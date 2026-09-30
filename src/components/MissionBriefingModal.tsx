import React, { useState } from 'react';
import { ArrowLeft, Mic, Eye, EyeOff, ShieldCheck, Play, Sparkles } from 'lucide-react';
import { MissionDefinition, Mode } from '../types';
import { useI18n } from '../features/i18n';

interface MissionBriefingModalProps {
  mission: MissionDefinition;
  initialMode: Mode;
  onClose: () => void;
  onStartSession: (mission: MissionDefinition, mode: Mode, isColdAttempt: boolean) => void;
}

export const MissionBriefingModal: React.FC<MissionBriefingModalProps> = ({
  mission,
  initialMode,
  onClose,
  onStartSession
}) => {
  const { t } = useI18n();
  const [selectedMode, setSelectedMode] = useState<Mode>(initialMode);
  const [coldAttempt, setColdAttempt] = useState<boolean>(true);

  const modeDescriptions: Record<Mode, { title: string; desc: string }> = {
    guided: {
      title: t.modes.guided,
      desc: t.modes.guidedDesc
    },
    immersion: {
      title: t.modes.immersion,
      desc: t.modes.immersionDesc
    },
    focused: {
      title: t.modes.focused,
      desc: t.modes.focusedDesc
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl sm:rounded-2xl bg-surface border border-border-subtle shadow-2xl overflow-hidden text-heading">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 sm:px-6 sm:py-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-heading transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t.common.back}</span>
          </button>
          <div className="text-xs text-muted flex items-center gap-1.5">
            <span className="font-semibold text-heading">{mission.neighborhood}</span>
            <span>·</span>
            <span>{mission.estimatedMinutes} {t.common.minutes}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {t.briefing.tag}
            </span>
            <h2 className="mt-1 font-display text-xl sm:text-3xl font-bold text-heading">
              {mission.title}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-body">
              {mission.setting}
            </p>
          </div>

          {/* Character & Goals Box */}
          <div className="rounded-2xl bg-surface-sunken p-4 text-xs space-y-3 border border-border-subtle">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-semibold text-heading">{t.briefing.withWhom} </span>
                <span className="text-body">{mission.character.name} ({mission.character.role})</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-heading">
                <strong>{t.briefing.primaryGoal} </strong>
                <span>{mission.learnerGoal}</span>
              </div>
              {mission.stretchGoal && (
                <div className="text-muted">
                  <strong>{t.briefing.stretchChallenge} </strong>
                  <span>{mission.stretchGoal}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t.briefing.selectMode}
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {(['guided', 'immersion', 'focused'] as Mode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSelectedMode(mode)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    selectedMode === mode
                      ? 'border-primary bg-card-warm ring-1 ring-primary'
                      : 'border-border-subtle bg-surface hover:border-primary/40'
                  }`}
                >
                  <div className="text-xs font-semibold text-heading">
                    {modeDescriptions[mode].title}
                  </div>
                  <div className="mt-1 text-[11px] text-body">
                    {modeDescriptions[mode].desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cold Attempt & Useful Phrases Ledger */}
          <div className="space-y-3 rounded-2xl border border-border-subtle bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {coldAttempt ? (
                  <EyeOff className="h-4 w-4 text-accent-sage" />
                ) : (
                  <Eye className="h-4 w-4 text-primary" />
                )}
                <div>
                  <div className="text-xs font-semibold text-heading">
                    {coldAttempt ? t.briefing.coldAttemptTitle : t.briefing.previewPhrasesTitle}
                  </div>
                  <div className="text-[11px] text-muted">
                    {coldAttempt
                      ? t.briefing.coldAttemptDesc
                      : t.briefing.previewPhrasesDesc}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setColdAttempt(!coldAttempt)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  coldAttempt
                    ? 'bg-card-sage text-accent-sage border border-accent-sage/20'
                    : 'bg-card-warm text-primary border border-primary/20'
                }`}
              >
                {coldAttempt ? t.common.showTranslation : t.common.hideTranslation}
              </button>
            </div>

            {!coldAttempt && (
              <div className="mt-3 space-y-2 border-t border-border-subtle pt-3">
                <div className="text-[11px] text-muted font-medium">
                  {t.briefing.usefulPhrasesTitle}
                </div>
                <div className="space-y-1.5">
                  {mission.usefulPhrases.slice(0, 3).map(phrase => (
                    <div
                      key={phrase.id}
                      className="rounded-xl bg-surface-sunken p-2.5 text-xs flex justify-between items-center border border-border-subtle"
                    >
                      <span className="font-semibold text-heading">"{phrase.form}"</span>
                      <span className="text-muted">{phrase.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Audio & Privacy Note */}
          <div className="flex items-center gap-2 text-xs text-muted">
            <Mic className="h-4 w-4 text-muted" />
            <span>
              {t.settings.privacyDisclosure}
            </span>
          </div>
        </div>

        {/* Footer sticky CTA */}
        <div className="border-t border-border-subtle bg-surface-sunken px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-safe">
          <div className="text-xs text-muted text-center sm:text-left">
            {t.common.speakingWith} <strong className="text-heading font-medium">{mission.character.name}</strong>
          </div>
          <button
            onClick={() => onStartSession(mission, selectedMode, coldAttempt)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-primary-dark active:scale-98 w-full sm:w-auto"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>{t.briefing.startMissionButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

