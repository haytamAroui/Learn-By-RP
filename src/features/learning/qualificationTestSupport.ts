/**
 * Test support for the opportunity qualification gate.
 *
 * Tests need both halves of the gate: an authored qualification nobody has
 * accepted, and an accepted one. The second is not a test-only fiction — it is
 * exactly what happens when a qualified reviewer signs off in content, so this
 * helper performs that same mutation rather than building a parallel definition
 * that the runtime would never read.
 *
 * Mutating the shared scene object is deliberate and is why every call restores
 * it: the alternative is a fixture the validator cannot see, which is how a gate
 * ends up passing for the wrong reason.
 */

import type { SkillOpportunityDefinition } from '../../contracts/scene';
import { OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION } from '../../contracts/scene';

/**
 * Runs `body` with `definition`'s authored qualification accepted by a named
 * reviewer, restoring the original value afterwards even if `body` throws.
 */
export function withReviewedOpportunityQualification<T>(
  definition: SkillOpportunityDefinition,
  body: () => T,
  reviewer: { reviewerId: string; reviewedAt?: string } = {
    reviewerId: 'test-qualified-reviewer',
    reviewedAt: '2026-10-04T00:00:00.000Z',
  }
): T {
  const original = definition.qualification;
  definition.qualification = {
    rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
    status: 'reviewed',
    rationale: original?.rationale ?? 'Test-only reviewer acceptance.',
    reviewerId: reviewer.reviewerId,
    reviewedAt: reviewer.reviewedAt ?? '2026-10-04T00:00:00.000Z',
    reviewNotes: 'Recorded by test support only; not a production review.',
  };
  try {
    return body();
  } finally {
    definition.qualification = original;
  }
}