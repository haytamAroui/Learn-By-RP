import { Passage, SupportExposure } from '../../types';
import { LEARNING_POLICY_VERSION } from './policy';

/**
 * Carry support knowledge across an explicit retry/fork.
 *
 * Scene state may rewind. Learner knowledge does not. We materialise inherited
 * support into the new attempt instead of making attempt filters fuzzy, so every
 * downstream evidence record still has exact attempt provenance.
 */
export function inheritSupportForRetry(input: {
  exposures: SupportExposure[];
  fromAttemptId: string;
  toAttemptId: string;
  recordedAt: string;
}): SupportExposure[] {
  const inherited = input.exposures
    .filter(exposure => exposure.attemptId === input.fromAttemptId)
    .map(exposure => ({
      ...exposure,
      id: `retry:${input.toAttemptId}:${exposure.id}`,
      attemptId: input.toAttemptId,
      source: 'retry' as const,
      policyVersion: exposure.policyVersion ?? LEARNING_POLICY_VERSION,
      recordedAt: input.recordedAt,
    }));

  const existingIds = new Set(input.exposures.map(exposure => exposure.id));
  return [
    ...input.exposures,
    ...inherited.filter(exposure => !existingIds.has(exposure.id)),
  ];
}


/** Preserve earlier attempt transcripts without duplicating replayed passage ids. */
export function mergeAttemptPassages(
  archived: Passage[],
  current: Passage[]
): Passage[] {
  const byId = new Map<string, Passage>();
  for (const passage of [...archived, ...current]) byId.set(passage.id, passage);
  return [...byId.values()].sort((a, b) =>
    (a.startedAt ?? '').localeCompare(b.startedAt ?? '')
  );
}
