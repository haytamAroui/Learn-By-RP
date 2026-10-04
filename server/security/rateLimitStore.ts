/**
 * Shared provider quota store.
 *
 * The limiter this backs used to keep its buckets in a `Map`, which is correct for one
 * process and silently wrong for two. Behind a load balancer, every instance granted a
 * full budget, so a client could send `limit x instances` requests per window and each
 * instance would report it as within quota. Nothing crashed and no test failed; the
 * bound was simply not a bound.
 *
 * The interface is synchronous on purpose. `take()` runs inside Express middleware on
 * the hot path for every provider call, and node:sqlite is synchronous underneath, so a
 * synchronous transaction gives a real cross-process atomicity guarantee without
 * pushing an unhandled-rejection surface into middleware. The async `Db` adapter in
 * `features/archive/db` wraps the same driver but is not usable from a sync guard.
 *
 * `now` is a parameter rather than something the store reads. A quota store that trusted
 * its own clock could disagree with the caller about which window it is in, and tests
 * could not exercise expiry without sleeping.
 */
export interface RateLimitStore {
  /**
   * Records one attempt against `key` and reports whether it was within quota.
   *
   * Must be atomic with respect to other callers, including callers in other processes
   * sharing the same backing store.
   */
  take(key: string, limit: number, windowMs: number, now: number): boolean;
  /** Drops all quota state. Test seam; production stores may decline to implement. */
  reset?(): void;
}

/** Maximum distinct buckets held in memory before new identities are refused. */
const MAX_BUCKETS = 50_000;

/**
 * Per-process store. Correct for one instance, and the default for tests.
 *
 * Deliberately still available in production: if no shared store is configured the
 * limiter should keep working as a cost guard rather than crash, and the degradation is
 * logged rather than silent.
 */
export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, { startedAt: number; count: number }>();
  private calls = 0;

  take(key: string, limit: number, windowMs: number, now: number): boolean {
    if (++this.calls % 256 === 0) this.sweep(now, windowMs);

    const existing = this.buckets.get(key);
    if (!existing || now - existing.startedAt >= windowMs) {
      if (!existing && this.buckets.size >= MAX_BUCKETS) return false;
      this.buckets.set(key, { startedAt: now, count: 1 });
      return true;
    }
    if (existing.count >= limit) return false;
    existing.count += 1;
    return true;
  }

  private sweep(now: number, windowMs: number): void {
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.startedAt >= windowMs) this.buckets.delete(key);
    }
  }

  reset(): void {
    this.buckets.clear();
    this.calls = 0;
  }
}

/**
 * Cross-instance store backed by one SQLite file.
 *
 * Valid when the instances share a filesystem, which is how this service already keeps
 * scene truth (`.data/scenes.sqlite`) and privacy requests (`.data/privacy.sqlite`). It
 * is deliberately not presented as a multi-host answer: instances on separate hosts do
 * not share a SQLite file, and deploying this across hosts needs a different backend
 * behind the same interface.
 *
 * Atomicity comes from `BEGIN IMMEDIATE`, not from the upsert. A deferred transaction
 * would let two processes both read the current count before either wrote, so the
 * loser's increment would be overwritten and the quota would be under-counted. Taking
 * the write lock up front serialises read-modify-write.
 */
export class SqliteRateLimitStore implements RateLimitStore {
  private readonly db: {
    exec(source: string): void;
    prepare(source: string): {
      get(...params: unknown[]): unknown;
      run(...params: unknown[]): unknown;
    };
    close(): void;
  };
  private calls = 0;

  constructor(location: string) {
    // Required lazily so Metro never bundles the Node builtin into the app.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');
    if (location !== ':memory:') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('node:fs') as typeof import('node:fs');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodePath = require('node:path') as typeof import('node:path');
      fs.mkdirSync(nodePath.dirname(location), { recursive: true });
    }

    const handle = new DatabaseSync(location);
    // The counter is read-modify-written on every provider call. `NORMAL` under WAL is
    // the usual choice for a quota: a crash can lose the last few increments, which
    // under-counts and so grants a small number of extra requests within the current
    // window. It cannot over-count, and the window resets on its own. `FULL` would
    // fsync on every provider call to protect a bound that is a cost guard, not a
    // security boundary.
    if (location !== ':memory:') {
      handle.exec('PRAGMA journal_mode = WAL');
      handle.exec('PRAGMA synchronous = NORMAL');
    }
    handle.exec(`CREATE TABLE IF NOT EXISTS provider_quota (
      key TEXT PRIMARY KEY,
      started_at INTEGER NOT NULL,
      count INTEGER NOT NULL
    )`);
    handle.exec('CREATE INDEX IF NOT EXISTS provider_quota_started_at ON provider_quota(started_at)');
    this.db = handle as unknown as SqliteRateLimitStore['db'];
  }

  take(key: string, limit: number, windowMs: number, now: number): boolean {
    // A quota-store failure must not silently disable the cost bound. The caller can
    // surface a retryable 429/503; allowing the request would turn an infrastructure
    // fault into unbounded provider spend.
    try {
      if (++this.calls % 256 === 0) {
        this.db.prepare('DELETE FROM provider_quota WHERE started_at <= ?').run(now - windowMs);
      }
      return this.takeInTransaction(key, limit, windowMs, now);
    } catch (error) {
      console.error('[quota] store unavailable; refusing request', error);
      return false;
    }
  }

  private takeInTransaction(
    key: string,
    limit: number,
    windowMs: number,
    now: number
  ): boolean {
    // Another process may hold the write lock. Bounded retry: contention here is
    // microseconds, and a quota check that blocks a request thread indefinitely is worse
    // than one that gives up and allows the call.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return this.transaction(key, limit, windowMs, now);
      } catch (error) {
        if (!isBusy(error)) throw error;
      }
    }
    console.error('[quota] shared store stayed locked; refusing request');
    return false;
  }

  private transaction(
    key: string,
    limit: number,
    windowMs: number,
    now: number
  ): boolean {
    const read = this.db.prepare(
      'SELECT started_at AS startedAt, count AS count FROM provider_quota WHERE key = ?'
    );
    const insert = this.db.prepare(
      'INSERT INTO provider_quota (key, started_at, count) VALUES (?, ?, 1)'
    );
    const update = this.db.prepare(
      'UPDATE provider_quota SET count = count + 1 WHERE key = ?'
    );

    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = read.get(key) as { startedAt: number; count: number } | undefined;

      if (!row || now - row.startedAt >= windowMs) {
        if (row) {
          this.db
            .prepare('UPDATE provider_quota SET started_at = ?, count = 1 WHERE key = ?')
            .run(now, key);
        } else {
          insert.run(key, now);
        }
        this.db.exec('COMMIT');
        return true;
      }

      if (row.count >= limit) {
        this.db.exec('COMMIT');
        return false;
      }

      update.run(key);
      this.db.exec('COMMIT');
      return true;
    } catch (error) {
      try {
        this.db.exec('ROLLBACK');
      } catch {
        // The transaction may already be rolled back by SQLite; the original error is
        // the one worth reporting.
      }
      throw error;
    }
  }

  reset(): void {
    this.db.exec('DELETE FROM provider_quota');
  }

  close(): void {
    this.db.close();
  }
}

function isBusy(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /SQLITE_BUSY|database is locked|locking protocol/i.test(message);
}

/** Default location for the shared quota file, alongside the other hosted stores. */
export function quotaDatabasePath(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('node:path') as typeof import('node:path');
  return path.join(process.cwd(), '.data', 'provider-quota.sqlite');
}

/**
 * Chooses the store for a running server.
 *
 * `LEARNBYRP_QUOTA_DB` points at a SQLite file to share one budget across instances.
 * `:memory:` or an absent value keeps the per-process store, which is correct for local
 * development and for a single instance and is *not* correct behind a load balancer, so
 * the fallback is logged rather than assumed.
 */
export function createRateLimitStore(): RateLimitStore {
  const configured = process.env.LEARNBYRP_QUOTA_DB;
  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[quota] LEARNBYRP_QUOTA_DB is unset in production; each instance will grant its ' +
          'own quota and the effective limit scales with the instance count.'
      );
    }
    return new InMemoryRateLimitStore();
  }
  return new SqliteRateLimitStore(configured === 'memory' ? ':memory:' : configured);
}
