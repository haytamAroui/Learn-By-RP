import React from 'react';
import { ArrowRight, Sparkles, Clock, Repeat, Coffee, CheckCircle2 } from 'lucide-react';
import { MissionDefinition, PhraseItem, SessionRecord } from '../types';
import { useI18n } from '../features/i18n';

interface TalkScreenProps {
  currentLanguageName: string;
  currentMode: string;
  featuredMission: MissionDefinition;
  lastSession?: SessionRecord;
  duePhrases: PhraseItem[];
  onStartMission: (mission: MissionDefinition) => void;
  onExploreMissions: () => void;
  onPracticeDue: () => void;
}

export const TalkScreen: React.FC<TalkScreenProps> = ({
  currentLanguageName,
  currentMode,
  featuredMission,
  lastSession,
  duePhrases,
  onStartMission,
  onExploreMissions,
  onPracticeDue
}) => {
  const { t } = useI18n();

  const mins = Math.max(2, duePhrases.length);
  const dueSummary =
    duePhrases.length > 0
      ? duePhrases.length === 1
        ? `1 ${t.talk.phrasesReadySingle}`
        : `${duePhrases.length} ${t.talk.phrasesReadyPlural.replace('{mins}', String(mins))}`
      : t.talk.allCaughtUp;

  return (
    <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8 px-3.5 py-4 sm:py-8 sm:px-6">
      {/* 1. Natural Editorial Greeting */}
      <div>
        <div className="text-xs font-medium text-muted flex items-center gap-1.5 flex-wrap">
          <span>{currentLanguageName} {t.talk.tagPractice}</span>
          <span>·</span>
          <span>{t.modes[currentMode as 'guided' | 'immersion' | 'focused'] || currentMode}</span>
        </div>
        <h1 className="mt-1.5 font-display text-2xl sm:text-4xl font-medium tracking-tight text-heading text-balance leading-tight">
          {t.talk.heading}
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-body leading-relaxed">
          {t.talk.subheading}
        </p>
      </div>

      {/* 2. Primary Focal Anchor: Continue or Featured Mission Card */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-4 sm:p-7 shadow-xs transition-all hover:border-primary/30">
        <div className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2.5 sm:space-y-3">
            <div className="text-xs text-muted flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-heading">{featuredMission.neighborhood}</span>
              <span>·</span>
              <span>{featuredMission.estimatedMinutes} {t.common.minutes}</span>
              <span>·</span>
              <span>{t.common.level} {featuredMission.levelRange}</span>
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-semibold text-heading tracking-tight leading-snug">
              {featuredMission.title}
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed text-body">
              {featuredMission.setting}
            </p>

            <div className="pt-1">
              <span className="text-xs font-semibold text-heading">{t.common.goal} </span>
              <span className="text-xs text-body">{featuredMission.learnerGoal}</span>
            </div>

            {featuredMission.transferReason && (
              <div className="flex items-start gap-2 rounded-xl bg-card-warm p-3 text-xs text-primary-dark dark:text-primary-light border border-primary/10">
                <Repeat className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  <strong>{t.common.connectedLoop} </strong>
                  {featuredMission.transferReason}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 border-t border-border-subtle pt-4 sm:pt-5">
          <div className="text-xs text-muted">
            {t.common.speakingWith} <strong className="text-heading font-medium">{featuredMission.character.name}</strong> ({featuredMission.character.role})
          </div>

          <button
            onClick={() => onStartMission(featuredMission)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-primary-dark active:scale-98 w-full sm:w-auto"
          >
            <span>{t.talk.startConversation}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3. Secondary Actions Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Due phrases card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface p-4 sm:p-5 transition-all hover:border-primary/20">
          <div>
            <div className="text-xs font-medium text-muted">{t.talk.spacedRevisit}</div>
            <h3 className="mt-1 font-display text-lg font-semibold text-heading">
              {t.talk.practiseDueTitle}
            </h3>
            <p className="mt-1 text-xs text-body">
              {dueSummary}
            </p>

            {duePhrases.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-xs text-heading">
                {duePhrases.slice(0, 2).map(p => (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="font-medium">"{p.form}"</span>
                    <span className="text-muted truncate">— {p.meaning}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={onPracticeDue}
            disabled={duePhrases.length === 0}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border-subtle py-2.5 text-xs font-medium text-heading transition-colors hover:bg-surface-hover disabled:opacity-40 active:scale-98"
          >
            <Clock className="h-3.5 w-3.5 text-muted" />
            <span>{t.talk.reviewButton.replace('{count}', String(duePhrases.length))}</span>
          </button>
        </div>

        {/* Connected Neighborhood Explore */}
        <div className="flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface p-4 sm:p-5 transition-all hover:border-primary/20">
          <div>
            <div className="text-xs font-medium text-muted">{t.talk.neighborhoodTitle}</div>
            <h3 className="mt-1 font-display text-lg font-semibold text-heading">
              {t.talk.neighborhoodHeading}
            </h3>
            <p className="mt-1 text-xs text-body leading-relaxed">
              {t.talk.neighborhoodDesc}
            </p>
            <div className="mt-3 text-xs text-muted">
              {t.talk.neighborhoodConsequence}
            </div>
          </div>

          <button
            onClick={onExploreMissions}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border-subtle py-2.5 text-xs font-medium text-heading transition-colors hover:bg-surface-hover active:scale-98"
          >
            <span>{t.talk.browseAllButton}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted" />
          </button>
        </div>
      </div>
    </div>
  );
};
