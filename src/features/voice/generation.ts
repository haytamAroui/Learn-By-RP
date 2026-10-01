/**
 * A generation token, so work belonging to an abandoned turn cannot land on a newer one.
 *
 * The failure this prevents: a learner ends a session while a reply is in flight, or
 * an old recovery timer fires after they have already started the next mission. The
 * late response then overwrites the current transcript - writing one session's words
 * into another's record, which corrupts the evidence permanently rather than just
 * displaying badly.
 *
 * Deliberately not a timestamp. A clock is not monotonic across app suspension, and
 * two events in the same millisecond would share an id.
 */

let current = 0;

/** Starts new work and invalidates anything started earlier. */
export function beginGeneration(): number {
  current += 1;
  return current;
}

/** True while `token` is still the newest generation. */
export function isCurrent(generation: number): boolean {
  return generation === current;
}

/** The newest generation, for code that must record where it started. */
export function currentGeneration(): number {
  return current;
}

/**
 * Invalidates all outstanding work without starting new work.
 *
 * Called when a session ends, so a response already in flight can no longer commit.
 */
export function invalidate(): void {
  current += 1;
}

/**
 * Runs `commit` only if `generation` is still current.
 *
 * The point is that the check happens at commit time, not when the work started: a
 * request that was valid for five seconds can be invalid by the time it returns.
 */
export function commitIfCurrent<T>(
  generation: number,
  commit: () => T
): { committed: boolean; value?: T } {
  if (!isCurrent(generation)) return { committed: false };
  return { committed: true, value: commit() };
}