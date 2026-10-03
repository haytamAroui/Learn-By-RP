import { createNodeSqliteAdapter, type Db } from '../../src/features/archive/db';

let dbPromise: Promise<Db> | null = null;
let handle: { db: Db; close: () => void } | null = null;

function databasePath(): string {
  if (process.env.PRIVACY_DB_PATH) return process.env.PRIVACY_DB_PATH;
  const path = require('node:path') as typeof import('node:path');
  return path.join(process.cwd(), '.data', 'privacy.sqlite');
}

async function db(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = (async () => {
      handle = createNodeSqliteAdapter(databasePath());
      await handle.db.execAsync(
        `CREATE TABLE IF NOT EXISTS provider_deletion_tombstones (
          client_identity TEXT NOT NULL,
          session_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          PRIMARY KEY (client_identity, session_id)
        );`
      );
      return handle.db;
    })().catch(error => {
      dbPromise = null;
      handle?.close();
      handle = null;
      throw error;
    });
  }
  return dbPromise;
}

export async function markProviderSessionDeleted(
  clientIdentity: string,
  sessionId: string
): Promise<void> {
  const database = await db();
  await database.runAsync(
    `INSERT OR REPLACE INTO provider_deletion_tombstones
       (client_identity, session_id, created_at)
     VALUES (?, ?, ?)`,
    clientIdentity,
    sessionId,
    new Date().toISOString()
  );
}

export async function isProviderSessionDeleted(
  clientIdentity: string,
  sessionId: string
): Promise<boolean> {
  const database = await db();
  const row = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
       FROM provider_deletion_tombstones
      WHERE client_identity = ? AND session_id = ?`,
    clientIdentity,
    sessionId
  );
  return (row?.count ?? 0) > 0;
}

/** Test seam: close the lazy handle so a temporary database can be removed. */
export function __resetProviderDeletionStoreForTesting(): void {
  handle?.close();
  handle = null;
  dbPromise = null;
}
