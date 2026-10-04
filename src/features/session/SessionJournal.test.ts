import { describe, expect, it } from 'vitest';
import { SessionJournal } from './SessionJournal';
import type { SessionRecord } from '../../types';
import { reduceLifecycle } from './lifecycle';

describe('session activity journal', () => {
  it('serializes immutable checkpoints and drains before finish', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const written: string[] = [];
    const journal = new SessionJournal(async snapshot => {
      if (snapshot.id === 'first') await gate;
      written.push(snapshot.id);
    });
    const input = { id: 'first' } as SessionRecord;
    const first = journal.save(input);
    input.id = 'mutated';
    const second = journal.save({ id: 'second' } as SessionRecord);
    await Promise.resolve();
    expect(written).toEqual([]);
    release();
    await Promise.all([first, second, journal.flush()]);
    expect(written).toEqual(['first', 'second']);
  });

  it('reports write failures and allows an explicit complete snapshot retry', async () => {
    let fail = true;
    const journal = new SessionJournal(async () => { if (fail) throw new Error('Disk full'); });
    await expect(journal.save({ id: 'session' } as SessionRecord)).rejects.toThrow('Disk full');
    await expect(journal.flush()).rejects.toThrow('Disk full');
    fail = false;
    await journal.save({ id: 'session' } as SessionRecord);
    await expect(journal.flush()).resolves.toBeUndefined();
  });

  it('finishes through an explicit ended and assessment sequence', () => {
    let state = reduceLifecycle('live', 'END');
    state = reduceLifecycle(state, 'ENDED');
    expect(state).toBe('ended');
    state = reduceLifecycle(state, 'ASSESS_START');
    expect(state).toBe('recap_pending');
    expect(reduceLifecycle(state, 'ASSESS_OK')).toBe('recap_ready');
    expect(reduceLifecycle('recap_ready', 'CONNECTED')).toBe('recap_ready');
  });
});
