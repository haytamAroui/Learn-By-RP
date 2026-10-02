export interface ConsentDecisionPresence {
  granted: boolean;
}

export function consentDecisionsComplete(
  voice: ConsentDecisionPresence | null,
  savedAnalysis: ConsentDecisionPresence | null
): boolean {
  // null = undecided. A false record is still an explicit refusal and must not
  // force the learner through onboarding again.
  return Boolean(voice && savedAnalysis);
}
