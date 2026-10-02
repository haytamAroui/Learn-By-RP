import { MISSION_CATALOG } from '../../data/missions';
import { COMMUNICATIVE_SKILLS_CATALOG, isDirectlyEvidencedSkill } from '../../content/skills';
import { CommunicativeSkillId, MissionDefinition } from '../../types';

/**
 * Which skills a mission may produce evidence for.
 *
 * This is the single answer to that question. The validator enforces it when
 * writing, and the server tells the model the same list so the model is not asked
 * to guess. A prompt is not a security boundary, so the two must not drift: they
 * both call this.
 */

export function missionFor(missionId: string | undefined): MissionDefinition | undefined {
  return MISSION_CATALOG.find(m => m.id === missionId);
}

/** All pedagogical ids the mission declares, primary first. */
export function allowedSkillIds(mission: MissionDefinition | undefined): CommunicativeSkillId[] {
  if (!mission) return [];
  return [...new Set([...mission.primarySkillIds, ...mission.secondarySkillIds])];
}

/** Only mission skills that may receive direct learning evidence. */
export function evidentiarySkillIds(
  mission: MissionDefinition | undefined
): CommunicativeSkillId[] {
  return allowedSkillIds(mission).filter(isDirectlyEvidencedSkill);
}

/** The catalogue entries a model is permitted to propose, with enough to identify them. */
export function allowedSkillsForMission(
  missionId: string | undefined
): Array<{ id: string; name: string; description: string }> {
  const allowed = new Set(allowedSkillIds(missionFor(missionId)));

  return COMMUNICATIVE_SKILLS_CATALOG.filter(skill => allowed.has(skill.id)).map(skill => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
  }));
}

/**
 * Evidence-facing allowlist used by assessment. Derived families may still be
 * pedagogically attached to a mission, but the assessor must never propose them
 * as direct learner evidence.
 */
export function evidentiarySkillsForMission(
  missionId: string | undefined
): Array<{ id: string; name: string; description: string }> {
  const allowed = new Set(evidentiarySkillIds(missionFor(missionId)));

  return COMMUNICATIVE_SKILLS_CATALOG.filter(skill => allowed.has(skill.id)).map(skill => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
  }));
}