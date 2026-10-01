import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INACTIVITY,
  evaluateInactivity,
  recordActivity,
  type ActivitySnapshot,
} from './activityController';

const at = (quietMs: number, muted = false): ActivitySnapshot => ({ quietMs, muted });

describe('evaluateInactivity', () => {
  it('waits while the learner is active', () => {
    const decision = evaluateInactivity(at(1_000));
    expect(decision.phase).toBe('wait');
    expect(decision.shouldPrompt).toBe(false);
  });

  it('gives a gentle check-in once the quiet threshold passes', () => {
    const decision = evaluateInactivity(at(DEFAULT_INACTIVITY.checkInAfterMs));
    expect(decision.phase).toBe('gentle');
  });

  it('enters the countdown before ending', () => {
    const decision = evaluateInactivity(at(DEFAULT_INACTIVITY.warnAfterMs));
    expect(decision.phase).toBe('warning');
    expect(decision.secondsRemaining).toBeGreaterThan(0);
  });

  it('ends at the end threshold', () => {
    const decision = evaluateInactivity(at(DEFAULT_INACTIVITY.endAfterMs));
    expect(decision.phase).toBe('ended');
    expect(decision.secondsRemaining).toBe(0);
  });

  it('counts down in whole seconds so the display does not flicker', () => {
    // A fractional remainder would show 4.98s and then 4.00s, reading as a stutter.
    const decision = evaluateInactivity(at(DEFAULT_INACTIVITY.warnAfterMs + 1));
    expect(Number.isInteger(decision.secondsRemaining)).toBe(true);
  });

  /*
    The central claim: a learner who paused to think must not be timed out, and a
    helper turn must not consume the learner's clock. Both would end sessions that
    were progressing normally, with no explanation the learner could act on.
  */
  it('does not end a session while the learner is mid-turn', () => {
    const policy = { ...DEFAULT_INACTIVITY, endAfterMs: 20_000 };

    // A turn that began 3s ago: the learner is present, so the clock reads the
    // turn's own age and cannot have reached the end threshold.
    const justStarted = evaluateInactivity(at(99_000), policy, 30_000, 27_000);
    expect(justStarted.phase).toBe('wait');

    // No turn in progress, same clock, same policy: the silence counts.
    const idle = evaluateInactivity(at(3_000), policy, 30_000, undefined);
    expect(idle.phase).toBe('wait');

    // And genuine silence does end it.
    const longSilence = evaluateInactivity(at(25_000), policy, 30_000, undefined);
    expect(longSilence.phase).toBe('ended');
  });

  it('bounds the grace window so a stuck turn still times out', () => {
    const policy = { ...DEFAULT_INACTIVITY, endAfterMs: 20_000, assistantGraceMs: 8_000 };

    // A turn has been "running" for a minute. Without a bound it would hold the
    // session open forever, which is what a stuck microphone looks like.
    const stuck = evaluateInactivity(at(60_000), policy, 60_000, 0);
    expect(stuck.phase).toBe('ended');
  });

  it('gives an assistant turn its own generous window', () => {
    // Thresholds stay in order; the grace window is what is being varied here.
    const policy = { ...DEFAULT_INACTIVITY, assistantGraceMs: 30_000 };

    // A 10s turn, well inside the 30s window: no timeout at all.
    const duringTurn = evaluateInactivity(at(60_000), policy, 30_000, 20_000);
    expect(duringTurn.phase).toBe('wait');

    // Once the turn is over, the learner's own silence is what counts: 12s of quiet
    // has passed the 15s check-in? No - it has not, so this is still waiting. The
    // point is that the same wall-clock moment reads differently.
    const afterTurn = evaluateInactivity(at(12_000), policy, 30_000, undefined);
    expect(afterTurn.phase).toBe('wait');

    // Push past the check-in and it becomes a real prompt.
    const prompted = evaluateInactivity(
      at(DEFAULT_INACTIVITY.checkInAfterMs),
      policy,
      30_000,
      undefined
    );
    expect(prompted.phase).toBe('gentle');
  });

  it('prompts once on entering a phase, not on every tick', () => {
    // Entering gentle from wait prompts.
    const entered = evaluateInactivity(at(DEFAULT_INACTIVITY.checkInAfterMs), DEFAULT_INACTIVITY, 0, 0, 'wait');
    expect(entered.phase).toBe('gentle');
    expect(entered.shouldPrompt).toBe(true);

    // Still gentle on the next tick: no second announcement.
    const again = evaluateInactivity(
      at(DEFAULT_INACTIVITY.checkInAfterMs + 400),
      DEFAULT_INACTIVITY,
      0,
      0,
      'gentle'
    );
    expect(again.phase).toBe('gentle');
    expect(again.shouldPrompt).toBe(false);
  });

  it('prompts again when escalating from gentle to warning', () => {
    const escalated = evaluateInactivity(
      at(DEFAULT_INACTIVITY.warnAfterMs),
      DEFAULT_INACTIVITY,
      0,
      0,
      'gentle'
    );
    expect(escalated.phase).toBe('warning');
    expect(escalated.shouldPrompt).toBe(true);
  });

  /*
  The countdown has to survive large text. That is a rendering concern rather than a
  controller one, so what the controller owes is a plain integer with no formatting
  baked in - the number is rendered as a separate element precisely so it cannot be
  squeezed out by a longer translation, and clamping font scaling is the usual
  shortcut that makes a layout break at 200% for everyone else.
*/
  it('reports a plain integer the UI can render independently', () => {
    const decision = evaluateInactivity(at(DEFAULT_INACTIVITY.warnAfterMs));

    expect(typeof decision.secondsRemaining).toBe('number');
    expect(Number.isInteger(decision.secondsRemaining)).toBe(true);
    expect(String(decision.secondsRemaining)).not.toMatch(/[^0-9]/);
  });

  it('stays positive for the whole warning window', () => {
    // A countdown that reaches 0 during the warning phase reads as "ended" while the
    // session is still running.
    for (let quiet = DEFAULT_INACTIVITY.warnAfterMs; quiet < DEFAULT_INACTIVITY.endAfterMs; quiet += 250) {
      const decision = evaluateInactivity(at(quiet));
      expect(decision.phase).toBe('warning');
      expect(decision.secondsRemaining).toBeGreaterThan(0);
    }
  });

  it('never counts down a muted session', () => {
    const decision = evaluateInactivity(at(DEFAULT_INACTIVITY.endAfterMs * 10, true));
    expect(decision.phase).toBe('wait');
    expect(decision.secondsRemaining).toBe(0);
  });

  it('respects a custom policy', () => {
    const policy = { ...DEFAULT_INACTIVITY, checkInAfterMs: 1_000, warnAfterMs: 2_000, endAfterMs: 3_000 };

    expect(evaluateInactivity(at(999), policy).phase).toBe('wait');
    expect(evaluateInactivity(at(1_500), policy).phase).toBe('gentle');
    expect(evaluateInactivity(at(2_500), policy).phase).toBe('warning');
    expect(evaluateInactivity(at(3_500), policy).phase).toBe('ended');
  });
});

describe('recordActivity', () => {
  it('resets the quiet window on learner activity', () => {
    const next = recordActivity(at(20_000), 'voice');
    expect(next.quietMs).toBe(0);
  });

  it('resets on typing', () => {
    expect(recordActivity(at(20_000), 'typing').quietMs).toBe(0);
  });

  /*
    A helper turn must not reset the learner's clock. If it did, a helper that took
    a minute would hide a learner who left halfway through it.
  */
  it('leaves the learner clock alone during an assistant turn', () => {
    const previous = at(20_000);
    expect(recordActivity(previous, 'assistant_busy').quietMs).toBe(20_000);
    expect(recordActivity(previous, 'helper_busy').quietMs).toBe(20_000);
  });

  it('does not mutate the previous snapshot', () => {
    const previous = at(5_000, false);
    recordActivity(previous, 'muted');
    expect(previous.quietMs).toBe(5_000);
    expect(previous.muted).toBe(false);
  });

  it('mutes the countdown while muted', () => {
    const next = recordActivity(at(5_000), 'muted');
    expect(next.muted).toBe(true);
    expect(evaluateInactivity(next).phase).toBe('wait');
  });
});