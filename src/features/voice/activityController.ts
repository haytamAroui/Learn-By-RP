/**
 * Deterministic inactivity handling for a conversation session.
 *
 * The rule this encodes: the clock only advances while the session is genuinely
 * waiting on the learner. Speaking, typing, or an assistant turn in progress all
 * pause it, because a learner who paused to think is not a learner who left.
 *
 * That distinction is the whole point. A wall-clock timer that keeps running during
 * a helper turn ends sessions that were progressing normally, and the learner never
 * learns why.
 *
 * The controller is a pure function of its inputs so it can be tested without
 * timers, which is also why the grace windows are explicit parameters rather than
 * constants.
 */

export type ActivitySource = 'voice' | 'typing' | 'assistant_busy' | 'helper_busy' | 'muted';

export type SessionPhase = 'wait' | 'gentle' | 'warning' | 'ended';

/** Milliseconds of quiet before each phase change. */
export interface InactivityPolicy {
  /** Quiet before the gentle check-in. */
  checkInAfterMs: number;
  /** Quiet before the visible countdown. */
  warnAfterMs: number;
  /** Quiet before the session ends. */
  endAfterMs: number;
  /**
   * A learner turn may be in progress and still quiet. Bounded, or a slow speaker
   * is treated as absent.
   */
  typingGraceMs: number;
  /** An assistant or helper turn is not learner silence at all. */
  assistantGraceMs: number;
  /** Muted sessions do not count down. */
  exemptWhenMuted: boolean;
}

export const DEFAULT_INACTIVITY: InactivityPolicy = {
  checkInAfterMs: 15_000,
  warnAfterMs: 25_000,
  endAfterMs: 30_000,
  typingGraceMs: 4_000,
  assistantGraceMs: 30_000,
  exemptWhenMuted: true,
};

export interface ActivitySnapshot {
  /** ms of quiet that counts towards ending. Already adjusted for grace. */
  quietMs: number;
  muted: boolean;
}

export interface InactivityDecision {
  phase: SessionPhase;
  /** Whole seconds left before the session ends. Zero once ended. */
  secondsRemaining: number;
  /** True only at the boundary, so a caller can speak once rather than every tick. */
  shouldPrompt: boolean;
}

/**
 * Resolves the session phase from how long the session has been quiet.
 *
 * `activityStartedAt` is the beginning of the current busy period. The grace
 * windows extend it, so a learner mid-typing is still counted as present.
 */
export function evaluateInactivity(
  snapshot: ActivitySnapshot,
  policy: InactivityPolicy = DEFAULT_INACTIVITY,
  nowMs: number = 0,
  /**
   * When the current turn began, or `undefined` when nothing is in progress.
   * Optional rather than defaulted to 0 on purpose: with a 0 default, an epoch
   * timestamp reads as "a turn that started at the epoch", which is permanently
   * busy and silently disables the timeout.
   */
  activityStartedAt: number | undefined = undefined,
  previousPhase: SessionPhase = 'wait',
  source: ActivitySource = 'assistant_busy',
): InactivityDecision {
  if (policy.exemptWhenMuted && snapshot.muted) {
    return { phase: "wait", secondsRemaining: 0, shouldPrompt: false };
  }

  /*
    `activityStartedAt` is the moment the current turn began. When a turn is in
    progress the learner is present by definition, so the clock reports the turn's
    own age rather than the raw silence. The grace window is therefore a ceiling on
    how long a single turn may run before it counts as inactivity again - bounded,
    because an unbounded grace means a stuck microphone never times out.
  */
  const busyFor =
    activityStartedAt === undefined ? 0 : Math.max(0, nowMs - activityStartedAt);

  /*
    A turn in progress makes the learner present, so a fresh turn reads as zero
    quiet however long the session has been silent.

    The grace window bounds that protection: once a turn has run longer than the
    window, the excess counts as silence. Without that bound a stuck microphone or a
    hung assistant holds the session open indefinitely, and the learner is stuck
    rather than being offered a way out.
  */
  const grace = source === 'typing' ? policy.typingGraceMs : policy.assistantGraceMs;
  const effectiveQuiet =
    busyFor > 0 ? Math.max(0, busyFor - grace) : snapshot.quietMs;

  if (effectiveQuiet >= policy.endAfterMs) {
    return { phase: 'ended', secondsRemaining: 0, shouldPrompt: false };
  }

  const remaining = policy.endAfterMs - effectiveQuiet;
  const secondsRemaining = Math.max(0, Math.ceil(remaining / 1000));

  /*
    `shouldPrompt` marks the *transition* into a phase, not the phase itself. A
    timer ticks several times a second, so "prompt while gentle" would announce the
    check-in continuously for the whole window.
  */
  if (effectiveQuiet >= policy.warnAfterMs) {
    return {
      phase: 'warning',
      secondsRemaining,
      shouldPrompt: previousPhase !== 'warning',
    };
  }

  if (effectiveQuiet >= policy.checkInAfterMs) {
    return {
      phase: 'gentle',
      secondsRemaining,
      shouldPrompt: previousPhase !== 'gentle',
    };
  }

  return { phase: 'wait', secondsRemaining, shouldPrompt: false };
}

/**
 * Folds a new activity signal into the tracker's state.
 *
 * Returns a new snapshot rather than mutating, so a timer tick and an activity
 * event cannot race on shared mutable state. The quiet window restarts from zero on
 * any learner activity, which is what makes the grace windows work.
 */
export function recordActivity(
  previous: ActivitySnapshot,
  source: ActivitySource,
): ActivitySnapshot {
  // Assistant and helper work never counts as learner silence. It must not reset
  // the learner's own clock either - that would let a long helper turn hide a
  // learner who actually left.
  if (source === 'assistant_busy' || source === 'helper_busy') {
    return { quietMs: previous.quietMs, muted: previous.muted };
  }

  if (source === 'muted') {
    return { quietMs: 0, muted: true };
  }

  return { quietMs: 0, muted: false };
}