import {
  LearningObservation,
  PhraseItem,
  SessionRecord,
  SessionState,
  SkillLapse,
  SkillObservation,
  SupportExposure,
  UserPreferences,
} from '../../types';
import type { ValidatedSkillEvidence } from '../learning/skillEvidence';
import type { ValidatedPhraseEvidence } from '../learning/learningCore';

/**
 * A consent decision for one processing scope.
 *
 * Declared here rather than in the SQLite implementation because it is part of the
 * archive contract, not of any one storage technology.
 */
export interface ConsentRecord {
  id: string;
  scope: 'voice' | 'saved_analysis';
  granted: boolean;
  version: string;
  decidedAt: string;
  withdrawnAt?: string;
}

/**
 * The archive contract.
 *
 * Screens depend on this and nothing else. There are two implementations:
 * SQLite on native, IndexedDB on web. Neither is a detail screens may reach into,
 * because the two cannot be made to behave identically by convention — only by
 * the parity fixture asserting it.
 *
 * Every method that writes learner-visible evidence writes it atomically with the
 * transcript it cites. A recap screen may therefore always assume that whatever
 * the archive returns is durable and complete.
 */
export interface ArchiveRepository {
  // ---------------------------------------------------------------- preferences
  getPreferences(): Promise<UserPreferences>;
  savePreferences(preferences: UserPreferences): Promise<void>;

  // -------------------------------------------------------------------- consent
  getConsent(scope: 'voice' | 'saved_analysis'): Promise<ConsentRecord | null>;
  recordConsent(
    scope: 'voice' | 'saved_analysis',
    granted: boolean
  ): Promise<ConsentRecord>;
  withdrawConsent(scope: 'voice' | 'saved_analysis'): Promise<void>;

  // ------------------------------------------------------------------- sessions
  beginSession(session: SessionRecord): Promise<void>;
  saveSessionState(sessionId: string, state: SessionState): Promise<void>;
  completeSession(
    session: SessionRecord,
    rejectedProposals?: { reason: string }[],
    skillEvidence?: ValidatedSkillEvidence,
    phraseEvidence?: ValidatedPhraseEvidence
  ): Promise<void>;
  getSessions(): Promise<SessionRecord[]>;
  getSessionById(id: string): Promise<SessionRecord | null>;
  getSessionSummaries(): Promise<
    Array<{
      id: string;
      missionId: string;
      language: string;
      mode: string;
      state: string;
      startedAt: string;
      endedAt?: string;
      coldAttempt: boolean;
      turnCount: number;
      observationCount: number;
    }>
  >;
  getInterruptedSessions(): Promise<
    Array<{ id: string; missionId: string; startedAt: string; state: string }>
  >;
  markSessionEnded(
    sessionId: string,
    reason: SessionRecord['endReason']
  ): Promise<void>;
  appendSupportExposures(sessionId: string, exposures: SupportExposure[]): Promise<void>;

  // ----------------------------------------------------------------- evidence
  getObservations(): Promise<LearningObservation[]>;
  hideObservation(observationId: string): Promise<void>;
  disputeObservation(observationId: string): Promise<void>;

  getSkillObservations(): Promise<SkillObservation[]>;
  hideSkillObservation(observationId: string): Promise<void>;
  disputeSkillObservation(observationId: string): Promise<void>;

  getSkillLapses(): Promise<SkillLapse[]>;

  // ------------------------------------------------------------------- phrases
  getPhrases(): Promise<PhraseItem[]>;
  savePhrases(phrases: PhraseItem[]): Promise<void>;
  resetPhrase(phraseId: string): Promise<void>;

  // ------------------------------------------------------------------ deletion
  markDeleted(scope: 'session' | 'all', targetId?: string): Promise<string>;
  isDeleted(sessionId: string): Promise<boolean>;
  deleteSession(sessionId: string): Promise<void>;
  clearAllLearningData(): Promise<void>;

  // -------------------------------------------------------------------- review
  recordDrillReview(input: {
    phrase: PhraseItem;
    evidence: ValidatedPhraseEvidence;
  }): Promise<void>;

  // ----------------------------------------------------------------------- jobs
  enqueueJob(kind: string, targetId?: string, payload?: unknown): Promise<void>;
  getPendingJobs(): Promise<Array<{ id: string; kind: string; targetId?: string }>>;
  removePendingJob(id: string): Promise<void>;

  // --------------------------------------------------------------------- export
  exportArchiveJson(): Promise<string>;
  importArchiveJson(json: string): Promise<{
    success: boolean;
    message: string;
    counts?: { sessions: number; phrases: number; observations: number };
  }>;
  exportLearningReceiptText(session: SessionRecord): Promise<string>;
}