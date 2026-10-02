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
  /**
   * Number of ledger rows that existed when the retry began. Support after the
   * scene checkpoint but before this mark still counts; later rows do not.
   */
  supportLedgerHighWaterMark: number;
  recordedAt: string;
}): SupportExposure[] {
  if (
    !Number.isInteger(input.supportLedgerHighWaterMark) ||
    input.supportLedgerHighWaterMark < 0 ||
    input.supportLedgerHighWaterMark > input.exposures.length
  ) {
    throw new Error('Invalid supportLedgerHighWaterMark');
  }

  const inherited = input.exposures
    .slice(0, input.supportLedgerHighWaterMark)
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
