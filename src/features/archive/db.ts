/**
 * The narrow database surface the archive depends on.
 *
 * Both `expo-sqlite` (on device) and `node:sqlite` (in tests) satisfy it, so the
 * repository code and the migrations are the same in both places. Anything added
 * here has to be implemented twice; anything not here cannot be used, which keeps
 * the two drivers honest.
 */
export interface Db {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: DbParams): Promise<void>;
  getAllAsync<T>(source: string, ...params: DbParams): Promise<T[]>;
  getFirstAsync<T>(source: string, ...params: DbParams): Promise<T | null>;
}

export type DbParams = Array<string | number | boolean | null>;

/**
 * Driver for `node:sqlite`, used by the server and the test suite.
 *
 * Defaults to `:memory:` so tests stay isolated and fast. Pass a file path for
 * anything that has to outlive the process: an in-memory database is discarded
 * when the handle closes, so a server holding one loses every scene on restart
 * while appearing to work perfectly until it does not.
 */
export function createNodeSqliteAdapter(
  location = ':memory:'
): { db: Db; close: () => void } {
  // Imported lazily so Metro never tries to bundle the Node builtin into the app.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');

  if (location !== ':memory:') {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    fs.mkdirSync(path.dirname(location), { recursive: true });
  }

  const handle = new DatabaseSync(location);

  // A file-backed database still loses committed writes on an abrupt exit
  // without this, so durability here means durability, not "usually written".
  if (location !== ':memory:') {
    handle.exec('PRAGMA journal_mode = WAL');
    handle.exec('PRAGMA synchronous = FULL');
  }

  const db: Db = {
    async execAsync(source) {
      handle.exec(source);
    },
    async runAsync(source, ...params) {
      handle.prepare(source).run(...(params as never[]));
    },
    async getAllAsync<T>(source: string, ...params: DbParams): Promise<T[]> {
      return handle.prepare(source).all(...(params as never[])) as T[];
    },
    async getFirstAsync<T>(source: string, ...params: DbParams): Promise<T | null> {
      const row = handle.prepare(source).get(...(params as never[]));
      return (row as T) ?? null;
    },
  };

  return { db, close: () => handle.close() };
}
