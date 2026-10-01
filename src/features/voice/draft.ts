import type { Passage } from '../../types';

/**
 * What a learner typed, held across a failed assistant turn.
 *
 * The rule: a draft survives a failure and is cleared only by an explicit submit or
 * by the learner dismissing it. Losing a typed sentence because the network blipped
 * is the single most demoralising thing this app could do - they retyped it, and it
 * is gone with no way to know whether it was ever sent.
 */

export interface TypedDraft {
  text: string;
  /** When it was typed, so a stale draft can be surfaced rather than silently sent. */
  recordedAtMs: number;
  /** Set when a send has already been attempted, so the UI can say it was not lost. */
  attemptedAtMs?: number;
}

export interface DraftState {
  draft: TypedDraft | null;
  /** Turns whose text has already been added to the transcript. */
  submittedTurnIds: readonly string[];
}

/** Preserves a draft only if it still holds text worth keeping. */
export function captureDraft(text: string, nowMs: number): DraftState {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { draft: null, submittedTurnIds: [] };
  return { draft: { text: trimmed, recordedAtMs: nowMs }, submittedTurnIds: [] };
}

/**
 * Decides whether a draft may be sent as a new turn.
 *
 * Idempotent on `turnId`: retrying the same turn must not append it twice. The
 * caller passes a stable id derived from the content and attempt, which is what
 * keeps a double-tap or a retried request from producing a duplicate transcript
 * entry - and therefore a duplicate piece of evidence.
 */
export function commitDraft(
  state: DraftState,
  turnId: string,
  nowMs: number
): { state: DraftState; appended: boolean } {
  if (!state.draft) return { state, appended: false };

  if (state.submittedTurnIds.includes(turnId)) {
    // Already recorded. Keep the draft visible so nothing appears to vanish, but do
    // not write a second transcript entry.
    return {
      state: { ...state, draft: { ...state.draft, attemptedAtMs: nowMs } },
      appended: false,
    };
  }

  return {
    state: {
      draft: null,
      submittedTurnIds: [...state.submittedTurnIds, turnId],
    },
    appended: true,
  };
}

/**
 * A stable id for one typed attempt.
 *
 * Derived from the draft text and the session rather than from the clock, so the
 * same words in the same session always produce the same id. A clock-based id would
 * make every retry look like a new turn, which is exactly what commitDraft exists to
 * prevent.
 */
export function draftTurnId(sessionId: string, text: string): string {
  const normalised = text.trim().replace(/\s+/g, ' ').toLowerCase();
  return `${sessionId}:typed:${normalised}`;
}

/**
 * Turns a draft into a passage.
 *
 * Always `final` and never `partial`: a typed turn is complete the moment it is
 * submitted, and marking it partial would let it be treated as still-speaking, which
 * would withhold evidence for a turn the learner already finished.
 */
export function draftToPassage(
  draft: TypedDraft,
  sessionId: string,
  attemptId: string
): Passage {
  return {
    id: draftTurnId(sessionId, draft.text),
    sessionId,
    attemptId,
    speaker: 'user',
    revisionKey: draftTurnId(sessionId, draft.text),
    assemblyVersion: 1,
    status: 'final',
    text: draft.text,
    meaning: undefined,
    modality: 'typed',
    startedAt: new Date(draft.recordedAtMs).toISOString(),
    endedAt: new Date(draft.recordedAtMs).toISOString(),
    fragments: [],
  } as Passage;
}

/**
 * Removes any passage that a later attempt superseded.
 *
 * Used when a retry produces a better-scored reading of the same words: the earlier
 * one has to go, or the transcript accumulates two turns the learner only spoke
 * once, and the evidence count stops matching what happened.
 */
export function dedupeByTurnId(passages: Passage[]): Passage[] {
  const seen = new Set<string>();
  const result: Passage[] = [];

  for (const passage of passages) {
    if (seen.has(passage.id)) continue;
    seen.add(passage.id);
    result.push(passage);
  }

  return result;
}

