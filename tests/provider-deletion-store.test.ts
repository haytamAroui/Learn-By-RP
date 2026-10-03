import { afterEach, describe, expect, it } from 'vitest';
import {
  __resetProviderDeletionStoreForTesting,
  isProviderSessionDeleted,
  markProviderSessionDeleted,
} from '../server/security/deletionStore';

afterEach(() => {
  __resetProviderDeletionStoreForTesting();
  delete process.env.PRIVACY_DB_PATH;
});

describe('provider deletion tombstones', () => {
  it('blocks only the deleted session for the same bounded client', async () => {
    process.env.PRIVACY_DB_PATH = ':memory:';

    expect(await isProviderSessionDeleted('guest:a', 'session-1')).toBe(false);
    await markProviderSessionDeleted('guest:a', 'session-1');

    expect(await isProviderSessionDeleted('guest:a', 'session-1')).toBe(true);
    expect(await isProviderSessionDeleted('guest:a', 'session-2')).toBe(false);
    expect(await isProviderSessionDeleted('guest:b', 'session-1')).toBe(false);
  });
});
