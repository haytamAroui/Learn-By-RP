import type { SceneActionResult } from '../../contracts/scene';

export interface ProposedActorAction {
  name: string;
  payload: Record<string, unknown>;
}

/**
 * Provider output is untrusted semantic output. Only authored action names are
 * allowed to cross into the reducer proposal layer.
 */
export function sanitizeActorAction(
  proposedAction: unknown,
  allowedActions: readonly string[]
): ProposedActorAction | null {
  if (!proposedAction || typeof proposedAction !== 'object') return null;

  const candidate = proposedAction as {
    name?: unknown;
    payload?: unknown;
  };
  if (
    typeof candidate.name !== 'string' ||
    !allowedActions.includes(candidate.name)
  ) {
    return null;
  }

  return {
    name: candidate.name,
    payload:
      candidate.payload &&
      typeof candidate.payload === 'object' &&
      !Array.isArray(candidate.payload)
        ? (candidate.payload as Record<string, unknown>)
        : {},
  };
}

/**
 * A normal conversational line can be committed immediately. A line coupled to
 * a consequential scene proposal can be committed only after reducer acceptance.
 */
export function mayCommitActorReply(
  proposedAction: unknown,
  reducerResult: SceneActionResult | null | undefined
): boolean {
  if (!proposedAction) return true;
  return reducerResult?.accepted === true;
}
