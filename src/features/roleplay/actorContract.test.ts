import { describe, expect, it } from 'vitest';
import { mayCommitActorReply, sanitizeActorAction } from './actorContract';

describe('actor contract', () => {
  it('drops an action that is not in the authored allowlist', () => {
    expect(
      sanitizeActorAction(
        { name: 'invented_action', payload: { anything: true } },
        ['confirm_order_item']
      )
    ).toBeNull();
  });

  it('keeps only an authored action with an object payload', () => {
    expect(
      sanitizeActorAction(
        { name: 'confirm_order_item', payload: { item: 'coffee' } },
        ['confirm_order_item']
      )
    ).toEqual({
      name: 'confirm_order_item',
      payload: { item: 'coffee' },
    });
  });

  it('allows an ordinary conversational reply without a scene action', () => {
    expect(mayCommitActorReply(null, undefined)).toBe(true);
  });

  it('blocks a consequential actor reply until the reducer accepts it', () => {
    const proposed = { name: 'confirm_order_item', payload: {} };

    expect(mayCommitActorReply(proposed, null)).toBe(false);
    expect(
      mayCommitActorReply(proposed, {
        actionId: 'a-1',
        accepted: false,
        reason: 'precondition_failed',
        newFacts: {},
        revision: 1,
        appliedAt: '2026-10-02T00:00:00.000Z',
      })
    ).toBe(false);
    expect(
      mayCommitActorReply(proposed, {
        actionId: 'a-1',
        accepted: true,
        newFacts: { itemConfirmed: true },
        revision: 2,
        appliedAt: '2026-10-02T00:00:00.000Z',
      })
    ).toBe(true);
  });
});
