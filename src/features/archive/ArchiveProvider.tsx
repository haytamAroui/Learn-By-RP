import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  LearningObservation,
  PhraseItem,
  SessionRecord,
  UserPreferences,
} from '../../types';
import { archiveRepository } from './archiveRepository';
import { ConsentRecord } from './ArchiveRepository.types';
import type { ValidatedSkillEvidence } from '../learning/skillEvidence';
import type { ValidatedPhraseEvidence } from '../learning/learningCore';
import { api, setApiConsentContext } from '../../lib/api';

interface ArchiveContextValue {
  ready: boolean;
  error: string | null;

  preferences: UserPreferences;
  savePreferences: (prefs: UserPreferences) => Promise<void>;

  sessions: SessionRecord[];
  phrases: PhraseItem[];
  observations: LearningObservation[];

  duePhrases: PhraseItem[];
  lastSession?: SessionRecord;

  refresh: () => Promise<void>;

  beginSession: (session: SessionRecord) => Promise<void>;
  getSessionById: (id: string) => Promise<SessionRecord | null>;
  completeSession: (
    session: SessionRecord,
    rejected?: { reason: string }[],
    skillEvidence?: ValidatedSkillEvidence,
    phraseEvidence?: ValidatedPhraseEvidence
  ) => Promise<void>;

  hideObservation: (id: string) => Promise<void>;
  disputeObservation: (id: string) => Promise<void>;
  hideSkillObservation: (id: string) => Promise<void>;
  disputeSkillObservation: (id: string) => Promise<void>;
  resetPhrase: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  clearAllLearningData: () => Promise<void>;
  exportArchive: () => Promise<string>;
  importArchive: (json: string) => Promise<{ success: boolean; message: string }>;
  exportReceipt: (session: SessionRecord) => Promise<string>;

  interruptedSessions: Array<{ id: string; missionId: string; startedAt: string; state: string }>;
  isDeleted: (sessionId: string) => Promise<boolean>;

  consent: {
    voice: ConsentRecord | null;
    savedAnalysis: ConsentRecord | null;
    recordConsent: (scope: 'voice' | 'saved_analysis', granted: boolean) => Promise<void>;
    withdrawConsent: (scope: 'voice' | 'saved_analysis') => Promise<void>;
  };
}

const ArchiveContext = createContext<ArchiveContextValue | null>(null);

export const ArchiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [phrases, setPhrases] = useState<PhraseItem[]>([]);
  const [observations, setObservations] = useState<LearningObservation[]>([]);
  const [interruptedSessions, setInterruptedSessions] = useState<
    Array<{ id: string; missionId: string; startedAt: string; state: string }>
  >([]);
  const [voiceConsent, setVoiceConsent] = useState<ConsentRecord | null>(null);
  const [savedAnalysisConsent, setSavedAnalysisConsent] = useState<ConsentRecord | null>(null);

  const refresh = useCallback(async () => {
    const [prefs, sess, phr, obs, interrupted, voice, analysis] = await Promise.all([
      archiveRepository.getPreferences(),
      archiveRepository.getSessions(),
      archiveRepository.getPhrases(),
      archiveRepository.getObservations(),
      archiveRepository.getInterruptedSessions(),
      archiveRepository.getConsent('voice'),
      archiveRepository.getConsent('saved_analysis'),
    ]);

    setPreferences(prefs);
    setSessions(sess);
    setPhrases(phr);
    setObservations(obs);
    setInterruptedSessions(interrupted);
    setVoiceConsent(voice);
    setSavedAnalysisConsent(analysis);
  }, []);

  useEffect(() => {
    setApiConsentContext({
      voice: voiceConsent
        ? voiceConsent.granted
          ? 'granted'
          : 'denied'
        : 'unknown',
      savedAnalysis: savedAnalysisConsent
        ? savedAnalysisConsent.granted
          ? 'granted'
          : 'denied'
        : 'unknown',
    });
  }, [voiceConsent, savedAnalysisConsent]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await refresh();
        if (!cancelled) setReady(true);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to open the local archive');
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const savePreferences = useCallback(
    async (prefs: UserPreferences) => {
      await archiveRepository.savePreferences(prefs);
      setPreferences(prefs);
    },
    []
  );

  const beginSession = useCallback(async (session: SessionRecord) => {
    await archiveRepository.beginSession(session);
  }, []);

  const completeSession = useCallback(
    async (
      session: SessionRecord,
      rejected: { reason: string }[] = [],
      skillEvidence?: ValidatedSkillEvidence,
      phraseEvidence?: ValidatedPhraseEvidence
    ) => {
      await archiveRepository.completeSession(
        session,
        rejected,
        skillEvidence,
        phraseEvidence
      );
      await refresh();
    },
    [refresh]
  );

  const value = useMemo<ArchiveContextValue | null>(() => {
    if (!preferences) return null;

    return {
      ready,
      error,
      preferences,
      savePreferences,
      sessions,
      phrases,
      observations,
      duePhrases: phrases.filter(p => p.scheduling.due),
      lastSession: sessions[0],
      interruptedSessions,
      refresh,

      beginSession,
      getSessionById: id => archiveRepository.getSessionById(id),
      completeSession,

      hideObservation: async id => {
        await archiveRepository.hideObservation(id);
        await refresh();
      },
      disputeObservation: async id => {
        await archiveRepository.disputeObservation(id);
        await refresh();
      },
      hideSkillObservation: async id => {
        await archiveRepository.hideSkillObservation(id);
        await refresh();
      },
      disputeSkillObservation: async id => {
        await archiveRepository.disputeSkillObservation(id);
        await refresh();
      },
      resetPhrase: async id => {
        await archiveRepository.resetPhrase(id);
        await refresh();
      },
      deleteSession: async id => {
        // Local tombstone is authoritative and happens first. Remote cleanup is a
        // second privacy barrier for delayed assessment/provider jobs.
        await archiveRepository.deleteSession(id);
        await api.markSessionDeleted(id).catch(() => undefined);
        await refresh();
      },
      clearAllLearningData: async () => {
        const deletedSessionIds = sessions.map(session => session.id);
        await archiveRepository.clearAllLearningData();
        await Promise.all(
          deletedSessionIds.map(id => api.markSessionDeleted(id).catch(() => undefined))
        );
        await refresh();
      },
      exportArchive: () => archiveRepository.exportArchiveJson(),
      importArchive: async json => {
        const result = await archiveRepository.importArchiveJson(json);
        await refresh();
        return { success: result.success, message: result.message };
      },
      exportReceipt: session => archiveRepository.exportLearningReceiptText(session),

      isDeleted: sessionId => archiveRepository.isDeleted(sessionId),

      consent: {
        voice: voiceConsent,
        savedAnalysis: savedAnalysisConsent,
        recordConsent: async (scope, granted) => {
          const record = await archiveRepository.recordConsent(scope, granted);
          if (scope === 'voice') setVoiceConsent(record);
          else setSavedAnalysisConsent(record);

          const prefs =
            scope === 'voice'
              ? { ...preferences, voiceProcessingConsent: granted }
              : { ...preferences, savedAnalysisConsent: granted };
          await archiveRepository.savePreferences(prefs);
          setPreferences(prefs);
        },
        withdrawConsent: async scope => {
          await archiveRepository.withdrawConsent(scope);
          const withdrawn = await archiveRepository.getConsent(scope);
          if (scope === 'voice') setVoiceConsent(withdrawn);
          else setSavedAnalysisConsent(withdrawn);

          const prefs =
            scope === 'voice'
              ? { ...preferences, voiceProcessingConsent: false }
              : { ...preferences, savedAnalysisConsent: false };
          await archiveRepository.savePreferences(prefs);
          setPreferences(prefs);
        },
      },
    };
  }, [
    error,
    interruptedSessions,
    observations,
    phrases,
    preferences,
    ready,
    refresh,
    savePreferences,
    savedAnalysisConsent,
    sessions,
    voiceConsent,
    beginSession,
    completeSession,
  ]);

  /**
   * While the archive is still loading there is no context value to give, and the
   * context must never be skipped: rendering children here without the provider
   * makes every descendant `useArchive()` call throw on first paint, which is a
   * blank screen rather than a loading screen.
   *
   * Rendering nothing is the honest state. Descendants mount once the archive is
   * ready, which is what `ready` in the context is for.
   */
  if (!value) {
    return null;
  }

  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>;
};

export function useArchive(): ArchiveContextValue {
  const context = useContext(ArchiveContext);
  if (!context) {
    throw new Error('useArchive must be used within an ArchiveProvider');
  }
  return context;
}
