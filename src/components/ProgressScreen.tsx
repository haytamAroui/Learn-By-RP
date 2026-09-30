import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  FileText,
  Trash2,
  EyeOff,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  Repeat,
  Layers
} from 'lucide-react';
import { PhraseItem, SessionRecord, LearningObservation } from '../types';
import { COMMUNICATIVE_SKILLS_CATALOG, CommunicativeSkillMeta } from '../data/missions';
import { useI18n } from '../features/i18n';

interface ProgressScreenProps {
  phrases: PhraseItem[];
  sessions: SessionRecord[];
  observations: LearningObservation[];
  onSelectSession: (session: SessionRecord) => void;
  onDisputeObservation: (obsId: string) => void;
  onHideObservation: (obsId: string) => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  phrases,
  sessions,
  observations,
  onSelectSession,
  onDisputeObservation,
  onHideObservation
}) => {
  const { t } = useI18n();
  const [selectedTab, setSelectedTab] = useState<'phrases' | 'skills' | 'history'>('phrases');
  const [selectedPhrase, setSelectedPhrase] = useState<PhraseItem | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<CommunicativeSkillMeta | null>(null);

  // Group phrases: due first, then steady, growing, supported, new
  const duePhrases = phrases.filter(p => p.scheduling.due);
  const otherPhrases = phrases.filter(p => !p.scheduling.due);

  return (
    <div className="mx-auto max-w-4xl space-y-5 sm:space-y-8 px-3.5 py-4 sm:py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-heading">
          {t.progress.heading}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-body">
          {t.progress.subheading}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle text-xs sm:text-sm font-medium overflow-x-auto no-scrollbar gap-1 sm:gap-4">
        <button
          onClick={() => setSelectedTab('phrases')}
          className={`pb-2.5 sm:pb-3 px-2.5 sm:px-2 transition-colors whitespace-nowrap shrink-0 ${
            selectedTab === 'phrases'
              ? 'border-b-2 border-primary text-heading font-semibold'
              : 'text-muted hover:text-heading'
          }`}
        >
          {t.progress.tabPhrases} ({phrases.length})
        </button>
        <button
          onClick={() => setSelectedTab('skills')}
          className={`pb-2.5 sm:pb-3 px-2.5 sm:px-2 transition-colors whitespace-nowrap shrink-0 ${
            selectedTab === 'skills'
              ? 'border-b-2 border-primary text-heading font-semibold'
              : 'text-muted hover:text-heading'
          }`}
        >
          {t.progress.tabSkills} ({COMMUNICATIVE_SKILLS_CATALOG.length})
        </button>
        <button
          onClick={() => setSelectedTab('history')}
          className={`pb-2.5 sm:pb-3 px-2.5 sm:px-2 transition-colors whitespace-nowrap shrink-0 ${
            selectedTab === 'history'
              ? 'border-b-2 border-primary text-heading font-semibold'
              : 'text-muted hover:text-heading'
          }`}
        >
          {t.progress.tabHistory} ({sessions.length})
        </button>
      </div>

      {selectedTab === 'phrases' && (
        <div className="space-y-6">
          {/* Due section */}
          {duePhrases.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Clock className="h-3.5 w-3.5" />
                <span>{t.progress.readyToPractise} ({duePhrases.length})</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {duePhrases.map(phrase => (
                  <div
                    key={phrase.id}
                    onClick={() => setSelectedPhrase(phrase)}
                    className="cursor-pointer rounded-2xl border border-primary/20 bg-card-warm p-4 transition-all hover:border-primary hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-heading">"{phrase.form}"</div>
                        <div className="mt-0.5 text-xs text-muted">{phrase.meaning}</div>
                      </div>
                      <span className="rounded-lg bg-primary px-2 py-0.5 text-[10px] font-semibold text-white shadow-2xs">
                        {t.progress.reviewDue}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2 text-[11px] text-muted">
                      <span className="capitalize">{phrase.recallStatus}</span>
                      <span>{t.progress.reviewDue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All phrases inventory */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t.common.allTrackedVocabulary} ({phrases.length})
            </div>

            <div className="space-y-2">
              {phrases.map(phrase => {
                return (
                  <div
                    key={phrase.id}
                    onClick={() => setSelectedPhrase(phrase)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer rounded-2xl border border-border-subtle bg-surface p-3.5 sm:p-4 transition-all hover:border-primary/30 active:scale-99"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-heading">"{phrase.form}"</span>
                        <span className="text-xs text-muted">·</span>
                        <span className="text-xs text-body">{phrase.meaning}</span>
                      </div>
                      <div className="text-xs text-muted">
                        {phrase.stats.unassistedCount > 0 ? (
                          <span className="text-accent-sage font-medium">
                            {t.progress.spokenCount.replace('{count}', String(phrase.stats.unassistedCount))}
                          </span>
                        ) : phrase.stats.assistedCount > 0 ? (
                          <span>{t.progress.supportedTitle} ({phrase.stats.assistedCount})</span>
                        ) : (
                          <span>{t.progress.newTitle}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                      <div className="text-left sm:text-right text-xs">
                        <div className="font-medium capitalize text-heading">{phrase.recallStatus}</div>
                        <div className="text-[11px] text-faint font-mono-numbers">
                          {phrase.scheduling.intervalDays}d interval
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-faint" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'skills' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface p-4 text-xs text-body border border-border-subtle">
            <strong className="text-heading font-medium">{t.progress.communicativeSkillsTitle}: </strong>
            {t.progress.subheading}
          </div>

          <div className="space-y-3">
            {COMMUNICATIVE_SKILLS_CATALOG.map(skill => {
              const matchingObs = observations.filter(o => {
                const quoteLower = (o.quote || '').toLowerCase();
                const formLower = (o.candidateForm || '').toLowerCase();
                return skill.samplePhrases.some(
                  sp => quoteLower.includes(sp.toLowerCase().slice(0, 8)) || formLower.includes(sp.toLowerCase().slice(0, 8))
                );
              });

              const unassistedCount = matchingObs.filter(o => o.retrieval === 'unassisted').length;
              const contexts = new Set(matchingObs.map(o => o.sessionId));

              let status: 'emerging' | 'demonstrated' | 'steady' = 'emerging';
              if (contexts.size >= 2 && unassistedCount >= 2) {
                status = 'steady';
              } else if (unassistedCount >= 1) {
                status = 'demonstrated';
              }

              return (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer rounded-2xl border border-border-subtle bg-surface p-4 sm:p-5 transition-all hover:border-primary/30 hover:shadow-xs active:scale-99"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                        {skill.category}
                      </span>
                      <span className="text-xs text-muted">·</span>
                      <span className="text-xs text-body">
                        {t.progress.observedAcross.replace('{count}', String(skill.associatedMissions.length))}
                      </span>
                    </div>

                    <h3 className="font-display text-base sm:text-lg font-semibold text-heading">
                      {skill.name}
                    </h3>

                    <p className="text-xs text-body leading-relaxed max-w-xl">
                      {skill.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted">
                      <span>{t.progress.samplePatterns}</span>
                      {skill.patterns.map((p, idx) => (
                        <code key={idx} className="rounded-md bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-heading border border-border-subtle">
                          {p}
                        </code>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                    <div className="text-left sm:text-right">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize border ${
                          status === 'steady'
                            ? 'bg-card-sage text-accent-sage border-accent-sage/20'
                            : status === 'demonstrated'
                            ? 'bg-card-sky text-accent-sky border-accent-sky/20'
                            : 'bg-card-warm text-primary border-primary/20'
                        }`}
                      >
                        {status === 'steady' ? t.progress.steadyTitle.split(' ')[0] : status === 'demonstrated' ? t.progress.growingTitle.split(' ')[0] : t.progress.supportedTitle.split(' ')[0]}
                      </span>
                      <div className="mt-1 text-[11px] text-faint">
                        {contexts.size} {t.common.evidence.toLowerCase()}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-faint" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedTab === 'history' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-subtle p-8 text-center text-sm text-muted">
              {t.progress.noReceiptsYet}
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer rounded-2xl border border-border-subtle bg-surface p-4 sm:p-5 transition-all hover:border-primary/30 hover:shadow-xs active:scale-99"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted">
                    <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                    <span>·</span>
                    <span className="capitalize">{t.modes[session.mode] || session.mode}</span>
                    <span>·</span>
                    <span>{session.passages.length} {t.common.turns}</span>
                    {session.coldAttempt && (
                      <>
                        <span>·</span>
                        <span className="text-accent-sage font-medium">{t.progress.coldAttempt}</span>
                      </>
                    )}
                  </div>

                  <h3 className="font-display text-base sm:text-lg font-semibold text-heading">
                    {session.missionId.replace('mission-es-', 'Café / ').replace('-', ' ')}
                  </h3>

                  <div className="text-xs text-body">
                    {t.recap.communicativeOutcome}: <strong className="capitalize text-heading font-medium">{session.taskOutcome.replace('_', ' ')}</strong>
                    {session.observations.length > 0 && ` · ${session.observations.length} ${t.common.evidence.toLowerCase()}`}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                  <span className="text-xs font-semibold text-primary">{t.progress.viewReceipt}</span>
                  <ChevronRight className="h-4 w-4 text-primary" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Phrase Detail Modal */}
      {selectedPhrase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface border border-border-subtle p-6 shadow-xl text-heading">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-muted uppercase tracking-wider">
                  {t.common.targetPhrase}
                </span>
                <h3 className="font-display text-2xl font-bold text-heading">
                  "{selectedPhrase.form}"
                </h3>
                <p className="text-sm text-body">{selectedPhrase.meaning}</p>
              </div>
              <button
                onClick={() => setSelectedPhrase(null)}
                className="rounded-lg p-1 text-muted hover:bg-surface-hover hover:text-heading"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-surface-sunken p-4 text-xs text-body space-y-1 border border-border-subtle">
              <div><strong className="text-heading">Usage Note:</strong> {selectedPhrase.usageNote}</div>
              <div><strong className="text-heading">Recall State:</strong> <span className="capitalize font-semibold text-heading">{selectedPhrase.recallStatus}</span></div>
              <div><strong className="text-heading">Current Interval:</strong> {selectedPhrase.scheduling.intervalDays} days</div>
            </div>

            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t.recap.validatedEvidence}
              </h4>

              {observations.filter(
                o => o.itemId === selectedPhrase.id || o.candidateForm.toLowerCase() === selectedPhrase.form.toLowerCase()
              ).length === 0 ? (
                <p className="text-xs text-muted">
                  {t.recap.noPhrasesValidated}
                </p>
              ) : (
                observations
                  .filter(
                    o => o.itemId === selectedPhrase.id || o.candidateForm.toLowerCase() === selectedPhrase.form.toLowerCase()
                  )
                  .map(obs => (
                    <div
                      key={obs.observationId}
                      className="rounded-xl border border-border-subtle bg-surface-sunken p-3 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-heading">
                          "{obs.quote}"
                        </span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                          obs.retrieval === 'unassisted'
                            ? 'bg-card-sage text-accent-sage'
                            : 'bg-card-warm text-primary'
                        }`}>
                          {obs.retrieval === 'unassisted' ? t.recap.unassisted : t.recap.assisted} ({obs.modality})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span>{new Date(obs.recordedAt).toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onHideObservation(obs.observationId)}
                            className="text-muted hover:text-heading"
                          >
                            {t.progress.hideEvidence}
                          </button>
                          <button
                            onClick={() => onDisputeObservation(obs.observationId)}
                            className="text-primary hover:underline"
                          >
                            {t.progress.disputeEvidence}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle flex justify-end">
              <button
                onClick={() => setSelectedPhrase(null)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-dark"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface border border-border-subtle p-6 shadow-xl text-heading">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                  {selectedSkill.category}
                </span>
                <h3 className="font-display text-2xl font-bold text-heading">
                  {selectedSkill.name}
                </h3>
                <p className="mt-1 text-xs text-body">{selectedSkill.description}</p>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                className="rounded-lg p-1 text-muted hover:bg-surface-hover hover:text-heading"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-surface-sunken p-4 text-xs space-y-2 border border-border-subtle">
              <div className="font-semibold text-heading">{t.progress.samplePatterns}</div>
              <ul className="list-disc pl-4 space-y-1 text-body">
                {selectedSkill.patterns.map((p, idx) => (
                  <li key={idx}><code className="font-mono text-xs text-heading">{p}</code></li>
                ))}
              </ul>
            </div>

            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t.recap.validatedEvidence}
              </h4>

              {observations.filter(o => {
                const quoteLower = (o.quote || '').toLowerCase();
                const formLower = (o.candidateForm || '').toLowerCase();
                return selectedSkill.samplePhrases.some(
                  sp => quoteLower.includes(sp.toLowerCase().slice(0, 8)) || formLower.includes(sp.toLowerCase().slice(0, 8))
                );
              }).length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-subtle p-6 text-center text-xs text-muted">
                  {t.progress.noReceiptsYet}
                </div>
              ) : (
                observations
                  .filter(o => {
                    const quoteLower = (o.quote || '').toLowerCase();
                    const formLower = (o.candidateForm || '').toLowerCase();
                    return selectedSkill.samplePhrases.some(
                      sp => quoteLower.includes(sp.toLowerCase().slice(0, 8)) || formLower.includes(sp.toLowerCase().slice(0, 8))
                    );
                  })
                  .map(obs => (
                    <div
                      key={obs.observationId}
                      className="rounded-xl border border-border-subtle bg-surface-sunken p-3 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-heading">
                          "{obs.quote}"
                        </span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                          obs.retrieval === 'unassisted'
                            ? 'bg-card-sage text-accent-sage'
                            : 'bg-card-warm text-primary'
                        }`}>
                          {obs.retrieval === 'unassisted' ? t.recap.unassisted : t.recap.assisted} ({obs.modality})
                        </span>
                      </div>
                      <div className="text-[11px] text-muted">
                        {new Date(obs.recordedAt).toLocaleString()}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle flex justify-end">
              <button
                onClick={() => setSelectedSkill(null)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-dark"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
