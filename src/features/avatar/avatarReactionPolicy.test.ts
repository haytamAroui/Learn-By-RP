import { describe, expect, it } from 'vitest';
import {
  reactionForSession,
  reactionForTurn,
  turnWasAssisted,
} from './avatarReactionPolicy';
import type { SupportExposure } from '../../types';

function exposure(input: {
  kind: SupportExposure['kind'];
  recordedAt: string;
  turnId?: string;
}): SupportExposure {
  return {
    id: `exp-${input.kind}-${input.recordedAt}`,
    sessionId: 'session-1',
    attemptId: 'attempt-1',
    turnId: input.turnId,
    source: 'coach',
    kind: input.kind,
    exposure: 'visible',
    policyVersion: 1,
    recordedAt: input.recordedAt,
  } as SupportExposure;
}

describe('reaction for a turn', () => {
  it('celebrates a turn that moved the world', () => {
    expect(reactionForTurn({ sceneAcceptedAction: true, turnWasAssisted: false })).toBe(
      'encourage'
    );
  });

  it('never celebrates an assisted turn', () => {
    expect(reactionForTurn({ sceneAcceptedAction: true, turnWasAssisted: true })).toBe(
      'consider'
    );
  });

  it('shows concern for an assisted turn that moved nothing', () => {
    expect(reactionForTurn({ sceneAcceptedAction: false, turnWasAssisted: true })).toBe(
      'consider'
    );
  });

  it('has no reaction for a turn that did nothing notable', () => {
    expect(reactionForTurn({ sceneAcceptedAction: false, turnWasAssisted: false })).toBeNull();
  });
});

describe('reaction for a finished session', () => {
  it('praises a session carried through alone', () => {
    expect(reactionForSession({ completed: true, assisted: false })).toBe('praise');
  });

  it('acknowledges a session carried through with help', () => {
    expect(reactionForSession({ completed: true, assisted: true })).toBe('encourage');
  });

  it('has no reaction for a session the learner cut short', () => {
    expect(reactionForSession({ completed: false, assisted: false })).toBeNull();
  });
});

describe('whether a turn was assisted', () => {
  const turnStartedAt = '2026-10-20T10:00:00.000Z';
  const replyEndedAt = '2026-10-20T10:00:06.000Z';

  it('is true when a production form was shown during the turn', () => {
    const assisted = turnWasAssisted({
      exposures: [exposure({ kind: 'full_form', recordedAt: '2026-10-20T10:00:02.000Z' })],
      turnStartedAt,
      replyEndedAt,
    });
    expect(assisted).toBe(true);
  });

  it('is false when the support was shown before the learner spoke', () => {
    const assisted = turnWasAssisted({
      exposures: [exposure({ kind: 'full_form', recordedAt: '2026-10-20T09:59:00.000Z' })],
      turnStartedAt,
      replyEndedAt,
    });
    expect(assisted).toBe(false);
  });

  it('is false when the support was shown after the reply', () => {
    const assisted = turnWasAssisted({
      exposures: [exposure({ kind: 'full_form', recordedAt: '2026-10-20T10:01:00.000Z' })],
      turnStartedAt,
      replyEndedAt,
    });
    expect(assisted).toBe(false);
  });

  it('ignores intent-only guidance, which does not expose the learner form', () => {
    const assisted = turnWasAssisted({
      exposures: [exposure({ kind: 'intent_hint', recordedAt: '2026-10-20T10:00:02.000Z' })],
      turnStartedAt,
      replyEndedAt,
    });
    expect(assisted).toBe(false);
  });

  it('ignores a caption, which is not the learner form', () => {
    const assisted = turnWasAssisted({
      exposures: [exposure({ kind: 'caption_view', recordedAt: '2026-10-20T10:00:02.000Z' })],
      turnStartedAt,
      replyEndedAt,
    });
    expect(assisted).toBe(false);
  });

  it('is false when there is no support at all', () => {
    expect(turnWasAssisted({ exposures: [], turnStartedAt, replyEndedAt })).toBe(false);
  });

  it('is false when the window cannot be read', () => {
    const assisted = turnWasAssisted({
      exposures: [exposure({ kind: 'full_form', recordedAt: '2026-10-20T10:00:02.000Z' })],
      turnStartedAt: 'not a date',
      replyEndedAt,
    });
    expect(assisted).toBe(false);
  });
});
