import type { VisemeShape } from './visemes';

/**
 * Shared playback clock.
 *
 * The transport already emits playback events for the session that owns it.
 * Visual features that are not part of that session - a character renderer,
 * for example - need the same position in the same line without reaching
 * into session internals. This is that single shared position.
 */
export interface PlaybackClockState {
  speaking: boolean;
  /** The learner is speaking, or the microphone is open. */
  listening: boolean;
  currentTimeMs: number;
  durationMs: number;
  viseme: VisemeShape;
}

type PlaybackClockListener = (state: PlaybackClockState) => void;

const IDLE_STATE: PlaybackClockState = {
  speaking: false,
  listening: false,
  currentTimeMs: 0,
  durationMs: 0,
  viseme: 'sil',
};

let currentState: PlaybackClockState = IDLE_STATE;
const listeners = new Set<PlaybackClockListener>();

function emitState(next: PlaybackClockState) {
  currentState = next;
  for (const listener of [...listeners]) {
    try {
      listener(currentState);
    } catch {
      // A failing visual consumer must never break playback.
    }
  }
}

export function getPlaybackClockState(): PlaybackClockState {
  return currentState;
}

export function subscribePlaybackClock(listener: PlaybackClockListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function markPlaybackStarted(): void {
  emitState({ ...IDLE_STATE, speaking: true });
}

export function markListeningStarted(): void {
  emitState({ ...currentState, listening: true });
}

export function markListeningEnded(): void {
  emitState({ ...currentState, listening: false });
}

export function publishPlaybackProgress(payload: {
  currentTimeMs: number;
  durationMs: number;
  viseme: VisemeShape;
}): void {
  emitState({
    ...currentState,
    speaking: true,
    currentTimeMs: Math.max(0, payload.currentTimeMs),
    durationMs: Math.max(0, payload.durationMs),
    viseme: payload.viseme,
  });
}

export function markPlaybackEnded(): void {
  emitState(IDLE_STATE);
}

/** Test hook. Production code never needs to reset the clock by hand. */
export function resetPlaybackClock(): void {
  currentState = IDLE_STATE;
  listeners.clear();
}
