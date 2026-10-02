import type { ConsentRecord } from '../archive/ArchiveRepository.types';

export function consentDecisionsComplete(
  voice: ConsentRecord | null,
  savedAnalysis: ConsentRecord | null
): boolean {
  // null = undecided. A false record is still an explicit refusal and must not
  // force the learner through onboarding again.
  return Boolean(voice && savedAnalysis);
}
