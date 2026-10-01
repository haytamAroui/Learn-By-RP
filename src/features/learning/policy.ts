/**
 * Versioned learning policy.
 *
 * Every threshold, window and interval that affects learner-visible state lives
 * here under a version. Bump LEARNING_POLICY_VERSION whenever a rule changes so a
 * projection can be rebuilt and explained as it was at the time.
 *
 * Phrase recall and communicative skill are deliberately separate policies. They
 * used to share one set of rules, which is why "steady" meant two different
 * things depending on which screen you were looking at. A phrase can be steady
 * from repeated retrieval of the same item; a skill can only be steady from
 * transfer across situations and days.
 *
 * These are product heuristics, not a calibrated spaced-repetition model and not
 * a validated CEFR alignment.
 */

export const LEARNING_POLICY_VERSION = 3;

/**
 * Phrase recall: one item, retrieved over time.
 *
 * Quick to promote by design. A learner who retrieves the same phrase unaided
 * across two sessions a week apart has recalled it; pretending otherwise would
 * make the phrase view useless.
 */
export const PHRASE_POLICY = {
  /**
   * Days between unassisted retrievals before a phrase is steady. A span is
   * required as well as a second session, so two attempts in one sitting cannot
   * read as durable recall.
   */
  steadyMinSpanDays: 7,

  /** Distinct sessions required for steady. */
  steadyMinSessions: 2,

  /** Review intervals by recall status, in days. */
  intervals: {
    new: 1,
    supported: 1,
    growing: 4,
    steady: 14,
  } as const,
} as const;

/**
 * Communicative skill: a capability demonstrated in more than one situation.
 *
 * Slower to promote than a phrase, on purpose. Claiming someone can "ask for a
 * substitution" because they used a substitution phrase once, in the one mission
 * where it was the whole point, is the kind of claim this product exists to avoid.
 */
export const SKILL_POLICY = {
  /**
   * Growing: independent success in at least this many distinct situations...
   */
  growingMinContexts: 2,
  /** ...spanning at least this many distinct days.
   *
   * Both conditions, not either. Two contexts on one day is one session with
   * two chances in it, which is not transfer.
   */
  growingMinDays: 2,

  /** Steady: independent success across this many distinct situations... */
  steadyMinContexts: 4,
  /** ...spanning at least this many distinct days. */
  steadyMinDays: 3,

  /**
   * How recent a lapse must be to mark a durable skill as due for review.
   *
   * This only adds `reviewDue`; it never lowers the status.
   */
  lapseReviewWindowDays: 14,

  /**
   * Minimum number of validated observations needed before steady is reachable.
   *
   * Legacy substring inference cannot satisfy this on its own, so a history
   * reconstructed by guessing stays below steady until real evidence exists.
   */
  steadyMinValidatedObservations: 4,
} as const;

/** Windows shared by both policies. */
export const LEARNING_WINDOWS = {
  /**
   * How long after the assistant modeled a form that use still counts as
   * assisted. Starting heuristic; not validated.
   */
  modeledFormWindowMs: 90_000,

  /**
   * Minimum share of a proposal's quote words that must appear in the learner's
   * own transcript before provenance is accepted.
   */
  minQuoteCoverage: 0.6,
} as const;

/**
 * The policy as one object, for anything that only needs to read a version or a
 * window. Code that promotes a learner-visible status must use the specific
 * policy above rather than this.
 */
export const LEARNING_POLICY = {
  version: LEARNING_POLICY_VERSION,
  phrase: PHRASE_POLICY,
  skill: SKILL_POLICY,
  windows: LEARNING_WINDOWS,
  // Retained at the top level because callers referenced them directly.
  steadyMinSpanDays: PHRASE_POLICY.steadyMinSpanDays,
  steadyMinSessions: PHRASE_POLICY.steadyMinSessions,
  intervals: PHRASE_POLICY.intervals,
  modeledFormWindowMs: LEARNING_WINDOWS.modeledFormWindowMs,
  minQuoteCoverage: LEARNING_WINDOWS.minQuoteCoverage,
} as const;

export type RecallPolicyStatus = keyof typeof PHRASE_POLICY.intervals;