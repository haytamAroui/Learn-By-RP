import { describe, expect, it } from 'vitest';
import type { SessionRecord } from '../../types';
import { SPANISH_DAILY_SERVICES_PILOT } from '../../data/programs';
import { buildProgramProjection, isProgramCoreComplete } from './projection';

function session(missionId: string, missionVersion: number, completed: boolean): SessionRecord {
  return {
    id: `session-${missionId}`,
    missionId,
    missionVersion,
    language: 'es',
    mode: 'guided',
    coldAttempt: true,
    state: completed ? 'recap_ready' : 'ended',
    startedAt: '2026-10-03T00:00:00.000Z',
    endedAt: '2026-10-03T00:05:00.000Z',
    passages: [],
    supportExposures: [],
    observations: [],
    taskOutcome: completed ? 'completed' : 'unknown',
    sceneState: {
      sceneId: missionId,
      revision: 1,
      facts: {},
      learnerKnows: [],
      characterKnows: [],
      checkpoints: [],
      isFinished: completed,
      outcome: completed ? 'achieved' : 'unknown',
    },
  };
}

describe('program projection', () => {
  it('advances only from completed pinned mission versions', () => {
    const [first, second] = SPANISH_DAILY_SERVICES_PILOT.missionPlan;
    const projection = buildProgramProjection(
      SPANISH_DAILY_SERVICES_PILOT,
      [session(first.missionId, first.missionVersion, true)]
    );

    expect(projection.completedMissionIds).toEqual([first.missionId]);
    expect(projection.currentMissionId).toBe(second.missionId);
  });

  it('ignores a completion from the wrong mission version', () => {
    const [first] = SPANISH_DAILY_SERVICES_PILOT.missionPlan;
    const projection = buildProgramProjection(
      SPANISH_DAILY_SERVICES_PILOT,
      [session(first.missionId, first.missionVersion + 1, true)]
    );

    expect(projection.completedMissionIds).toEqual([]);
    expect(projection.currentMissionId).toBe(first.missionId);
  });

  it('marks the core route complete only when every pinned mission is completed', () => {
    const completed = SPANISH_DAILY_SERVICES_PILOT.missionPlan.map(ref =>
      session(ref.missionId, ref.missionVersion, true)
    );
    const projection = buildProgramProjection(SPANISH_DAILY_SERVICES_PILOT, completed);
    expect(isProgramCoreComplete(SPANISH_DAILY_SERVICES_PILOT, projection)).toBe(true);
  });
});
