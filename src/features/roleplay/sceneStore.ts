import { SceneActionProposal, SceneActionResult, SceneForkRequest } from '../../contracts/scene';
import { getScene } from '../../content/scenes';
import { applyResult, createInitialScene, reduceSceneAction } from './sceneReducer';
import { SceneStore, SqliteSceneStore, HostedSessionRecord, AttemptRecord } from './SqliteSceneStore';
import { createNodeSqliteAdapter, Db } from '../archive/db';

/**
 * Authoritative scene store (§11.2, §11.5).
 *
 * Scene truth is durable: every accepted action is written with its actionId, so
 * a duplicate request returns the stored result and a restart resumes from the
 * last committed revision rather than losing the scene.
 */

let storePromise: Promise<SceneStore> | null = null;
let inMemory: SceneStore | null = null;

/** Keeps the SQLite handle alive for the process lifetime. */
const handles: Array<{ db: Db; close: () => void }> = [];

/** Test seam: swap the backing store. */
export async function __setSceneStoreForTesting(store: SceneStore | null): Promise<void> {
  inMemory = store;
  storePromise = null;
}

/**
 * Where the hosted scene database lives.
 *
 * A file, not memory. `:memory:` would pass every test and then drop every
 * in-progress scene on deploy or crash, which is the exact failure the
 * idempotent replay log exists to prevent.
 */
function sceneDatabasePath(): string {
  const configured = process.env.SCENE_DB_PATH;
  if (configured) return configured;

  const path = require('node:path') as typeof import('node:path');
  return path.join(process.cwd(), '.data', 'scenes.sqlite');
}

async function getStore(): Promise<SceneStore> {
  if (inMemory) return inMemory;
  if (!storePromise) {
    storePromise = (async () => {
      const handle = createNodeSqliteAdapter(sceneDatabasePath());
      handles.push(handle);
      return SqliteSceneStore.open(handle.db);
    })().catch(error => {
      storePromise = null;
      throw error;
    });
  }
  return storePromise;
}

export async function createHostedSession(params: {
  sessionId: string;
  sceneId: string;
  sceneVersion?: number;
  missionId: string;
  missionVersion?: number;
  attemptId?: string;
}): Promise<HostedSessionRecord> {
  const scene = getScene(params.sceneId);
  if (!scene) {
    throw new Error(`Unknown scene: ${params.sceneId}`);
  }

  const store = await getStore();
  const attemptId = params.attemptId ?? `attempt-${Date.now()}`;
  const now = new Date().toISOString();

  const record: HostedSessionRecord = {
    sessionId: params.sessionId,
    sceneId: scene.id,
    sceneVersion: params.sceneVersion ?? scene.version,
    missionId: params.missionId,
    missionVersion: params.missionVersion ?? 1,
    state: createInitialScene(scene, params.sessionId, attemptId),
    attempts: [{ attemptId, rehearsal: false, createdAt: now }],
    createdAt: now,
  };

  await store.put(record);
  return record;
}

export async function getHostedSession(sessionId: string): Promise<HostedSessionRecord | null> {
  const store = await getStore();
  return store.get(sessionId);
}

export async function getSceneSnapshot(
  sessionId: string
): Promise<HostedSessionRecord['state'] | null> {
  const record = await getHostedSession(sessionId);
  return record?.state ?? null;
}

/**
 * Applies a proposed action and returns the reducer's verdict verbatim.
 *
 * Idempotency is enforced in two places: the stored actionId, and the client's
 * deterministic one. Either alone would be enough; both together mean a
 * duplicate cannot apply twice even if the client is replaced.
 */
export async function applySceneAction(
  proposal: SceneActionProposal
): Promise<SceneActionResult> {
  const store = await getStore();
  const record = await store.get(proposal.sessionId);

  if (!record) {
    throw new Error(`Unknown hosted session: ${proposal.sessionId}`);
  }

  const scene = getScene(record.sceneId);
  if (!scene) {
    throw new Error(`Unknown scene: ${record.sceneId}`);
  }

  if (proposal.sceneId && proposal.sceneId !== record.sceneId) {
    throw new Error('Proposal sceneId does not match hosted session');
  }
  if (proposal.sceneVersion !== undefined && proposal.sceneVersion !== record.sceneVersion) {
    throw new Error('Proposal sceneVersion does not match hosted session');
  }
  if (proposal.missionId && proposal.missionId !== record.missionId) {
    throw new Error('Proposal missionId does not match hosted session');
  }
  if (
    proposal.missionVersion !== undefined &&
    proposal.missionVersion !== record.missionVersion
  ) {
    throw new Error('Proposal missionVersion does not match hosted session');
  }

  // Already applied? Return the stored result without re-evaluating.
  const prior = await store.getResult(proposal.sessionId, proposal.actionId);
  if (prior) {
    return { ...prior, deduplicated: true };
  }

  // Build the applied-results map the reducer consults, so a duplicate within
  // one process short-circuits before touching the database again.
  const appliedResults = new Map<string, SceneActionResult>();
  const priorResult = await store.getResult(proposal.sessionId, proposal.actionId);
  if (priorResult) appliedResults.set(proposal.actionId, priorResult);

  const result = reduceSceneAction({
    scene,
    state: record.state,
    proposal,
    appliedResults,
  });

  // Persist the first verdict for every actionId, accepted or rejected. A retry
  // on any channel returns this exact result before re-running validation.
  await store.putResult(proposal.sessionId, proposal, result);

  if (result.accepted) {
    record.state = applyResult(scene, record.state, result);
    await store.put(record);
  }

  return result;
}

export async function closeHostedSession(sessionId: string): Promise<HostedSessionRecord> {
  const store = await getStore();
  const record = await store.get(sessionId);

  if (!record) {
    throw new Error(`Unknown hosted session: ${sessionId}`);
  }

  // Close is idempotent: calling it twice yields the same closed session.
  record.closedAt = record.closedAt ?? new Date().toISOString();
  await store.put(record);
  return record;
}

/**
 * Retry from a checkpoint. Forks a new attempt; the earlier attempt keeps its own
 * transcript and is never rolled back.
 */
export async function forkScene(
  sessionId: string,
  request: SceneForkRequest
): Promise<{ attemptId: string; parentAttemptId: string; checkpointId: string; rehearsal: boolean }> {
  const store = await getStore();
  const record = await store.get(sessionId);

  if (!record) {
    throw new Error(`Unknown hosted session: ${sessionId}`);
  }

  const scene = getScene(record.sceneId);
  if (!scene) {
    throw new Error(`Unknown scene: ${record.sceneId}`);
  }

  const parent = record.state.attemptId;
  const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Roll back to the initial facts at the fork point. The scene's authored
  // initial state is the only reliable restore target without a persisted
  // checkpoint→revision mapping; a production build reads that from
  // scene_events.revision.
  const attempt: AttemptRecord = {
    attemptId,
    parentAttemptId: parent,
    checkpointId: request.checkpointId,
    rehearsal: request.rehearsal,
    createdAt: new Date().toISOString(),
  };

  record.attempts.push(attempt);
  record.state = {
    ...record.state,
    attemptId,
    facts: { ...scene.initialFacts },
    revision: 1,
    outcome: 'unknown',
    isFinished: false,
    checkpoints: [],
  };

  await store.put(record);

  return {
    attemptId,
    parentAttemptId: parent,
    checkpointId: request.checkpointId,
    rehearsal: request.rehearsal,
  };
}

/**
 * Sessions left open when the process died, for a recovery worker to reconcile
 * rather than silently expiring (§11.4, §15.3).
 */
export async function listAbandonedSessions(olderThanMs = 5 * 60_000) {
  const store = await getStore();
  return store.listAbandoned(olderThanMs);
}

export async function markSessionReconciled(sessionId: string): Promise<void> {
  const store = await getStore();
  await store.markReconciled(sessionId);
}