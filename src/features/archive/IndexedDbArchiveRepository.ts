import { INITIAL_PHRASE_ITEMS, MISSION_CATALOG } from '../../data/missions';
import {
  assertValidatedPhraseEvidence,
  projectPhraseState,
  type ValidatedPhraseEvidence,
} from '../learning/learningCore';
import { LEARNING_POLICY, LEARNING_POLICY_VERSION } from '../learning/policy';
import { renderLearningReceipt } from './learningReceipt';
import { applyProgramDataRetention } from '../program/privacy';
import {
  assertValidatedSkillEvidence,
  type ValidatedSkillEvidence,
} from '../learning/skillEvidence';
import { CONSENT_VERSION, LATEST_SCHEMA_VERSION } from './schema';
import {
  IDBDatabase,
  IDBFactory,
  IDBRequest,
  IDBTransaction,
  IDBValidKey,
} from './idb';

declare const indexedDB: IDBFactory | undefined;
import { ArchiveRepository, ConsentRecord } from './ArchiveRepository.types';
import {
  LanguageCode,
  LearningObservation,
  Mode,
  PhraseItem,
  SessionRecord,
  SessionState,
  SkillLapse,
  SkillObservation,
  SupportExposure,
  TaskOutcome,
  UserPreferences,
} from '../../types';

/**
 * The web archive, on IndexedDB.
 *
 * Web is not a build of the mobile app with a different screen size; it is a place
 * a learner's archive has to survive. So this implements the same contract as the
 * SQLite repository rather than degrading it: the same transcript, the same
 * evidence, the same atomicity.
 *
 * IndexedDB has no SQL, so records are stored as documents rather than rows. Two
 * consequences worth knowing:
 *
 *  - Nested collections (a session's passages) are stored inside the session
 *    document. That is what makes a session write atomic for free.
 *  - Phrase projections are materialised into their own store, because they are
 *    queried independently of any session and are rebuilt from the ledger by the
 *    same `projectPhraseState` the native path uses.
 *
 * The parity fixture asserts this and the SQLite implementation agree. Divergence
 * between two persistence layers is a matter of convention unless something tests
 * it, and "works on my platform" is how data loss ships.
 */

const DB_NAME = 'mission-coach-archive';
const DB_VERSION = 1;

const STORE = {
  meta: 'meta',
  sessions: 'sessions',
  observations: 'observations',
  skillObservations: 'skill_observations',
  skillLapses: 'skill_lapses',
  phrases: 'phrases',
  consent: 'consent',
  deletions: 'deletion_markers',
  jobs: 'pending_jobs',
} as const;

type StoreName = (typeof STORE)[keyof typeof STORE];

interface StoredSession extends Omit<SessionRecord, 'coldAttempt'> {
  coldAttempt: boolean;
}

/**
 * Embedded skill arrays are a read-model cache only. They may be populated from a
 * validator-issued bundle during completion, but a caller-supplied SessionRecord
 * must never smuggle skill truth into IndexedDB.
 */
function stripRawEvidence(
  session: SessionRecord
): Omit<SessionRecord, 'observations' | 'skillObservations' | 'skillLapses'> {
  const {
    observations: _observations,
    skillObservations: _skillObservations,
    skillLapses: _skillLapses,
    ...safe
  } = session;
  return safe;
}

const PREFERENCES_ID = 'current';

const DEFAULT_PREFERENCES: UserPreferences = {
  learningLanguage: 'es',
  explanationLanguage: 'en',
  comfortLevel: 'beginner',
  primaryGoal: 'travel',
  modeDefault: 'guided',
  voiceProcessingConsent: false,
  savedAnalysisConsent: false,
  audioPlaybackEnabled: true,
  autoPlaySpeech: true,
  speechRate: 1.0,
  accommodations: { enabled: [] },
  programPreferences: [],
  programGoals: [],
  continuityProfile: { facts: [] },
};

function isDue(nextReviewAt: string, now: number): boolean {
  const at = Date.parse(nextReviewAt);
  return Number.isFinite(at) ? at <= now : true;
}

/** Transactions are all-or-nothing: any throw aborts every write in the batch. */
type UnitOfWork = <T>(work: (tx: IDBTransaction) => Promise<T>) => Promise<T>;

export class IndexedDbArchiveRepository implements ArchiveRepository {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private opened: IDBDatabase | null = null;

  // ------------------------------------------------------------- infrastructure

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        throw new Error('IndexedDB is unavailable in this environment');
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        for (const name of Object.values(STORE)) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
        }
      };

      request.onsuccess = () => {
        this.opened = request.result;
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Archive upgrade blocked by another tab'));
    });

    return this.dbPromise;
  }

  private transaction: UnitOfWork = async <T>(work: (tx: IDBTransaction) => Promise<T>): Promise<T> => {
    const db = await this.open();
    // One store list for the whole transaction, so a multi-store write is atomic.
    const names = Object.values(STORE);
    const tx = db.transaction(names, 'readwrite');

    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error ?? new Error('Archive transaction aborted'));
      tx.onerror = () => reject(tx.error);
    });

    let result: T;
    try {
      result = await work(tx);
    } catch (error) {
      try { tx.abort(); } catch { /* already completed or aborted */ }
      await done.catch(() => undefined);
      throw error;
    }
    await done;
    return result;
  };

  private request<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async readAll<T>(store: StoreName): Promise<T[]> {
    const db = await this.open();
    const tx = db.transaction([store], 'readonly');
    return this.request(tx.objectStore(store).getAll() as IDBRequest<T[]>);
  }

  private async readOne<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.open();
    const tx = db.transaction([store], 'readonly');
    return this.request(tx.objectStore(store).get(key) as IDBRequest<T | undefined>);
  }

  /**
   * Writes records using explicit out-of-line keys.
   *
   * The object stores are created without a `keyPath`, because the natural key
   * differs per store (session id, observation id, consent scope). Passing the key
   * to `put` keeps that explicit instead of forcing a synthetic `id` field onto
   * every document.
   */
  private putAll(
    tx: IDBTransaction,
    store: StoreName,
    entries: Array<{ key: IDBValidKey; value: unknown }>
  ): void {
    const objectStore = tx.objectStore(store);
    for (const entry of entries) objectStore.put(entry.value, entry.key);
  }

  private deleteAll(tx: IDBTransaction, store: StoreName): void {
    tx.objectStore(store).clear();
  }

  /**
   * The natural key an observation is stored under.
   *
   * Mirrors the SQLite unique index on (source_turn_id, source_revision,
   * item_id). Keying by observationId instead would let a replayed turn after a
   * reconnect become a second record on web, and the archive would then report
   * more independent evidence than the learner produced.
   */
  private observationKey(observation: LearningObservation): string {
    return `${observation.sourceTurnId}::${observation.sourceRevision}::${observation.itemId}`;
  }

  private putDocs<T extends { id?: string; observationId?: string }>(
    tx: IDBTransaction,
    store: StoreName,
    values: T[],
    keyOf: (value: T) => IDBValidKey
  ): void {
    this.putAll(
      tx,
      store,
      values.map(value => ({ key: keyOf(value), value }))
    );
  }

  // ---------------------------------------------------------------- preferences

  async getPreferences(): Promise<UserPreferences> {
    const stored = await this.readOne<{ payload: UserPreferences }>(STORE.meta, PREFERENCES_ID);
    return applyProgramDataRetention({
      ...DEFAULT_PREFERENCES,
      ...(stored?.payload ?? {}),
    });
  }

  async savePreferences(preferences: UserPreferences): Promise<void> {
    await this.transaction(async tx => {
      this.putAll(tx, STORE.meta, [{
        key: PREFERENCES_ID,
        value: {
          id: PREFERENCES_ID,
          payload: applyProgramDataRetention(preferences),
        },
      }]);
    });
  }

  // -------------------------------------------------------------------- consent

  async getConsent(scope: 'voice' | 'saved_analysis'): Promise<ConsentRecord | null> {
    const record = await this.readOne<ConsentRecord>(STORE.consent, scope);
    return record ?? null;
  }

  async recordConsent(
    scope: 'voice' | 'saved_analysis',
    granted: boolean
  ): Promise<ConsentRecord> {
    const record: ConsentRecord = {
      id: scope,
      scope,
      granted,
      version: CONSENT_VERSION,
      decidedAt: new Date().toISOString(),
      withdrawnAt: granted ? undefined : new Date().toISOString(),
    };

    await this.transaction(async tx => {
      this.putAll(tx, STORE.consent, [{ key: record.scope, value: record }]);
    });

    return record;
  }

  async withdrawConsent(scope: 'voice' | 'saved_analysis'): Promise<void> {
    const existing = await this.getConsent(scope);

    // Withdrawal keeps the original decision time and stamps the withdrawal, so a
    // record of having agreed is not rewritten into never having agreed.
    const record: ConsentRecord = {
      id: scope,
      scope,
      granted: false,
      version: CONSENT_VERSION,
      decidedAt: existing?.decidedAt ?? new Date().toISOString(),
      withdrawnAt: new Date().toISOString(),
    };

    await this.transaction(async tx => {
      this.putAll(tx, STORE.consent, [{ key: scope, value: record }]);
    });
  }

  // ------------------------------------------------------------------- sessions

  async beginSession(session: SessionRecord): Promise<void> {
    if (await this.isDeleted(session.id, session.startedAt)) return;
    await this.transaction(async tx => {
      const existing = await this.loadSessionIn(tx, session.id);
      if (existing) return;
      const safeSession = stripRawEvidence(session);
      const merged: StoredSession = {
        ...safeSession,
        observations: [],
        skillObservations: [],
        skillLapses: [],
      };
      this.putAll(tx, STORE.sessions, [{ key: merged.id, value: merged }]);
    });
  }

  private async loadSessionIn(
    tx: IDBTransaction,
    id: string
  ): Promise<StoredSession | undefined> {
    return this.request(tx.objectStore(STORE.sessions).get(id) as IDBRequest<StoredSession>);
  }

  async saveSessionState(sessionId: string, state: SessionState): Promise<void> {
    await this.transaction(async tx => {
      const existing = await this.loadSessionIn(tx, sessionId);
      if (!existing || ['recap_ready', 'recap_unavailable'].includes(existing.state)) return;
      this.putAll(tx, STORE.sessions, [{ key: sessionId, value: { ...existing, state } }]);
    });
  }

  async completeSession(
    session: SessionRecord,
    rejectedProposals: { reason: string }[] = [],
    skillEvidence?: ValidatedSkillEvidence,
    phraseEvidence?: ValidatedPhraseEvidence
  ): Promise<void> {
    await this.writeSession(session, rejectedProposals, skillEvidence, phraseEvidence, true);
  }

  async saveSessionProgress(session: SessionRecord): Promise<void> {
    await this.writeSession({ ...session, endedAt: undefined, summary: undefined,
      actionableFeedback: [], observations: [], skillObservations: [], skillLapses: [] }, [], undefined, undefined, false);
  }

  private async writeSession(
    session: SessionRecord,
    _rejectedProposals: { reason: string }[] = [],
    skillEvidence?: ValidatedSkillEvidence,
    phraseEvidence?: ValidatedPhraseEvidence,
    completing = true
  ): Promise<void> {
    if (skillEvidence) assertValidatedSkillEvidence(skillEvidence);
    if (phraseEvidence) assertValidatedPhraseEvidence(phraseEvidence);
    if (await this.isDeleted(session.id, session.startedAt)) return;
    const now = new Date().toISOString();

    await this.transaction(async tx => {
      const existing = await this.loadSessionIn(tx, session.id);
      const consent = await this.request<ConsentRecord | undefined>(
        tx.objectStore(STORE.consent).get('saved_analysis')
      );
      const markers = await this.request<Array<{ scope: string; targetId?: string; createdAt: string }>>(
        tx.objectStore(STORE.deletions).getAll()
      );
      if (markers.some(marker => marker.scope === 'session' ? marker.targetId === session.id : marker.scope === 'all' && marker.createdAt >= session.startedAt)) return;
      if (!completing && (!existing || ['recap_ready', 'recap_unavailable'].includes(existing.state))) return;
      if (consent?.granted !== true || consent.withdrawnAt) {
        phraseEvidence = undefined;
        skillEvidence = undefined;
        session = { ...session, summary: undefined, actionableFeedback: [] };
      }

      const safeSession = stripRawEvidence(session);
      const stored: StoredSession = {
        ...safeSession,
        endedAt: session.endedAt ?? (completing ? now : undefined),
        // Upsert, not replace: a session that began before an interrupted write
        // still needs its transcript, and so does its evidence.
        passages: session.passages.length > 0 ? session.passages : existing?.passages ?? [],
        supportExposures:
          session.supportExposures.length > 0
            ? session.supportExposures
            : existing?.supportExposures ?? [],
        // Raw SessionRecord observations are never a write path. Recap reads this
        // embedded cache, so it must mirror only validator-issued phrase evidence.
        observations: phraseEvidence
          ? [
              ...new Map(
                [...(existing?.observations ?? []), ...phraseEvidence.observations].map(
                  observation => [this.observationKey(observation), observation] as const
                )
              ).values(),
            ]
          : existing?.observations ?? [],
        // The embedded cache mirrors only validator-issued evidence.
        skillObservations: skillEvidence
          ? [...skillEvidence.observations]
          : existing?.skillObservations ?? [],
        skillLapses: skillEvidence
          ? [...skillEvidence.lapses]
          : existing?.skillLapses ?? [],
      };

      this.putAll(tx, STORE.sessions, [{ key: stored.id, value: stored }]);

      // Evidence is written in the same transaction as the transcript it cites, so
      // a recap can never render a claim the archive does not hold.
      if (phraseEvidence) {
        this.putDocs(
          tx,
          STORE.observations,
          [...phraseEvidence.observations],
          o => this.observationKey(o)
        );
      }

      // Dedicated skill-evidence stores have exactly one write authority:
      // the opaque bundle returned by validateSkillEvidenceProposal().
      if (skillEvidence) {
        this.putDocs(
          tx,
          STORE.skillObservations,
          dedupeById([...skillEvidence.observations]),
          o => o.id
        );
        this.putDocs(
          tx,
          STORE.skillLapses,
          dedupeById([...skillEvidence.lapses]),
          l => l.id
        );
      }
      await this.reprojectPhrasesIn(tx);
    });
  }

  async getSessions(): Promise<SessionRecord[]> {
    const sessions = await this.readAll<StoredSession>(STORE.sessions);
    return sessions
      .slice()
      .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
      .map(toSessionRecord);
  }

  async getSessionById(id: string): Promise<SessionRecord | null> {
    const stored = await this.readOne<StoredSession>(STORE.sessions, id);
    return stored ? toSessionRecord(stored) : null;
  }

  async getSessionSummaries() {
    const sessions = await this.readAll<StoredSession>(STORE.sessions);

    return sessions
      .slice()
      .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
      .map(session => ({
        id: session.id,
        missionId: session.missionId,
        language: session.language,
        mode: session.mode,
        state: session.state,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        coldAttempt: session.coldAttempt,
        turnCount: session.passages?.length ?? 0,
        observationCount: session.observations?.length ?? 0,
      }));
  }

  async getInterruptedSessions(): Promise<
    Array<{ id: string; missionId: string; startedAt: string; state: string }>
  > {
    const sessions = await this.readAll<StoredSession>(STORE.sessions);
    const open = new Set([
      'preflight',
      'connecting',
      'live',
      'paused',
      'reconnecting',
      'ending',
    ]);

    return sessions
      .filter(session => open.has(session.state))
      .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
      .map(session => ({
        id: session.id,
        missionId: session.missionId,
        startedAt: session.startedAt,
        state: session.state,
      }));
  }

  async markSessionEnded(
    sessionId: string,
    reason: SessionRecord['endReason']
  ): Promise<void> {
    await this.transaction(async tx => {
      const existing = await this.loadSessionIn(tx, sessionId);
      if (!existing) return;
      this.putAll(tx, STORE.sessions, [
        {
          key: sessionId,
          value: {
            ...existing,
            endReason: reason,
            endedAt: existing.endedAt ?? new Date().toISOString(),
          },
        },
      ]);
    });
  }


  async appendSupportExposures(
    sessionId: string,
    exposures: SupportExposure[]
  ): Promise<void> {
    if (exposures.length === 0) return;
    const session = await this.getSessionById(sessionId);
    if (!session || await this.isDeleted(sessionId, session.startedAt)) return;

    await this.transaction(async tx => {
      const existing = await this.loadSessionIn(tx, sessionId);
      if (!existing) return;

      const byId = new Map(
        (existing.supportExposures ?? []).map(exposure => [exposure.id, exposure])
      );
      for (const exposure of exposures) {
        if (exposure.sessionId !== sessionId || byId.has(exposure.id)) continue;

        const normalized: SupportExposure = {
          ...exposure,
          turnId: exposure.turnId ?? undefined,
          targetItemIds: exposure.targetItemIds ?? [],
          targetSkillId: exposure.targetSkillId ?? undefined,
          targetOpportunityId: exposure.targetOpportunityId ?? undefined,
          targetPhraseId: exposure.targetPhraseId ?? undefined,
          policyVersion: exposure.policyVersion ?? LEARNING_POLICY_VERSION,
        };
        byId.set(normalized.id, normalized);
      }

      this.putAll(tx, STORE.sessions, [
        {
          key: sessionId,
          value: {
            ...existing,
            supportExposures: [...byId.values()],
          },
        },
      ]);
    });
  }

  // ------------------------------------------------------------------- evidence

  /**
   * Every observation, including hidden and disputed ones.
   *
   * Matches the native repository: hidden evidence stays readable on the device so
   * the learner can see what was removed and why. Filtering it here would make
   * "hide" indistinguishable from "never happened", and would leave web showing a
   * different ledger from native.
   */
  async getObservations(): Promise<LearningObservation[]> {
    const observations = await this.readAll<LearningObservation>(STORE.observations);
    return observations.sort((a, b) => (b.recordedAt ?? '').localeCompare(a.recordedAt ?? ''));
  }

  private async updateObservation(
    id: string,
    change: { hidden?: boolean; userDisputed?: boolean }
  ): Promise<void> {
    await this.transaction(async tx => {
      const store = tx.objectStore(STORE.observations);
      const all = await this.request<LearningObservation[]>(store.getAll());
      const existing = all.find(o => o.observationId === id);
      if (!existing) return;
      store.put({ ...existing, ...change }, this.observationKey(existing));
      const session = await this.loadSessionIn(tx, existing.sessionId);
      if (session) this.putAll(tx, STORE.sessions, [{ key: session.id, value: {
        ...session,
        observations: (session.observations ?? []).map(o => o.observationId === id ? { ...o, ...change } : o),
      } }]);
      await this.reprojectPhrasesIn(tx);
    });
  }

  async hideObservation(observationId: string): Promise<void> {
    await this.updateObservation(observationId, { hidden: true });
  }

  async disputeObservation(observationId: string): Promise<void> {
    await this.updateObservation(observationId, { hidden: true, userDisputed: true });
  }

  async getSkillObservations(): Promise<SkillObservation[]> {
    const observations = await this.readAll<SkillObservation & { hidden?: boolean }>(
      STORE.skillObservations
    );
    return observations
      .filter(o => !o.hidden)
      .map(o => ({ ...o, reasonCodes: o.reasonCodes ?? [] }))
      .sort((a, b) => (b.recordedAt ?? '').localeCompare(a.recordedAt ?? ''));
  }

  async hideSkillObservation(observationId: string): Promise<void> {
    await this.setSkillObservationFlag(observationId, { hidden: true });
  }

  async disputeSkillObservation(observationId: string): Promise<void> {
    await this.setSkillObservationFlag(observationId, { hidden: true, userDisputed: true });
  }

  private async setSkillObservationFlag(
    id: string,
    change: { hidden?: boolean; userDisputed?: boolean }
  ): Promise<void> {
    await this.transaction(async tx => {
      const store = tx.objectStore(STORE.skillObservations);
      const existing = await this.request(
        store.get(id) as IDBRequest<SkillObservation>
      );
      if (!existing) return;
      store.put({ ...existing, ...change });
    });
  }

  async getSkillLapses(): Promise<SkillLapse[]> {
    const lapses = await this.readAll<SkillLapse & { hidden?: boolean }>(STORE.skillLapses);
    return lapses
      .filter(l => !l.hidden)
      .sort((a, b) => (b.recordedAt ?? '').localeCompare(a.recordedAt ?? ''));
  }

  // -------------------------------------------------------------------- phrases

  async getPhrases(): Promise<PhraseItem[]> {
    const phrases = await this.transaction(async tx => {
      const stored = await this.request<PhraseItem[]>(tx.objectStore(STORE.phrases).getAll());
      const existingIds = new Set(stored.map(p => p.id));
      const missing = INITIAL_PHRASE_ITEMS.filter(p => !existingIds.has(p.id));
      // Only new catalog rows are written, never a stale copy of existing recall.
      this.putDocs(tx, STORE.phrases, missing, p => p.id);
      return [...stored, ...missing];
    });

    // "Due" is derived at read time, never stored.
    const now = Date.now();
    return phrases.map(p => ({
      ...p,
      scheduling: { ...p.scheduling, due: isDue(p.scheduling.nextReviewAt, now) },
    }));
  }

  async savePhrases(phrases: PhraseItem[]): Promise<void> {
    await this.transaction(async tx => {
      this.putDocs(tx, STORE.phrases, phrases, p => p.id);
    });
  }

  async resetPhrase(phraseId: string): Promise<void> {
    const phrases = await this.getPhrases();
    await this.savePhrases(
      phrases.map(p =>
        p.id === phraseId
          ? {
              ...p,
              recallStatus: 'new' as const,
              scheduling: {
                ...p.scheduling,
                nextReviewAt: new Date(Date.now() - 3_600_000).toISOString(),
                due: true,
                intervalDays: 1,
              },
              stats: { assistedCount: 0, unassistedCount: 0, spokenCount: 0, typedCount: 0 },
            }
          : p
      )
    );
  }

  /**
   * Rebuilds every phrase projection from the validated ledger.
   *
   * Seeds the catalog first when empty, otherwise a session completed before the
   * learner ever opened Progress would reproject nothing and its evidence would sit
   * unapplied.
   */
  async rebuildPhraseProjections(): Promise<void> {
    await this.transaction(async tx => {
      await this.reprojectPhrasesIn(tx);
      const [sessions, observations] = await Promise.all([
        this.request<StoredSession[]>(tx.objectStore(STORE.sessions).getAll()),
        this.request<LearningObservation[]>(tx.objectStore(STORE.observations).getAll()),
      ]);
      // Repair old embedded recap caches from the same authoritative ledger.
      const bySession = new Map<string, LearningObservation[]>();
      for (const observation of observations) {
        const rows = bySession.get(observation.sessionId) ?? [];
        rows.push(observation);
        bySession.set(observation.sessionId, rows);
      }
      this.putDocs(tx, STORE.sessions, sessions.map(session => ({
        ...session, observations: bySession.get(session.id) ?? [],
      })), session => session.id);
    });
  }

  private async reprojectPhrasesIn(tx: IDBTransaction): Promise<void> {
    const [storedPhrases, observations] = await Promise.all([
      this.request<PhraseItem[]>(tx.objectStore(STORE.phrases).getAll()),
      this.request<LearningObservation[]>(tx.objectStore(STORE.observations).getAll()),
    ]);
    const existingIds = new Set(storedPhrases.map(p => p.id));
    const phrases = [...storedPhrases, ...INITIAL_PHRASE_ITEMS.filter(p => !existingIds.has(p.id))];

    const projected = phrases.map(current => {
      return projectPhraseState(current, observations.filter(o => o.itemId === current.id));
    });
    this.putDocs(tx, STORE.phrases, projected, p => p.id);
  }

  // ------------------------------------------------------------------- deletion

  async markDeleted(scope: 'session' | 'all', targetId?: string): Promise<string> {
    const id = `del-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await this.transaction(async tx => {
      this.putAll(tx, STORE.deletions, [
        { key: id, value: { id, scope, targetId: targetId ?? null, createdAt: new Date().toISOString() } },
      ]);
    });
    return id;
  }

  async isDeleted(sessionId: string, sessionStartedAt?: string): Promise<boolean> {
    const markers = await this.readAll<{
      id: string;
      scope: string;
      targetId: string | null;
      createdAt: string;
    }>(STORE.deletions);
    return markers.some(marker => {
      if (marker.scope === 'session' && marker.targetId === sessionId) return true;
      if (marker.scope !== 'all') return false;
      return !sessionStartedAt || marker.createdAt >= sessionStartedAt;
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    // Marker first: late async work must fail closed even while row deletion runs.
    await this.markDeleted('session', sessionId);

    await this.transaction(async tx => {
      const [observations, skillObservations, lapses] = await Promise.all([
        this.request<LearningObservation[]>(tx.objectStore(STORE.observations).getAll()),
        this.request<SkillObservation[]>(tx.objectStore(STORE.skillObservations).getAll()),
        this.request<SkillLapse[]>(tx.objectStore(STORE.skillLapses).getAll()),
      ]);
      tx.objectStore(STORE.sessions).delete(sessionId);

      // Evidence is deleted by key. Re-putting the survivors would leave this
      // session's own records in place, because they are never overwritten by
      // anything else.
      const observationStore = tx.objectStore(STORE.observations);
      for (const observation of observations) {
        if (observation.sessionId === sessionId) {
          observationStore.delete(this.observationKey(observation));
        }
      }

      const skillStore = tx.objectStore(STORE.skillObservations);
      for (const observation of skillObservations) {
        if (observation.sessionId === sessionId) skillStore.delete(observation.id);
      }

      const lapseStore = tx.objectStore(STORE.skillLapses);
      for (const lapse of lapses) {
        if (lapse.sessionId === sessionId) lapseStore.delete(lapse.id);
      }
      await this.reprojectPhrasesIn(tx);
    });
  }

  async clearAllLearningData(): Promise<void> {
    // Marker first for the same reason as a single-session delete.
    await this.markDeleted('all');
    const current = await this.getPreferences();
    const clearedPreferences: UserPreferences = {
      ...current,
      programPreferences: [],
      programGoals: [],
      continuityProfile: { facts: [] },
    };

    await this.transaction(async tx => {
      this.deleteAll(tx, STORE.sessions);
      this.deleteAll(tx, STORE.observations);
      this.deleteAll(tx, STORE.skillObservations);
      this.deleteAll(tx, STORE.skillLapses);
      this.deleteAll(tx, STORE.phrases);
      this.deleteAll(tx, STORE.jobs);
      this.putAll(tx, STORE.meta, [
        {
          key: PREFERENCES_ID,
          value: { id: PREFERENCES_ID, payload: clearedPreferences },
        },
      ]);
    });
  }

  // --------------------------------------------------------------------- review

  async recordDrillReview(input: {
    phrase: PhraseItem;
    evidence: ValidatedPhraseEvidence;
  }): Promise<void> {
    const { phrase, evidence } = input;
    assertValidatedPhraseEvidence(evidence);
    const observations = [...evidence.observations];

    for (const observation of observations) {
      if (observation.itemId !== phrase.id) {
        throw new Error('Phrase evidence item does not match drill phrase');
      }
    }
    if (observations.length === 0) return;

    await this.transaction(async tx => {
      const consent = await this.request<ConsentRecord | undefined>(
        tx.objectStore(STORE.consent).get('saved_analysis')
      );
      if (consent?.granted !== true || consent.withdrawnAt) return;
      this.putDocs(tx, STORE.observations, observations, o => this.observationKey(o));
      await this.reprojectPhrasesIn(tx);
    });
  }

  // ----------------------------------------------------------------------- jobs

  async enqueueJob(kind: string, targetId?: string, payload?: unknown): Promise<void> {
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const job = {
      id,
      kind,
      targetId: targetId ?? null,
      payload: payload ?? null,
      createdAt: new Date().toISOString(),
    };

    await this.transaction(async tx => {
      this.putAll(tx, STORE.jobs, [{ key: id, value: job }]);
    });
  }

  async getPendingJobs(): Promise<Array<{ id: string; kind: string; targetId?: string }>> {
    const jobs = await this.readAll<{ id: string; kind: string; targetId: string | null }>(
      STORE.jobs
    );
    return jobs.map(job => ({
      id: job.id,
      kind: job.kind,
      targetId: job.targetId ?? undefined,
    }));
  }

  async removePendingJob(id: string): Promise<void> {
    await this.transaction(async tx => {
      tx.objectStore(STORE.jobs).delete(id);
    });
  }

  /**
   * Drops the whole web archive and forgets the cached handle.
   *
   * Test-only. Without it a fresh repository instance would still see the previous
   * test's data, because IndexedDB outlives the object that opened it — which is
   * the correct behaviour in production and the wrong behaviour in a test.
   */
  async __resetForTesting(): Promise<void> {
    this.opened?.close();
    this.opened = null;
    this.dbPromise = null;
    if (typeof indexedDB === 'undefined') return;

    await new Promise<void>(resolve => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      // Blocked means a handle is still open; nothing to do but move on.
      request.onblocked = () => resolve();
    });
  }

  // --------------------------------------------------------------------- export

  async exportArchiveJson(): Promise<string> {
    const [
      preferences,
      sessions,
      observations,
      phrases,
      skillObservations,
      skillLapses,
      voiceConsent,
      savedAnalysisConsent,
      pendingJobs,
      deletionMarkers,
    ] = await Promise.all([
      this.getPreferences(),
      this.getSessions(),
      this.getObservations(),
      this.getPhrases(),
      this.getSkillObservations(),
      this.getSkillLapses(),
      this.getConsent('voice'),
      this.getConsent('saved_analysis'),
      this.getPendingJobs(),
      this.readAll<{
        id: string;
        scope: string;
        targetId: string | null;
        createdAt: string;
      }>(STORE.deletions),
    ]);

    return JSON.stringify(
      {
        version: 1,
        schemaVersion: 1,
        storageSchemaVersion: LATEST_SCHEMA_VERSION,
        policyVersion: LEARNING_POLICY_VERSION,
        consentVersion: CONSENT_VERSION,
        exportedAt: new Date().toISOString(),
        preferences,
        consentRecords: [voiceConsent, savedAnalysisConsent].filter(Boolean),
        sessions,
        observations,
        skillObservations,
        skillLapses,
        phrases,
        pendingJobs,
        deletionMarkers,
        contentProvenance: sessions.map(session => ({
          sessionId: session.id,
          missionId: session.missionId,
          missionVersion: session.missionVersion,
          sceneId: session.sceneState.sceneId,
          programContext: session.programContext,
        })),
      },
      null,
      2
    );
  }
  async importArchiveJson(json: string): Promise<{
    success: boolean;
    message: string;
    counts?: { sessions: number; phrases: number; observations: number };
  }> {
    let parsed: any;
    try {
      parsed = JSON.parse(json);
    } catch (err) {
      return { success: false, message: `Failed to import archive: ${(err as Error).message}` };
    }

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'Invalid JSON payload format' };
    }

    // Validate everything before mutating anything. A malformed archive must not
    // be able to leave the learner with half an archive and no undo.
    if (parsed.schemaVersion !== undefined && parsed.schemaVersion !== 1) {
      return {
        success: false,
        message: `Unsupported archive schema version: ${parsed.schemaVersion}`,
      };
    }

    if (!Array.isArray(parsed.sessions) || !Array.isArray(parsed.phrases)) {
      return { success: false, message: 'Archive is missing sessions or phrases' };
    }

    for (const phrase of parsed.phrases) {
      if (typeof phrase?.id !== 'string' || typeof phrase?.form !== 'string') {
        return { success: false, message: 'Archive contains a malformed phrase' };
      }
    }

    for (const session of parsed.sessions) {
      if (typeof session?.id !== 'string' || typeof session?.missionId !== 'string') {
        return { success: false, message: 'Archive contains a malformed session' };
      }
      if (Array.isArray(session.observations)) {
        for (const observation of session.observations) {
          if (typeof observation?.quote !== 'string') {
            return {
              success: false,
              message: 'Archive contains an observation without a quote',
            };
          }
        }
      }
    }

    const preferences = parsed.preferences
      ? { ...DEFAULT_PREFERENCES, ...parsed.preferences }
      : null;

    // One transaction for the whole import.
    await this.transaction(async tx => {
      if (preferences) {
        this.putAll(tx, STORE.meta, [{ key: PREFERENCES_ID, value: { id: PREFERENCES_ID, payload: preferences } }]);
      }
      for (const session of parsed.sessions) {
        const {
          observations: _observations,
          skillObservations: _skillObservations,
          skillLapses: _skillLapses,
          ...safeImportedSession
        } = session;
        this.putAll(tx, STORE.sessions, [
          {
            key: session.id,
            value: {
              ...safeImportedSession,
              coldAttempt: true,
              // Imported embedded evidence is not promoted into live learning
              // truth. Dedicated evidence must pass a validator-owned path.
              observations: [],
              skillObservations: [],
              skillLapses: [],
            } as StoredSession,
          },
        ]);
      }
      const safePhrases = (parsed.phrases as PhraseItem[]).map(imported => {
        const canonical = INITIAL_PHRASE_ITEMS.find(item => item.id === imported.id);
        const base = canonical ?? imported;
        return {
          ...base,
          recallStatus: 'new' as const,
          scheduling: {
            ...base.scheduling,
            nextReviewAt: new Date(0).toISOString(),
            due: true,
            intervalDays: LEARNING_POLICY.intervals.new,
            modalityHistory: [],
            contexts: [],
          },
          stats: {
            assistedCount: 0,
            unassistedCount: 0,
            spokenCount: 0,
            typedCount: 0,
          },
        };
      });
      this.putDocs(tx, STORE.phrases, safePhrases, p => p.id);
    });

    await this.rebuildPhraseProjections();

    return {
      success: true,
      message:
        `Successfully restored ${parsed.sessions.length} sessions and ${parsed.phrases.length} phrases. ` +
        'Imported learning evidence was not activated because it must be revalidated.',
      counts: {
        sessions: parsed.sessions.length,
        phrases: parsed.phrases.length,
        observations: 0,
      },
    };
  }

  async exportLearningReceiptText(session: SessionRecord): Promise<string> {
    return renderLearningReceipt(session, await this.getPhrases());
  }
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map(item => [item.id, item])).values()];
}

function toSessionRecord(stored: StoredSession): SessionRecord {
  return {
    ...stored,
    coldAttempt: stored.coldAttempt ?? true,
    taskOutcome: stored.taskOutcome ?? 'unknown',
    passages: stored.passages ?? [],
    supportExposures: stored.supportExposures ?? [],
    opportunityInstances: stored.opportunityInstances ?? [],
    observations: stored.observations ?? [],
  } as SessionRecord;
}

export const archiveRepository: ArchiveRepository = new IndexedDbArchiveRepository();
