import { describe, expect, it } from 'vitest';
import {
  CarryForwardFact,
  canCarryFactToMission,
  clearContinuityFact,
  continuityFactsForMission,
  upsertContinuityFact,
} from './continuity';

const FACT: CarryForwardFact = {
  id: 'fact-1',
  key: 'prefers_plant_milk',
  value: true,
  sensitivity: 'low',
  source: {
    sessionId: 's-1',
    missionId: 'mission-es-cafe-sol',
    recordedAt: '2026-10-01T10:00:00.000Z',
  },
  allowedMissionIds: ['mission-es-farmacia-sol'],
  expiresAt: '2026-11-01T00:00:00.000Z',
  localOnly: true,
  learnerEditable: true,
};

describe('connected-world continuity facts', () => {
  it('carries only to explicitly allowed missions before expiry', () => {
    expect(
      canCarryFactToMission({
        fact: FACT,
        missionId: 'mission-es-farmacia-sol',
        now: Date.parse('2026-10-02T00:00:00.000Z'),
      })
    ).toBe(true);

    expect(
      canCarryFactToMission({
        fact: FACT,
        missionId: 'mission-es-cafe-sol',
        now: Date.parse('2026-10-02T00:00:00.000Z'),
      })
    ).toBe(false);
  });

  it('never carries high-sensitivity facts across scenes', () => {
    expect(
      canCarryFactToMission({
        fact: { ...FACT, sensitivity: 'high' },
        missionId: 'mission-es-farmacia-sol',
      })
    ).toBe(false);
  });

  it('expires facts deterministically', () => {
    expect(
      canCarryFactToMission({
        fact: FACT,
        missionId: 'mission-es-farmacia-sol',
        now: Date.parse('2026-12-01T00:00:00.000Z'),
      })
    ).toBe(false);
  });

  it('supports learner edit/clear without hidden copies', () => {
    const profile = upsertContinuityFact({ alias: 'Alex', facts: [] }, FACT);
    expect(
      continuityFactsForMission({
        profile,
        missionId: 'mission-es-farmacia-sol',
        now: Date.parse('2026-10-02T00:00:00.000Z'),
      })
    ).toHaveLength(1);

    expect(clearContinuityFact(profile, FACT.id).facts).toEqual([]);
  });
});
