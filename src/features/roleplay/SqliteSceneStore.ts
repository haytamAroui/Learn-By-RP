import type {
  SceneActionProposal,
  SceneActionResult,
  SceneForkRequest,
  SceneStateSnapshot,
} from './runtime';

/**
 * Durable storage for hosted scene truth (§13.4).
 *
 * The production target is a PostgreSQL `hosted_sessions` + `scene_events` pair
 * with an idempotency index on action_id. This is the same shape on SQLite, so
 * an abandoned session survives a process restart and a recovery worker can
 * reconcile it rather than the whole scene being lost.
 */
export interface SceneStore {
  get(sessionId: string): Promise<HostedSessionRecord | null>;
  put(record: HostedSessionRecord): Promise<void>;
  getResult(sessionId: string, actionId: string): Promise<SceneActionResult | null>;
  putResult(
    sessionId: string,
    proposal: SceneActionProposal,
    result: SceneActionResult
  ): Promise<void>;
  listEvents(sessionId: string, attemptId: string): Promise<StoredSceneEvent[]>;
  listAbandoned(olderThanMs: number, ownerIdentity?: string): Promise<AbandonedSession[]>;
  markReconciled(sessionId: string): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  transaction<T>(work: (tx: SceneStoreTransaction) => Promise<T>): Promise<T>;
}

export type SceneStoreTransaction = Pick<SceneStore,
  'get' | 'put' | 'getResult' | 'putResult' | 'listEvents' | 'markReconciled' | 'deleteSession'>;

export interface HostedSessionRecord {
  sessionId: string;
  ownerIdentity: string;
  sceneId: string;
  sceneVersion: number;
  missionId: string;
  missionVersion: number;
  state: SceneStateSnapshot;
  createdAt: string;
  closedAt?: string;
  /** Set once a recovery worker has reconciled the session. */
  reconciledAt?: string;
  attempts: AttemptRecord[];
}

export interface AttemptRecord {
  attemptId: string;
  parentAttemptId?: string;
  /**
   * Full retry checkpoint. The support high-water mark is metadata, not a
   * rewind position; it records what the learner had already been shown.
   */
  checkpoint?: SceneForkRequest['checkpoint'];
  /** Legacy field retained only so old persisted attempt JSON remains readable. */
  checkpointId?: string;
  rehearsal: boolean;
  createdAt: string;
}

export interface StoredSceneEvent {
  sessionId: string;
  actionId: string;
  attemptId: string;
  result: SceneActionResult;
  appliedAt: string;
}

export interface AbandonedSession {
  sessionId: string;
  sceneId: string;
  state: string;
  createdAt: string;
  lastEventAt: string;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS hosted_sessions (
    session_id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL,
    scene_version INTEGER NOT NULL DEFAULT 1,
    mission_id TEXT NOT NULL,
    mission_version INTEGER NOT NULL DEFAULT 1,
    state_json TEXT NOT NULL,
    attempts_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    closed_at TEXT,
    reconciled_at TEXT,
    owner_identity TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS scene_events (
    session_id TEXT NOT NULL,
    action_id TEXT NOT NULL,
    attempt_id TEXT NOT NULL,
    action_name TEXT NOT NULL,
    payload_json TEXT,
    result_json TEXT NOT NULL,
    revision INTEGER NOT NULL,
    applied_at TEXT NOT NULL,
    PRIMARY KEY (session_id, action_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_scene_events_session ON scene_events(session_id, revision);`,
];

export class SqliteSceneStore implements SceneStore {
  private transactionTail: Promise<void> = Promise.resolve();

  constructor(private readonly db: SceneStoreDb) {}

  async transaction<T>(work: (tx: SceneStoreTransaction) => Promise<T>): Promise<T> {
    let release!: () => void;
    const previous = this.transactionTail;
    this.transactionTail = new Promise<void>(resolve => { release = resolve; });
    await previous;
    try {
      await this.db.execAsync('BEGIN IMMEDIATE');
      const result = await work(this);
      await this.db.execAsync('COMMIT');
      return result;
    } catch (error) {
      await this.db.execAsync('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      release();
    }
  }

  static async open(db: SceneStoreDb): Promise<SqliteSceneStore> {
    for (const statement of SCHEMA) {
      await db.execAsync(statement);
    }

    // Forward-compatible columns for stores created before runtime contract v3.
    for (const migration of [
      `ALTER TABLE hosted_sessions ADD COLUMN scene_version INTEGER NOT NULL DEFAULT 1;`,
      `ALTER TABLE hosted_sessions ADD COLUMN mission_version INTEGER NOT NULL DEFAULT 1;`,
      `ALTER TABLE hosted_sessions ADD COLUMN owner_identity TEXT;`,
    ]) {
      try {
        await db.execAsync(migration);
      } catch (error) {
        if (!String(error).toLowerCase().includes('duplicate column')) throw error;
      }
    }

    return new SqliteSceneStore(db);
  }

  async get(sessionId: string): Promise<HostedSessionRecord | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM hosted_sessions WHERE session_id = ?',
      sessionId
    );
    if (!row) return null;

    return {
      sessionId: String(row.session_id),
      ownerIdentity: String(row.owner_identity ?? ''),
      sceneId: String(row.scene_id),
      sceneVersion: Number(row.scene_version ?? 1),
      missionId: String(row.mission_id),
      missionVersion: Number(row.mission_version ?? 1),
      state: JSON.parse(String(row.state_json)) as SceneStateSnapshot,
      attempts: JSON.parse(String(row.attempts_json)) as AttemptRecord[],
      createdAt: String(row.created_at),
      closedAt: row.closed_at ? String(row.closed_at) : undefined,
      reconciledAt: row.reconciled_at ? String(row.reconciled_at) : undefined,
    };
  }

  async put(record: HostedSessionRecord): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO hosted_sessions
        (session_id, scene_id, scene_version, mission_id, mission_version, state_json, attempts_json, created_at, closed_at, reconciled_at, owner_identity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      record.sessionId,
      record.sceneId,
      record.sceneVersion,
      record.missionId,
      record.missionVersion,
      JSON.stringify(record.state),
      JSON.stringify(record.attempts),
      record.createdAt,
      record.closedAt ?? null,
      record.reconciledAt ?? null,
      record.ownerIdentity
    );
  }

  async getResult(sessionId: string, actionId: string): Promise<SceneActionResult | null> {
    const row = await this.db.getFirstAsync<{ result_json: string }>(
      'SELECT result_json FROM scene_events WHERE session_id = ? AND action_id = ?',
      sessionId,
      actionId
    );
    return row ? (JSON.parse(row.result_json) as SceneActionResult) : null;
  }

  async putResult(
    sessionId: string,
    proposal: SceneActionProposal,
    result: SceneActionResult
  ): Promise<void> {
    // Accepted and rejected proposals share the same idempotency log. This makes
    // retries deterministic across HTTP/realtime channels: the first reducer
    // verdict for an actionId is the only verdict that can ever be observed.
    await this.db.runAsync(
      `INSERT OR IGNORE INTO scene_events
        (session_id, action_id, attempt_id, action_name, payload_json, result_json, revision, applied_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      sessionId,
      result.actionId,
      proposal.attemptId,
      proposal.action,
      JSON.stringify(proposal.payload ?? {}),
      JSON.stringify(result),
      result.revision,
      result.appliedAt
    );
  }

  async listEvents(
    sessionId: string,
    attemptId: string
  ): Promise<StoredSceneEvent[]> {
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      `SELECT session_id, action_id, attempt_id, result_json, applied_at
       FROM scene_events
       WHERE session_id = ? AND attempt_id = ?
       ORDER BY applied_at ASC, rowid ASC`,
      sessionId,
      attemptId
    );

    return rows.map(row => ({
      sessionId: String(row.session_id),
      actionId: String(row.action_id),
      attemptId: String(row.attempt_id),
      result: JSON.parse(String(row.result_json)) as SceneActionResult,
      appliedAt: String(row.applied_at),
    }));
  }

  /**
   * Sessions that were open when the process died, with their last event time.
   * This is what a recovery worker reconciles rather than silently expiring.
   */
  async listAbandoned(olderThanMs: number, ownerIdentity?: string): Promise<AbandonedSession[]> {
    const cutoff = new Date(Date.now() - olderThanMs).toISOString();

    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      `SELECT s.session_id, s.scene_id, s.created_at, s.state_json,
              (SELECT MAX(applied_at) FROM scene_events e WHERE e.session_id = s.session_id) AS last_event
       FROM hosted_sessions s
       WHERE s.closed_at IS NULL AND s.reconciled_at IS NULL
         AND (? IS NULL OR s.owner_identity = ?)
         AND COALESCE(
           (SELECT MAX(applied_at) FROM scene_events e WHERE e.session_id = s.session_id),
           s.created_at
         ) < ?`,
      ownerIdentity ?? null,
      ownerIdentity ?? null,
      cutoff
    );

    return rows.map(row => ({
      sessionId: String(row.session_id),
      sceneId: String(row.scene_id),
      state: (JSON.parse(String(row.state_json)) as SceneStateSnapshot).revision
        ? (JSON.parse(String(row.state_json)) as SceneStateSnapshot).isFinished
          ? 'ended'
          : 'live'
        : 'unknown',
      createdAt: String(row.created_at),
      lastEventAt: String(row.last_event ?? row.created_at),
    }));
  }

  async markReconciled(sessionId: string): Promise<void> {
    await this.db.runAsync(
      'UPDATE hosted_sessions SET reconciled_at = ? WHERE session_id = ?',
      new Date().toISOString(),
      sessionId
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.db.runAsync('DELETE FROM scene_events WHERE session_id = ?', sessionId);
    await this.db.runAsync('DELETE FROM hosted_sessions WHERE session_id = ?', sessionId);
  }
}

/** The slice of the Db interface this store needs. */
export interface SceneStoreDb {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: Array<string | number | boolean | null>): Promise<void>;
  getAllAsync<T>(source: string, ...params: Array<string | number | boolean | null>): Promise<T[]>;
  getFirstAsync<T>(
    source: string,
    ...params: Array<string | number | boolean | null>
  ): Promise<T | null>;
}
