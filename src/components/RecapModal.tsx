import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  Trash2,
  EyeOff,
  ArrowRight,
  Repeat,
  FileText
} from 'lucide-react';
import { SessionRecord, LearningObservation, MissionDefinition } from '../types';
import { MISSION_CATALOG } from '../data/missions';
import { ArchiveStorage } from '../features/archive/storage';
import { useI18n } from '../features/i18n';

interface RecapModalProps {
  session: SessionRecord;
  onClose: () => void;
  onNextMission?: (mission: MissionDefinition) => void;
  onUpdateObservation?: (obsId: string, updates: Partial<LearningObservation>) => void;
}

export const RecapModal: React.FC<RecapModalProps> = ({
  session,
  onClose,
  onNextMission,
  onUpdateObservation
}) => {
  const { t } = useI18n();
  const currentMission = MISSION_CATALOG.find(m => m.id === session.missionId);
  const nextMission = currentMission?.nextMissionId
    ? MISSION_CATALOG.find(m => m.id === currentMission.nextMissionId)
    : null;

  const [observations, setObservations] = useState<LearningObservation[]>(session.observations);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const handleDispute = (obsId: string) => {
    ArchiveStorage.deleteObservation(obsId);
    setObservations(prev => prev.filter(o => o.observationId !== obsId));
  };

  const handleHide = (obsId: string) => {
    ArchiveStorage.hideObservation(obsId);
    setObservations(prev => prev.filter(o => o.observationId !== obsId));
  };

  const handleDownloadTextReceipt = () => {
    const textReceipt = ArchiveStorage.exportLearningReceiptText(session);
    const blob = new Blob([textReceipt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mission-receipt-${session.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl sm:rounded-2xl bg-surface border border-border-subtle shadow-2xl overflow-hidden text-heading">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t.recap.tag}
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-heading">
              {t.recap.title}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* 1. Neutral Task Outcome Statement */}
          <div className="rounded-2xl bg-surface-sunken p-5 border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                {t.recap.communicativeOutcome}
              </span>
              <span className="rounded-lg bg-surface border border-border-subtle px-2.5 py-0.5 text-xs font-semibold text-heading capitalize">
                {session.taskOutcome.replace('_', ' ')}
              </span>
            </div>

            <p className="text-sm font-medium text-heading">
              {session.summary || 'You engaged in natural conversation to achieve your goal.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted">
              <span>{session.passages.length} {t.recap.turnsCount}</span>
              <span>·</span>
              <span>{session.coldAttempt ? t.progress.coldAttempt : t.progress.assistedAttempt}</span>
              <span>·</span>
              <span className="capitalize">{t.modes[session.mode] || session.mode}</span>
            </div>
          </div>

          {/* 2. Grounded Phrase Evidence (Quotes from Learner's Speech) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t.recap.validatedEvidence} ({observations.length})
              </h3>
              <span className="text-[11px] text-faint">{t.common.evidence}</span>
            </div>

            {observations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-subtle p-6 text-center text-xs text-muted">
                {t.recap.noPhrasesValidated}
              </div>
            ) : (
              <div className="space-y-3">
                {observations.map(obs => (
                  <div
                    key={obs.observationId}
                    className="rounded-2xl border border-border-subtle bg-surface p-4 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm text-heading">
                          "{obs.candidateForm}"
                        </div>
                        <div className="text-xs text-muted">{obs.meaning}</div>
                      </div>

                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${
                          obs.retrieval === 'unassisted'
                            ? 'bg-card-sage text-accent-sage border-accent-sage/20'
                            : 'bg-card-warm text-primary border-primary/20'
                        }`}
                      >
                        {obs.retrieval === 'unassisted' ? t.recap.unassisted : t.recap.assisted} ({obs.modality})
                      </span>
                    </div>

                    <div className="rounded-xl bg-surface-sunken p-2.5 text-xs text-heading border border-border-subtle">
                      <span className="text-muted">{t.common.yourProduction} </span>
                      <strong>"{obs.quote}"</strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                      <span>{obs.rehearsal ? t.recap.rehearsal : t.progress.steadyTitle}</span>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleHide(obs.observationId)}
                          className="hover:text-heading transition-colors"
                        >
                          {t.progress.hideEvidence}
                        </button>
                        <button
                          onClick={() => handleDispute(obs.observationId)}
                          className="text-primary hover:underline font-medium"
                        >
                          {t.progress.disputeEvidence}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Actionable Feedback */}
          {session.actionableFeedback && session.actionableFeedback.length > 0 && (
            <div className="space-y-2 rounded-2xl bg-surface border border-border-subtle p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t.settings.sectionPrivacy}
              </h4>
              <ul className="space-y-1.5 text-xs text-body">
                {session.actionableFeedback.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary font-bold">·</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. Connected Transfer Recommendation */}
          {nextMission && onNextMission && (
            <div className="rounded-2xl border border-primary/20 bg-card-warm p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Repeat className="h-4 w-4" />
                <span>{t.common.connectedLoop}</span>
              </div>
              <p className="text-xs text-heading">
                <strong>{nextMission.title}: </strong>
                {currentMission?.transferReason || nextMission.setting}
              </p>
              <button
                onClick={() => onNextMission(nextMission)}
                className="mt-2 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-dark transition-all"
              >
                <span>{t.recap.continueNextMission} ({nextMission.character.name})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-border-subtle bg-surface-sunken px-4 py-3 sm:px-6 sm:py-4 pb-safe">
          <button
            onClick={handleDownloadTextReceipt}
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-heading hover:text-primary transition-colors py-1"
          >
            <Download className="h-4 w-4" />
            <span>{downloadSuccess ? t.recap.downloadSuccess : t.recap.downloadReceipt}</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-white hover:bg-primary-dark shadow-xs transition-all w-full sm:w-auto"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};

