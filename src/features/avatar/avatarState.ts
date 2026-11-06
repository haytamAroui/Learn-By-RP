import type { AvatarReaction, AvatarState } from './avatarExpressions';
import { getPlaybackClockState, subscribePlaybackClock } from '../../providers/voice/playbackClock';

/**
 * The character's state.
 *
 * The session knows what is happening and the voice layer knows when the
 * learner is speaking and when the tutor is speaking. This is where both are
 * turned into one state for the character to show.
 *
 * The session owns the base state. The voice overrides it while audio is
 * running, because the voice is the most immediate truth about what the
 * character is doing.
 */
type StateListener = (state: AvatarState) => void;
type ReactionListener = (reaction: AvatarReaction) => void;

let baseState: AvatarState = 'idle';
let effectiveState: AvatarState = 'idle';
let reaction: AvatarReaction | null = null;
const stateListeners = new Set<StateListener>();
const reactionListeners = new Set<ReactionListener>();
let unsubscribeClock: (() => void) | null = null;

/**
 * The character always knows whether the voice is running, so the store
 * follows the clock itself rather than relying on a caller to wire it.
 */
function ensureConnected() {
  if (unsubscribeClock) return;
  unsubscribeClock = subscribePlaybackClock(() => recompute());
}

function recompute() {
  const clock = getPlaybackClockState();
  const next: AvatarState = reaction
    ? 'reacting'
    : clock.speaking
      ? 'speaking'
      : clock.listening
        ? 'listening'
        : baseState;

  if (effectiveState === next) return;
  effectiveState = next;
  for (const listener of [...stateListeners]) {
    try {
      listener(effectiveState);
    } catch {
      // A failing listener must not break the session.
    }
  }
}

export function getAvatarState(): AvatarState {
  ensureConnected();
  // The state is derived, so it is recomputed from the clock rather than
  // trusted to have been kept up to date.
  recompute();
  return effectiveState;
}

export function getAvatarReaction(): AvatarReaction | null {
  return reaction;
}

/** What the session is doing, before the voice has its say. */
export function setAvatarBaseState(next: AvatarState): void {
  ensureConnected();
  if (baseState === next) return;
  baseState = next;
  recompute();
}

export function subscribeAvatarState(listener: StateListener): () => void {
  ensureConnected();
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
}

/**
 * Show a reaction.
 *
 * A reaction is a short thing that happens, not a state the character stays
 * in, so it is cleared by the next state change.
 */
export function pushAvatarReaction(next: AvatarReaction): void {
  ensureConnected();
  reaction = next;
  recompute();
  for (const listener of [...reactionListeners]) {
    try {
      listener(reaction);
    } catch {
      // A failing listener must not break the session.
    }
  }
}

export function subscribeAvatarReaction(listener: ReactionListener): () => void {
  reactionListeners.add(listener);
  return () => {
    reactionListeners.delete(listener);
  };
}

export function clearAvatarReaction(): void {
  reaction = null;
  recompute();
}

/**
 * Follow the voice.
 *
 * The character speaks when the tutor speaks and listens when the learner
 * speaks, whatever the session is doing underneath.
 */
export function connectAvatarActivity(): () => void {
  ensureConnected();
  return () => {
    setAvatarBaseState('idle');
    clearAvatarReaction();
  };
}

/** Test hook. */
export function resetAvatarState(): void {
  baseState = 'idle';
  effectiveState = 'idle';
  reaction = null;
  stateListeners.clear();
  reactionListeners.clear();
  unsubscribeClock?.();
  unsubscribeClock = null;
}
