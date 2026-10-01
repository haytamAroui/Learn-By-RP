import { CONSENT_VERSION, LATEST_SCHEMA_VERSION, MIGRATIONS } from './schema';
import { Db } from './db';

let dbPromise: Promise<Db> | null = null;
let overrideDb: Db | null = null;

/**
 * Test seam. When set, the archive runs against the injected driver instead of
 * opening a file. Used to exercise the real migrations and the real repository
 * queries against a real SQLite engine in the test suite.
 */
export function __setDatabaseForTesting(db: Db | null): void {
  overrideDb = db;
  dbPromise = null;
}

/**
 * Opens the archive and brings it to the latest schema version.
 *
 * Migrations are additive and idempotent (CREATE ... IF NOT EXISTS), so a
 * database written by an older build upgrades in place without data loss.
 */
export function getDatabase(): Promise<Db> {
  if (overrideDb) return Promise.resolve(overrideDb);

  if (!dbPromise) {
    dbPromise = (async () => {
      const SQLite = await import('expo-sqlite');
      const db = (await SQLite.openDatabaseAsync('mission-coach.db')) as unknown as Db;
      await migrate(db);
      return db;
    })().catch(error => {
      // Do not cache a failed open; a later attempt should retry cleanly.
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
}

/** Applies any migration the database has not yet seen. */
export async function migrate(db: Db): Promise<number> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );`
  );

  const applied = await db.getAllAsync<{ version: number }>('SELECT version FROM schema_migrations');
  const appliedVersions = new Set(applied.map(row => row.version));

  for (const migration of MIGRATIONS) {
    if (appliedVersions.has(migration.version)) continue;

    for (const statement of migration.statements) {
      await db.execAsync(statement);
    }

    await db.runAsync(
      'INSERT OR REPLACE INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
      migration.version,
      migration.name,
      new Date().toISOString()
    );
  }

  return LATEST_SCHEMA_VERSION;
}

export async function getSchemaVersion(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM schema_migrations'
  );
  return row?.version ?? 0;
}

/**
 * Runs a unit of work inside one transaction and returns its result.
 *
 * Any throw rolls the whole thing back, so a partially written observation can
 * never outlive the passage it cites. The driver decides how: expo-sqlite uses
 * its exclusive helper, the node:sqlite test driver is driven with BEGIN/COMMIT.
 */
export async function withTransaction<T>(work: (txn: Db) => Promise<T>): Promise<T> {
  const db = await getDatabase();

  if (isNodeSqliteDriver(db)) {
    await db.execAsync('BEGIN');
    try {
      const result = await work(db);
      await db.execAsync('COMMIT');
      return result;
    } catch (error) {
      await db.execAsync('ROLLBACK').catch(() => undefined);
      throw error;
    }
  }

  let captured: T | undefined;

  const expoDb = db as Db & {
    withTransactionAsync?: (task: () => Promise<void>) => Promise<void>;
    withExclusiveTransactionAsync?: (
      task: (txn: unknown) => Promise<void>
    ) => Promise<void>;
  };

  if (typeof expoDb.withExclusiveTransactionAsync === 'function') {
    await expoDb.withExclusiveTransactionAsync(async (txn: unknown) => {
      captured = await work(txn as Db);
    });
  } else if (typeof expoDb.withTransactionAsync === 'function') {
    await expoDb.withTransactionAsync(async () => {
      captured = await work(db);
    });
  } else {
    throw new Error('Database driver does not support transactions');
  }

  return captured as T;
}

/**
 * The node:sqlite driver exposes neither expo transaction helper, so it is
 * detected by capability rather than by identity.
 */
function isNodeSqliteDriver(db: Db): boolean {
  return (
    typeof (db as { withExclusiveTransactionAsync?: unknown }).withExclusiveTransactionAsync !==
      'function' &&
    typeof (db as { withTransactionAsync?: unknown }).withTransactionAsync !== 'function'
  );
}

export { LATEST_SCHEMA_VERSION, CONSENT_VERSION };
