import { describe, expect, it } from 'vitest';
import { beginGeneration, commitIfCurrent, invalidate } from './generation';

/**
 * These tests all assert the same invariant from different directions: work started
 * for an abandoned turn must not be able to land on a newer one. The harm is
 * permanent - one session's words written into another's record corrupts the evidence,
 * which no later edit can honestly repair.
 */

describe('generation tokens', () => {
  it('treats the newest generation as current', () => {
    const generation = beginGeneration();
    expect(commitIfCurrent(generation, () => 'ok')).toEqual({ committed: true, value: 'ok' });
  });

  it('refuses a stale generation once newer work has begun', () => {
    const stale = beginGeneration();
    beginGeneration();

    const result = commitIfCurrent(stale, () => 'should not land');
    expect(result.committed).toBe(false);
    expect(result.value).toBeUndefined();
  });

  it('refuses everything outstanding when a session is invalidated', () => {
    const inFlight = beginGeneration();
    invalidate();

    expect(commitIfCurrent(inFlight, () => 'x').committed).toBe(false);
  });

  it('allows work started after invalidation', () => {
    invalidate();
    const fresh = beginGeneration();
    expect(commitIfCurrent(fresh, () => 'ok').committed).toBe(true);
  });

  it('issues distinct ids for rapid successive turns', () => {
    // Two turns begun in the same millisecond must not share an id, which is why
    // this is a counter and not a timestamp.
    const first = beginGeneration();
    const second = beginGeneration();
    expect(second).not.toBe(first);
  });

  it('does not run the commit callback for a stale generation', () => {
    const stale = beginGeneration();
    beginGeneration();

    let ran = false;
    commitIfCurrent(stale, () => {
      ran = true;
    });

    // Side effects in the callback are exactly what must be skipped.
    expect(ran).toBe(false);
  });

  it('returns the callback value on a fresh generation', () => {
    const generation = beginGeneration();
    expect(commitIfCurrent(generation, () => ({ passages: 3 })).value).toEqual({ passages: 3 });
  });
});