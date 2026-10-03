import type {
  CommunicativeSkillId,
  SessionRecord,
  SkillLapse,
  SkillObservation,
} from '../../types';
import type { ProgramProjection, RoleplayProgram } from '../../contracts/program';

function belongsToProgram(program: RoleplayProgram, session: SessionRecord): boolean {
  return program.missionPlan.some(
    ref => ref.missionId === session.missionId && ref.missionVersion === session.missionVersion
  );
}

/**
 * Rebuilds program progress only from durable learner history.
 *
 * The projection never stores its own truth: deleting/disputing the underlying
 * records and rebuilding produces the new answer deterministically.
 */
export function buildProgramProjection(
  program: RoleplayProgram,
  sessions: SessionRecord[],
  observations: SkillObservation[] = [],
  lapses: SkillLapse[] = [],
  rebuiltAt = new Date().toISOString()
): ProgramProjection {
  const programSessions = sessions.filter(session => belongsToProgram(program, session));

  const completedMissionIds = program.missionPlan
    .filter(ref =>
      programSessions.some(
        session =>
          session.missionId === ref.missionId &&
          session.missionVersion === ref.missionVersion &&
          session.taskOutcome === 'completed'
      )
    )
    .map(ref => ref.missionId);

  const completed = new Set(completedMissionIds);
  const currentMissionId = program.missionPlan.find(ref => !completed.has(ref.missionId))?.missionId;
  const sessionIds = new Set(programSessions.map(session => session.id));

  const demonstratedSkillIds = [...new Set(
    observations
      .filter(
        observation =>
          sessionIds.has(observation.sessionId) &&
          observation.evidenceSource === 'validated_explicit' &&
          observation.demonstration === 'demonstrated' &&
          !observation.hidden &&
          !observation.userDisputed
      )
      .map(observation => observation.skillId)
  )] as CommunicativeSkillId[];

  const reviewSkillIds = [...new Set(
    lapses
      .filter(lapse => sessionIds.has(lapse.sessionId))
      .map(lapse => lapse.skillId)
  )] as CommunicativeSkillId[];

  return {
    programId: program.id,
    programVersion: program.version,
    completedMissionIds,
    currentMissionId,
    demonstratedSkillIds,
    reviewSkillIds,
    rebuiltAt,
  };
}

export function isProgramCoreComplete(
  program: RoleplayProgram,
  projection: ProgramProjection
): boolean {
  return program.missionPlan.length > 0 &&
    program.missionPlan.every(ref => projection.completedMissionIds.includes(ref.missionId));
}
