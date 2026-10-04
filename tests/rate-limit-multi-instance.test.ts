import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ProviderRateLimiter } from '../server/security/requestGuard';
import {
  InMemoryRateLimitStore,
  SqliteRateLimitStore,
  type RateLimitStore,
} from '../server/security/rateLimitStore';

const SCENE_LIMIT = 120;
const WINDOW_MS = 60_000;

const tempDirs: string[] = [];
const openStores: SqliteRateLimitStore[] = [];

function sharedDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'learnbyrp-quota-'));
  tempDirs.push(dir);
  return join(dir, 'quota.sqlite');
}

/** Registers a store so cleanup can close it even when an assertion fails first. */
function openStore(path: string): SqliteRateLimitStore {
  const store = new SqliteRateLimitStore(path);
  openStores.push(store);
  return store;
}

afterEach(() => {
  // Windows refuses to unlink an open SQLite file, so a failed assertion would
  // otherwise cascade into a cleanup error that hides the real failure.
  while (openStores.length) {
    try {
      openStores.pop()!.close();
    } catch {
      // Already closed by the test.
    }
  }
  while (tempDirs.length) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe('multi-instance provider quota', () => {
  /**
   * The regression this suite exists for.
   *
   * Buckets lived in a `Map` inside the limiter, so each instance granted a full budget.
   * The original test could not see this: it constructed one limiter and asked it twice,
   * which is one instance by definition.
   */
  it('gives two independent per-process limiters a budget each, not one shared budget', () => {
    const first = new ProviderRateLimiter(() => 0, new InMemoryRateLimitStore());
    const second = new ProviderRateLimiter(() => 0, new InMemoryRateLimitStore());

    for (let i = 0; i < SCENE_LIMIT; i += 1) {
      expect(first.take('guest:a', 'scene')).toBe(true);
    }
    expect(first.take('guest:a', 'scene')).toBe(false);

    // The second instance still has its whole budget: 2 x limit in total.
    expect(second.take('guest:a', 'scene')).toBe(true);
  });

  it('shares one budget across two store instances on the same file', () => {
    const path = sharedDbPath();
    const instanceA = openStore(path);
    const instanceB = openStore(path);

    for (let i = 0; i < SCENE_LIMIT; i += 1) {
      expect(instanceA.take('guest:a:scene', SCENE_LIMIT, WINDOW_MS, 0)).toBe(true);
    }

    // The decisive assertion: the other instance must also be out of quota.
    expect(instanceB.take('guest:a:scene', SCENE_LIMIT, WINDOW_MS, 0)).toBe(false);
    // ...and an unrelated identity is unaffected.
    expect(instanceB.take('guest:b:scene', SCENE_LIMIT, WINDOW_MS, 0)).toBe(true);
  });

  it('interleaves two instances without exceeding the limit', () => {
    const path = sharedDbPath();
    const instanceA = openStore(path);
    const instanceB = openStore(path);

    let granted = 0;
    for (let i = 0; i < SCENE_LIMIT * 2; i += 1) {
      const store = i % 2 === 0 ? instanceA : instanceB;
      if (store.take('guest:a:scene', SCENE_LIMIT, WINDOW_MS, 0)) granted += 1;
    }

    expect(granted).toBe(SCENE_LIMIT);
  });

  it('opens a fresh window after the interval on the shared store', () => {
    const path = sharedDbPath();
    const instanceA = openStore(path);
    const instanceB = openStore(path);

    for (let i = 0; i < SCENE_LIMIT; i += 1) {
      instanceA.take('guest:a:scene', SCENE_LIMIT, WINDOW_MS, 0);
    }
    expect(instanceB.take('guest:a:scene', SCENE_LIMIT, WINDOW_MS, 0)).toBe(false);

    // Window elapsed: the second instance must serve again with no local state of its
    // own. Two calls are granted below before the loop, hence SCENE_LIMIT - 2.
    expect(instanceB.take('guest:a:scene', SCENE_LIMIT, WINDOW_MS, WINDOW_MS)).toBe(true);
    expect(instanceA.take('guest:a:scene', SCENE_LIMIT, WINDOW_MS, WINDOW_MS)).toBe(true);
    for (let i = 0; i < SCENE_LIMIT - 2; i += 1) {
      expect(instanceA.take('guest:a:scene', SCENE_LIMIT, WINDOW_MS, WINDOW_MS)).toBe(true);
    }

    // The new window is itself bounded, and bounded across both instances.
    expect(instanceB.take('guest:a:scene', SCENE_LIMIT, WINDOW_MS, WINDOW_MS)).toBe(false);
  });

  it('keeps state when a second instance attaches after the first wrote', () => {
    const path = sharedDbPath();
    const first = openStore(path);
    for (let i = 0; i < SCENE_LIMIT; i += 1) {
      first.take('guest:a:scene', SCENE_LIMIT, WINDOW_MS, 0);
    }
    first.close();

    // A process starting later must not hand the client a fresh budget.
    const late = openStore(path);
    expect(late.take('guest:a:scene', SCENE_LIMIT, WINDOW_MS, 0)).toBe(false);
  });
});

/**
 * Separate `SqliteRateLimitStore` instances in one process still share a file, but they
 * share one process too. This spawns genuinely separate OS processes, which is the case
 * the gate item is about and the one an in-process test cannot reach.
 */
describe('provider quota across separate processes', () => {
  /**
   * Written inside the repository so `require('tsx/cjs')` resolves from the repo's own
   * node_modules. A script in the OS temp directory cannot see them, and the failure
   * mode is a confusing MODULE_NOT_FOUND rather than a wrong quota result.
   */
  const workerFiles: string[] = [];

  function runWorker(dbPath: string, attempts: number): number {
    const storePath = join(process.cwd(), 'server', 'security', 'rateLimitStore.ts');
    const script = join(process.cwd(), `.quota-worker-${Math.random().toString(36).slice(2)}.cjs`);
    workerFiles.push(script);

    writeFileSync(
      script,
      [
        "require('tsx/cjs');",
        `const { SqliteRateLimitStore } = require(${JSON.stringify(storePath)});`,
        'const store = new SqliteRateLimitStore(process.argv[2]);',
        'let granted = 0;',
        `for (let i = 0; i < Number(process.argv[3]); i += 1) {`,
        `  if (store.take('guest:cross:scene', ${SCENE_LIMIT}, ${WINDOW_MS}, 0)) granted += 1;`,
        '}',
        'process.stdout.write(String(granted));',
      ].join('\n')
    );

    try {
      const out = execFileSync(process.execPath, [script, dbPath, String(attempts)], {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return Number(out);
    } finally {
      rmSync(script, { force: true });
      const index = workerFiles.indexOf(script);
      if (index >= 0) workerFiles.splice(index, 1);
    }
  }

  afterEach(() => {
    while (workerFiles.length) rmSync(workerFiles.pop()!, { force: true });
  });

  it('caps the total across independent OS processes', () => {
    const path = sharedDbPath();
    expect(existsSync(path)).toBe(false);

    // Each process asks for the full budget on its own. A per-process limiter would
    // report both as fully served; a shared store must report one of them as refused.
    const first = runWorker(path, SCENE_LIMIT);
    const second = runWorker(path, SCENE_LIMIT);
    const third = runWorker(path, 5);

    expect(first).toBe(SCENE_LIMIT);
    expect(second).toBe(0);
    expect(third).toBe(0);
  }, 120_000);
});

describe('quota-store failures', () => {
  it('fails closed if a previously opened shared store becomes unavailable', () => {
    const store = openStore(sharedDbPath());
    store.close();
    expect(store.take('guest:a:actor', 60, WINDOW_MS, 0)).toBe(false);
  });
});
