import type {
  CarryForwardFact,
  LearnerContinuityProfile,
} from '../../types';

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
