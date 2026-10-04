import type { TaskOutcome } from '../../types';

/**
 * How a scene result is described to a learner.
 *
 * This is deliberately not `TaskOutcome`. `TaskOutcome` is the vocabulary the scene
 * reducer and the assessor speak; the receipt is what a learner reads after the
 * conversation, and conflating the two is how "completed" ended up being written into
 * a field that only accepts "achieved".
 */
export type SceneResultKind = 'achieved' | 'partial' | 'not_achieved' | 'unknown';

/** Recap translation keys, one per kind. */
export type SceneResultCopyKey =
  | 'sceneAchieved'
  | 'scenePartial'
  | 'sceneNotAchieved'
  | 'sceneUnknown';

/**
 * Authored scene outcome -> learner-facing result.
 *
 * Kept exhaustive on purpose: adding a `SceneResultKind` without a copy key is a
 * compile error, so a new outcome cannot be introduced and silently rendered as
 * "unknown".
 */
const COPY_KEY_BY_KIND: Record<SceneResultKind, SceneResultCopyKey> = {
  achieved: 'sceneAchieved',
  partial: 'scenePartial',
  not_achieved: 'sceneNotAchieved',
  unknown: 'sceneUnknown',
};

/**
 * Resolves a scene outcome to its learner-facing kind, failing closed.
 *
 * The parameter is `unknown`, not `TaskOutcome`, on purpose. Scene state arrives from
 * persisted archives, IndexedDB on web and SQLite on the server, and a record written
 * by an older build or a corrupted import can hold a value outside the vocabulary. The
 * receipt must never invent a result it cannot establish, so anything unrecognised
 * resolves to `unknown` rather than defaulting to a positive reading.
 *
 * That fail-closed behaviour is correct, and it is also invisible when the data is
 * wrong: an out-of-vocabulary outcome on a scene that plainly succeeded renders "The
 * scene result could not be established." A caller that trusts `TaskOutcome` at compile
 * time still has to survive runtime data, which is why the check lives here rather than
 * as a `switch` in the view.
 */
export function sceneResultKind(outcome: unknown): SceneResultKind {
  if (typeof outcome !== 'string') return 'unknown';
  switch (outcome) {
    case 'achieved':
    case 'partial':
    case 'not_achieved':
      return outcome;
    default:
      return 'unknown';
  }
}

/** The recap translation key for a resolved scene result. */
export function sceneResultCopyKey(outcome: unknown): SceneResultCopyKey {
  return COPY_KEY_BY_KIND[sceneResultKind(outcome)];
}

/**
 * Narrows a persisted outcome back to the authored vocabulary.
 *
 * Only useful at the boundary where untrusted data becomes typed state. Returns
 * `undefined` rather than defaulting, so a caller cannot accidentally treat a
 * malformed record as a scene that legitimately reported nothing.
 */
export function asAuthoredOutcome(outcome: unknown): TaskOutcome | undefined {
  return sceneResultKind(outcome) === 'unknown' && outcome !== 'unknown'
    ? undefined
    : (outcome as TaskOutcome);
}
