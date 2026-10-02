import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createNodeSqliteAdapter, Db } from '../archive/db';
import {
  __setSceneStoreForTesting,
  applySceneAction,
  closeHostedSession,
  createHostedSession,
  forkScene,
  getHostedSession,
  getSceneSnapshot,
  listAbandonedSessions,
  markSessionReconciled,
  rebuildSceneStateFromEventLog,
  reconcileHostedSession,
} from './sceneStore';
import { SqliteSceneStore } from './SqliteSceneStore';
import { CAFE_SCENE } from '../../content/scenes';
import type {
  RoleplayCheckpoint,
  SceneActionProposal,
} from '../../contracts/scene';

const SESSION = 'hosted-1';

let driver: { db: Db; close: () => void };

beforeEach(async () => {
  driver = createNodeSqliteAdapter();
  await __setSceneStoreForTesting(await SqliteSceneStore.open(driver.db));
});

afterEach(async () => {
  await __setSceneStoreForTesting(null);
  driver.close();
});

async function seedSession(sessionId = SESSION, attemptId = 'attempt-1') {
  return createHostedSession({
    sessionId,
    sceneId: CAFE_SCENE.id,
    missionId: CAFE_SCENE.missionId,
    attemptId,
  });
}

function retryCheckpoint(
  overrides: Partial<RoleplayCheckpoint> = {}
): RoleplayCheckpoint {
  return {
    id: 'cp-item-confirmed',
    sceneRevision: 2,
    passageIndex: 1,
    supportLedgerHighWaterMark: 2,
    completedOpportunityIds: [],
    ...overrides,
  };
}

function proposal(overrides: Partial<SceneActionProposal> = {}): SceneActionProposal {
  return {
    actionId: 'act-1',
    sessionId: SESSION,
    attemptId: 'attempt-1',
    expectedSceneRevision: 1,
    action: 'confirm_order_item',
    payload: { item: 'café con leche' },
    sourceTurnIds: ['p-1'],
    ...overrides,
  };
}

describe('hosted scene store', () => {
  it('creates a session at revision 1 with the authored initial facts', async () => {
    await seedSession();
    const snapshot = await getSceneSnapshot(SESSION);

    expect(snapshot?.revision).toBe(1);
    expect(snapshot?.facts.oatMilkAvailable).toBe(false);
    expect(snapshot?.outcome).toBe('unknown');
  });

  it('rejects a create for an unknown scene', async () => {
    await expect(
      createHostedSession({ sessionId: 'x', sceneId: 'nope', missionId: 'm' })
    ).rejects.toThrow(/Unknown scene/);
  });

  it('rejects an action for an unknown session', async () => {
    await expect(applySceneAction(proposal({ sessionId: 'ghost' }))).rejects.toThrow(
      /Unknown hosted session/
    );
  });
});

describe('double tool request produces one transition (test #3)', () => {
  it('applies once and returns the stored result on the repeat', async () => {
    await seedSession();

    const first = await applySceneAction(proposal());
    expect(first.accepted).toBe(true);
    expect(first.deduplicated).toBe(false);
    expect(first.revision).toBe(2);

    const second = await applySceneAction(proposal());
    expect(second.accepted).toBe(true);
    expect(second.deduplicated).toBe(true);
    expect(second.revision).toBe(2);
  });

  it('ignores a changed payload on a replayed actionId', async () => {
    await seedSession();

    const first = await applySceneAction(proposal({ payload: { item: 'tarta' } }));
    const second = await applySceneAction(proposal({ payload: { item: 'café con leche' } }));

    expect(first.newFacts.itemConfirmed).toBe(true);
    expect(second.deduplicated).toBe(true);
    expect(second.newFacts).toEqual(first.newFacts);

    const snapshot = await getSceneSnapshot(SESSION);
    expect(snapshot?.facts.itemConfirmed).toBe(true);
  });

  it('does not write a second scene event for a duplicate', async () => {
    await seedSession();
    await applySceneAction(proposal());
    await applySceneAction(proposal());

    const rows = await driver.db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM scene_events WHERE session_id = ?',
      SESSION
    );
    expect(rows[0].count).toBe(1);
  });
});

describe('rejected actions are idempotent across channels', () => {
  it('replays the first rejection for the same actionId without a second event', async () => {
    await seedSession();

    const first = await applySceneAction(
      proposal({ actionId: 'reject-1', action: 'hand_over_free_coffee' })
    );
    const second = await applySceneAction(
      proposal({
        actionId: 'reject-1',
        action: 'confirm_order_item',
        payload: { item: 'changed payload' },
      })
    );

    expect(first.accepted).toBe(false);
    expect(second.accepted).toBe(false);
    expect(second.deduplicated).toBe(true);
    expect(second.reason).toBe(first.reason);

    const rows = await driver.db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM scene_events WHERE session_id = ? AND action_id = ?',
      SESSION,
      'reject-1'
    );
    expect(rows[0].count).toBe(1);
  });
});

describe('stale revision is refused (test #6)', () => {
  it('rejects a proposal built against revision 1 once at revision 2', async () => {
    await seedSession();
    await applySceneAction(proposal());

    const stale = await applySceneAction(
      proposal({
        actionId: 'act-2',
        expectedSceneRevision: 1,
        action: 'confirm_takeaway',
        payload: {},
      })
    );

    expect(stale.accepted).toBe(false);
    expect(stale.reason).toMatch(/stale scene revision/i);
    expect((await getSceneSnapshot(SESSION))?.revision).toBe(2);
  });

  it('accepts the corrected proposal at the current revision', async () => {
    await seedSession();
    await applySceneAction(proposal());

    const corrected = await applySceneAction(
      proposal({
        actionId: 'act-3',
        expectedSceneRevision: 2,
        action: 'confirm_takeaway',
        payload: {},
      })
    );

    expect(corrected.accepted).toBe(true);
  });
});

describe('unsupported action is rejected with options (test #2)', () => {
  it('refuses an action the scene does not allowlist', async () => {
    await seedSession();
    const result = await applySceneAction(proposal({ action: 'hand_over_free_coffee' }));

    expect(result.accepted).toBe(false);
    expect(result.permissibleOptions).toContain('confirm_order_item');
  });

  it('actor speech cannot override the rejection', async () => {
    await seedSession();
    const before = await getSceneSnapshot(SESSION);

    await applySceneAction(proposal({ action: 'hand_over_free_coffee' }));
    const after = await getSceneSnapshot(SESSION);

    expect(after?.facts).toEqual(before?.facts);
    expect(after?.revision).toBe(before?.revision);
  });
});

describe('retry forks an attempt and preserves the earlier one (test #7)', () => {
  it('creates a new attempt id and records it as rehearsal', async () => {
    await seedSession();
    await applySceneAction(proposal());

    const fork = await forkScene(SESSION, { checkpoint: retryCheckpoint(), rehearsal: true });
    expect(fork.attemptId).not.toBe('attempt-1');
    expect(fork.parentAttemptId).toBe('attempt-1');
    expect(fork.rehearsal).toBe(true);

    const record = await getHostedSession(SESSION);
    expect(record?.attempts).toHaveLength(2);
    expect(record?.attempts[0].attemptId).toBe('attempt-1');
  });

  it('restores the exact authored checkpoint instead of resetting to scene start', async () => {
    await seedSession();
    await applySceneAction(proposal());
    await applySceneAction(
      proposal({
        actionId: 'settle-1',
        expectedSceneRevision: 2,
        action: 'confirm_takeaway',
        payload: {},
      })
    );

    const fork = await forkScene(SESSION, {
      checkpoint: retryCheckpoint(),
      rehearsal: false,
    });
    const snapshot = await getSceneSnapshot(SESSION);

    expect(snapshot?.attemptId).toBe(fork.attemptId);
    expect(snapshot?.revision).toBe(2);
    expect(snapshot?.facts.itemConfirmed).toBe(true);
    expect(snapshot?.facts.serviceMode).toBe('unset');
    expect(snapshot?.checkpoints).toContainEqual(
      expect.objectContaining({
        id: 'cp-item-confirmed',
        sceneRevision: 2,
      })
    );
  });

  it('rejects a forged checkpoint that is not present in the parent replay', async () => {
    await seedSession();
    await applySceneAction(proposal());

    await expect(
      forkScene(SESSION, {
        checkpoint: retryCheckpoint({
          id: 'cp-not-authored',
        }),
        rehearsal: true,
      })
    ).rejects.toThrow(/not an authored checkpoint/i);
  });

  it('rejects a proposal from the pre-fork attempt', async () => {
    await seedSession();
    await applySceneAction(proposal());
    await forkScene(SESSION, { checkpoint: retryCheckpoint(), rehearsal: true });

    const orphaned = await applySceneAction(
      proposal({ actionId: 'act-9', attemptId: 'attempt-1', expectedSceneRevision: 1 })
    );

    expect(orphaned.accepted).toBe(false);
    expect(orphaned.reason).toMatch(/different attempt/i);
  });
});

describe('durability', () => {
  it('survives a fresh store over the same database', async () => {
    await seedSession();
    await applySceneAction(proposal());

    // A second store instance stands in for a process restart.
    await __setSceneStoreForTesting(await SqliteSceneStore.open(driver.db));

    const snapshot = await getSceneSnapshot(SESSION);
    expect(snapshot?.revision).toBe(2);
    expect(snapshot?.facts.itemConfirmed).toBe(true);
  });

  it('still deduplicates after a restart', async () => {
    await seedSession();
    await applySceneAction(proposal());

    await __setSceneStoreForTesting(await SqliteSceneStore.open(driver.db));

    const replay = await applySceneAction(proposal());
    expect(replay.deduplicated).toBe(true);
  });

  it('keeps separate sessions isolated', async () => {
    await seedSession(SESSION);
    await createHostedSession({
      sessionId: 'hosted-2',
      sceneId: CAFE_SCENE.id,
      missionId: CAFE_SCENE.missionId,
      attemptId: 'attempt-1',
    });

    await applySceneAction(proposal({ sessionId: 'hosted-2' }));

    expect((await getSceneSnapshot('hosted-2'))?.facts.itemConfirmed).toBe(true);
    expect((await getSceneSnapshot(SESSION))?.facts.itemConfirmed).toBe(false);
  });
});

describe('event-log scene recovery', () => {
  it('repairs a stale snapshot from an accepted durable event', async () => {
    const initial = await seedSession();
    await applySceneAction(proposal());

    // Simulate the crash window after scene_events commit but before state_json commit.
    await driver.db.runAsync(
      'UPDATE hosted_sessions SET state_json = ? WHERE session_id = ?',
      JSON.stringify(initial.state),
      SESSION
    );

    const stale = await getSceneSnapshot(SESSION);
    expect(stale?.revision).toBe(1);

    const rebuilt = await rebuildSceneStateFromEventLog(SESSION);
    expect(rebuilt.revision).toBe(2);
    expect(rebuilt.facts.itemConfirmed).toBe(true);

    const reconciled = await reconcileHostedSession(SESSION);
    expect(reconciled.state.revision).toBe(2);
    expect((await getSceneSnapshot(SESSION))?.facts.itemConfirmed).toBe(true);
  });

  it('keeps rejected events audit-only during replay', async () => {
    await seedSession();
    await applySceneAction(
      proposal({ actionId: 'reject-replay', action: 'hand_over_free_coffee' })
    );

    const rebuilt = await rebuildSceneStateFromEventLog(SESSION);
    expect(rebuilt.revision).toBe(1);
    expect(rebuilt.facts.itemConfirmed).toBe(false);
  });

  it('replays only the current fork attempt', async () => {
    await seedSession();
    await applySceneAction(proposal());

    const fork = await forkScene(SESSION, {
      checkpoint: retryCheckpoint(),
      rehearsal: true,
    });

    await applySceneAction(
      proposal({
        actionId: 'fork-act',
        attemptId: fork.attemptId,
        expectedSceneRevision: 2,
        action: 'confirm_takeaway',
        payload: {},
      })
    );

    const rebuilt = await rebuildSceneStateFromEventLog(SESSION);
    expect(rebuilt.attemptId).toBe(fork.attemptId);
    expect(rebuilt.revision).toBe(3);
    expect(rebuilt.facts.itemConfirmed).toBe(true);
    expect(rebuilt.facts.serviceMode).toBe('takeaway');
  });
});

describe('close and recovery', () => {
  it('close is idempotent', async () => {
    await seedSession();

    const first = await closeHostedSession(SESSION);
    const second = await closeHostedSession(SESSION);

    expect(second.closedAt).toBe(first.closedAt);
  });

  it('does not list a closed session as abandoned', async () => {
    await seedSession();
    await closeHostedSession(SESSION);

    const abandoned = await listAbandonedSessions(-1);
    expect(abandoned.find(s => s.sessionId === SESSION)).toBeUndefined();
  });

  it('reports an open session as abandoned once it is old enough', async () => {
    await seedSession();
    await applySceneAction(proposal());

    const abandoned = await listAbandonedSessions(-1);
    expect(abandoned.map(s => s.sessionId)).toContain(SESSION);
  });

  it('stops reporting a session once reconciled', async () => {
    await seedSession();
    await markSessionReconciled(SESSION);

    const abandoned = await listAbandonedSessions(-1);
    expect(abandoned.map(s => s.sessionId)).not.toContain(SESSION);
  });

  it('reconciling is idempotent', async () => {
    await seedSession();

    await markSessionReconciled(SESSION);
    await markSessionReconciled(SESSION);

    const record = await getHostedSession(SESSION);
    expect(record?.reconciledAt).toBeTruthy();
  });
});

/**
 * Restart durability against a real database file.
 *
 * The tests above reopen a store over the same open handle, which proves a new
 * object can read the rows but proves nothing about a process dying. These close
 * the handle completely and reopen from disk, which is what a crash or a deploy
 * actually does. An in-memory database passes every other test in this file and
 * fails here.
 */
describe('restart durability on disk', () => {
  const fs = require('node:fs') as typeof import('node:fs');
  const os = require('node:os') as typeof import('node:os');
  const path = require('node:path') as typeof import('node:path');

  let file: string;
  let handle: { db: Db; close: () => void } | null = null;

  beforeEach(() => {
    file = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), 'scene-store-')),
      'scenes.sqlite'
    );
  });

  afterEach(async () => {
    await __setSceneStoreForTesting(null);
    handle?.close();
    handle = null;
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
  });

  it('keeps the scene and its revision across a full close and reopen', async () => {
    handle = createNodeSqliteAdapter(file);
    await __setSceneStoreForTesting(await SqliteSceneStore.open(handle.db));

    await seedSession();
    await applySceneAction(proposal());

    // The process goes away: handle closed, no shared memory, nothing cached.
    handle.close();
    handle = null;
    await __setSceneStoreForTesting(null);

    handle = createNodeSqliteAdapter(file);
    await __setSceneStoreForTesting(await SqliteSceneStore.open(handle.db));

    const snapshot = await getSceneSnapshot(SESSION);
    expect(snapshot?.revision).toBe(2);
    expect(snapshot?.facts.itemConfirmed).toBe(true);
  });

  it('keeps deduplicating across a restart', async () => {
    handle = createNodeSqliteAdapter(file);
    await __setSceneStoreForTesting(await SqliteSceneStore.open(handle.db));

    await seedSession();
    await applySceneAction(proposal());

    handle.close();
    handle = null;
    await __setSceneStoreForTesting(null);

    handle = createNodeSqliteAdapter(file);
    await __setSceneStoreForTesting(await SqliteSceneStore.open(handle.db));

    // The client retries the action it never saw a response for.
    const replay = await applySceneAction(proposal());
    expect(replay.deduplicated).toBe(true);
  });

  it('still rejects a stale revision after a restart', async () => {
    handle = createNodeSqliteAdapter(file);
    await __setSceneStoreForTesting(await SqliteSceneStore.open(handle.db));

    await seedSession();
    await applySceneAction(proposal());

    handle.close();
    handle = null;
    await __setSceneStoreForTesting(null);

    handle = createNodeSqliteAdapter(file);
    await __setSceneStoreForTesting(await SqliteSceneStore.open(handle.db));

    // A different client, still working from revision 1, sends a new action.
    // It must not overwrite the committed revision 2. (Replaying the original
    // actionId would short-circuit as a duplicate before the revision was ever
    // checked, which is a different guarantee.)
    const stale = await applySceneAction(
      proposal({
        actionId: 'act-2',
        expectedSceneRevision: 1,
        payload: { item: 'té verde' },
      })
    );

    expect(stale.accepted).toBe(false);
    expect(stale.reason).toMatch(/stale scene revision/i);
    expect((await getSceneSnapshot(SESSION))?.revision).toBe(2);
  });

  it('does not persist across separate in-memory databases', async () => {
    // The reason the server must not use `:memory:`: two handles that share no
    // file share no scenes, so every restart looks like data loss.
    handle = createNodeSqliteAdapter(':memory:');
    await __setSceneStoreForTesting(await SqliteSceneStore.open(handle.db));
    await seedSession();

    handle.close();
    handle = null;
    await __setSceneStoreForTesting(null);

    handle = createNodeSqliteAdapter(':memory:');
    await __setSceneStoreForTesting(await SqliteSceneStore.open(handle.db));

    expect(await getSceneSnapshot(SESSION)).toBeNull();
  });
});