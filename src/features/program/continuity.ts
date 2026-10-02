export type CarryForwardSensitivity = 'low' | 'medium' | 'high';

export interface CarryForwardFact {
  id: string;
  key: string;
  value: string | boolean | number;
  sensitivity: CarryForwardSensitivity;
  source: {
    sessionId: string;
    missionId: string;
    recordedAt: string;
  };
  /** Explicit destination allowlist. Empty means it carries nowhere. */
  allowedMissionIds: string[];
  expiresAt?: string;
  /** V1 continuity facts never leave the local learner archive. */
  localOnly: true;
  learnerEditable: true;
}

export interface LearnerContinuityProfile {
  /** Alias shown inside fictional worlds; real name is never required. */
  alias?: string;
  facts: CarryForwardFact[];
}

export function canCarryFactToMission(input: {
  fact: CarryForwardFact;
  missionId: string;
  now?: number;
}): boolean {
  const { fact, missionId } = input;
  const now = input.now ?? Date.now();

  if (fact.localOnly !== true) return false;
  if (fact.sensitivity === 'high') return false;
  if (!fact.allowedMissionIds.includes(missionId)) return false;

  if (fact.expiresAt) {
    const expiry = Date.parse(fact.expiresAt);
    if (!Number.isFinite(expiry) || expiry <= now) return false;
  }

  return true;
}

export function continuityFactsForMission(input: {
  profile: LearnerContinuityProfile;
  missionId: string;
  now?: number;
}): CarryForwardFact[] {
  return input.profile.facts.filter(fact =>
    canCarryFactToMission({
      fact,
      missionId: input.missionId,
      now: input.now,
    })
  );
}

export function upsertContinuityFact(
  profile: LearnerContinuityProfile,
  fact: CarryForwardFact
): LearnerContinuityProfile {
  const remaining = profile.facts.filter(existing => existing.id !== fact.id);
  return { ...profile, facts: [...remaining, fact] };
}

export function clearContinuityFact(
  profile: LearnerContinuityProfile,
  factId: string
): LearnerContinuityProfile {
  return {
    ...profile,
    facts: profile.facts.filter(fact => fact.id !== factId),
  };
}
