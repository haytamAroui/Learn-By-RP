import { SessionState } from '../../types';

/**
 * Session lifecycle (§11.4).
 *
 * Persist before streaming begins. Cancel active work and close audio on every
 * end path. `creation_uncertain` exists so an ambiguous hosted-session creation
 * is never blindly retried into a second billed call.
 */
export type LifecycleState =
  | 'created'
  | 'preflight'
  | 'connecting'
  | 'creation_uncertain'
  | 'live'
  | 'paused'
  | 'reconnecting'
  | 'ending'
  | 'ended'
  | 'recap_pending'
  | 'recap_ready'
  | 'recap_unavailable';

export type LifecycleEvent =
  | 'PREFLIGHT'
  | 'CONNECT'
  | 'CONNECTED'
  | 'CONNECTION_LOST'
  | 'CREATION_UNCERTAIN'
  | 'RECONCILED'
  | 'EXPIRED'
  | 'FREEZE'
  | 'RESUME'
  | 'RECONNECTED'
  | 'GIVE_UP'
  | 'END'
  | 'PLAYBACK_VERIFIED'
  | 'ENDED'
  | 'ASSESS_START'
  | 'ASSESS_OK'
  | 'ASSESS_FAILED';

const TRANSITIONS: Record<LifecycleState, Partial<Record<LifecycleEvent, LifecycleState>>> = {
  created: { PREFLIGHT: 'preflight' },
  preflight: { CONNECT: 'connecting', END: 'ending' },
  connecting: {
    CONNECTED: 'live',
    CREATION_UNCERTAIN: 'creation_uncertain',
    CONNECTION_LOST: 'reconnecting',
    END: 'ending',
  },
  creation_uncertain: {
    RECONCILED: 'live',
    EXPIRED: 'ended',
    END: 'ending',
  },
  live: {
    FREEZE: 'paused',
    CONNECTION_LOST: 'reconnecting',
    END: 'ending',
  },
  paused: { RESUME: 'live', END: 'ending' },
  reconnecting: {
    RECONNECTED: 'live',
    GIVE_UP: 'ended',
    END: 'ending',
  },
  ending: { PLAYBACK_VERIFIED: 'ended', END: 'ended' },
  ended: { ASSESS_START: 'recap_pending' },
  recap_pending: { ASSESS_OK: 'recap_ready', ASSESS_FAILED: 'recap_unavailable' },
  recap_ready: {},
  recap_unavailable: {},
};

/** States where a provider call may exist and a blind retry would double-bill. */
export const BILLING_SENSITIVE_STATES: LifecycleState[] = ['connecting', 'creation_uncertain', 'live'];

/** Maps the lifecycle state onto the persisted SessionState vocabulary. */
const SESSION_STATE_BY_LIFECYCLE: Record<LifecycleState, SessionState> = {
  created: 'preflight',
  preflight: 'preflight',
  connecting: 'connecting',
  creation_uncertain: 'connecting',
  reconnecting: 'reconnecting',
  live: 'live',
  paused: 'paused',
  ending: 'ending',
  ended: 'ended',
  recap_pending: 'recap_pending',
  recap_ready: 'recap_ready',
  recap_unavailable: 'recap_unavailable',
};

export function toSessionState(state: LifecycleState): SessionState {
  return SESSION_STATE_BY_LIFECYCLE[state];
}

/** Terminal states need no further transition. */
export function isTerminal(state: LifecycleState): boolean {
  return state === 'recap_ready' || state === 'recap_unavailable';
}

export function canTransition(from: LifecycleState, event: LifecycleEvent): boolean {
  return Boolean(TRANSITIONS[from]?.[event]);
}

export function nextState(from: LifecycleState, event: LifecycleEvent): LifecycleState {
  const target = TRANSITIONS[from]?.[event];
  if (!target) {
    throw new Error(`Illegal session transition: ${from} + ${event}`);
  }
  return target;
}

/**
 * Pure lifecycle reducer. Returns the same state for an unknown event so a
 * duplicated callback cannot corrupt a session.
 */
export function reduceLifecycle(
  from: LifecycleState,
  event: LifecycleEvent
): LifecycleState {
  if (!canTransition(from, event)) return from;
  return nextState(from, event);
}

/** Reconnection is bounded, never a silent retry loop. */
export const MAX_RECONNECT_ATTEMPTS = 3;
