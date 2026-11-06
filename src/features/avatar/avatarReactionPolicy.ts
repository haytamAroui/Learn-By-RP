import { isProductionFormExposure } from '../learning/supportScope';
import type { SupportExposure } from '../../types';
import type { AvatarReaction } from './avatarExpressions';

/**
 * When the character reacts, and how.
 *
 * The character must not say anything the learning evidence would contradict.
 * A turn that was assisted is not a success to be celebrated, and a turn that
 * did nothing notable is not a failure to be commiserated. The rules here use
 * the same support ledger the evidence uses, so the face and the record agree.
 */
export interface AvatarTurnSignal {
  /** The scene accepted a proposed action: the learner's turn moved the world. */
  sceneAcceptedAction: boolean;
  /** Support that could expose the learner's own production was on screen. */
  turnWasAssisted: boolean;
}

/**
 * The reaction for a turn, or none.
 *
 * An assisted turn is acknowledged with concern rather than praise: the learner
 * got there, and the character shows that it noticed the help.
 */
export function reactionForTurn(signal: AvatarTurnSignal): AvatarReaction | null {
  if (signal.turnWasAssisted) return 'consider';
  if (signal.sceneAcceptedAction) return 'encourage';
  return null;
}

/**
 * The reaction for a finished session.
 *
 * A session that was carried through to the end is worth a reaction. One that
 * the learner cut short is not.
 */
export function reactionForSession(input: {
  completed: boolean;
  assisted: boolean;
}): AvatarReaction | null {
  if (!input.completed) return null;
  return input.assisted ? 'encourage' : 'praise';
}

/**
 * Whether support that could expose the learner's production was on screen
 * during a turn.
 *
 * The window is the turn itself: support shown before the learner spoke is
 * modelling, and support shown after the reply is bookkeeping. This is the
 * same rule the evidence uses to decide whether a turn was assisted.
 */
export function turnWasAssisted(input: {
  exposures: readonly SupportExposure[];
  turnStartedAt: string;
  replyEndedAt: string;
}): boolean {
  const start = Date.parse(input.turnStartedAt);
  const end = Date.parse(input.replyEndedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;

  return input.exposures.some(exposure => {
    if (!isProductionFormExposure(exposure)) return false;
    const at = Date.parse(exposure.recordedAt);
    return Number.isFinite(at) && at >= start && at <= end;
  });
}
