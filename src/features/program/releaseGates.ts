import type { RoleplayProgram } from '../../contracts/program';
import type { MissionDefinition } from '../../types';
import { getScene } from '../../content/scenes';
import { MISSION_CATALOG } from '../../data/missions';
import { validateProgramAgainstCatalog } from '../../data/programs';
import { validateMissionScenarioFamily } from '../../content/scenarioFamilies';
import { modelCheckScene } from '../roleplay/sceneModelChecker';
import { validateSceneDefinition } from '../roleplay/sceneValidation';
import { validateCharacterBehaviorPolicy } from '../roleplay/characterPolicy';

export interface ReleaseGateResult {
  ready: boolean;
  errors: string[];
}

export function validateMissionForProgramRelease(
  mission: MissionDefinition
): ReleaseGateResult {
  const errors: string[] = [];

  if (!mission.id.trim()) errors.push('mission id is required');
  if (!Number.isInteger(mission.version) || mission.version < 1) {
    errors.push(`${mission.id}: version must be a positive integer`);
  }
  if (!mission.scenarioFamilyId.trim()) {
    errors.push(`${mission.id}: scenarioFamilyId is required`);
  }
  errors.push(...validateMissionScenarioFamily(mission));
  errors.push(...validateCharacterBehaviorPolicy(mission));

  if (mission.primarySkillIds.length === 0) {
    errors.push(`${mission.id}: at least one primary CommunicativeSkill is required`);
  }
  if (!mission.character.role.trim()) {
    errors.push(`${mission.id}: learner-facing character role is required`);
  }
  if (mission.character.knowledgeBoundary.length === 0) {
    errors.push(`${mission.id}: character knowledge boundary is required`);
  }
  if (!mission.supportPolicy.hintLadderAvailable) {
    errors.push(`${mission.id}: learner-triggered help must remain available`);
  }
  if (mission.completionSignals.length === 0) {
    errors.push(`${mission.id}: authored completion signals are required`);
  }

  if (!mission.sceneId) {
    errors.push(`${mission.id}: a released executable scene is required`);
    return { ready: errors.length === 0, errors };
  }

  const scene = getScene(mission.sceneId);
  if (!scene) {
    errors.push(`${mission.id}: unknown scene ${mission.sceneId}`);
    return { ready: false, errors };
  }
  if (scene.missionId !== mission.id) {
    errors.push(`${mission.id}: scene ${scene.id} belongs to ${scene.missionId}`);
  }
  if (scene.language !== mission.language) {
    errors.push(
      `${mission.id}: scene language ${scene.language} does not match mission language ${mission.language}`
    );
  }
  if (scene.reviewStatus !== 'released') {
    errors.push(`${mission.id}: scene ${scene.id} is not released`);
  }

  const missionPhraseIds = new Set(mission.usefulPhrases.map(phrase => phrase.id));
  for (const phraseId of scene.phraseIds) {
    if (!missionPhraseIds.has(phraseId)) {
      errors.push(
        `${mission.id}: scene phrase ${phraseId} is not present in mission usefulPhrases`
      );
    }
  }

  const missionSkillIds = new Set([
    ...mission.primarySkillIds,
    ...mission.secondarySkillIds,
  ]);
  for (const skillId of scene.skillIds) {
    if (!missionSkillIds.has(skillId)) {
      errors.push(
        `${mission.id}: scene skill ${skillId} is not declared by the mission`
      );
    }
  }

  const staticValidation = validateSceneDefinition(scene);
  errors.push(...staticValidation.errors.map(error => `${mission.id}: ${error}`));

  if (staticValidation.valid) {
    const model = modelCheckScene(scene);
    errors.push(...model.errors.map(error => `${mission.id}: ${error}`));

    if (!model.achievedPath) {
      errors.push(`${mission.id}: scene has no reachable achieved completion`);
    }
    if (scene.opportunityDefinitions.length === 0) {
      errors.push(`${mission.id}: at least one authored skill opportunity is required`);
    }
    if (model.reachableOpportunityIds.length === 0) {
      errors.push(`${mission.id}: no authored skill opportunity is reachable`);
    }
  }

  for (const opportunity of scene.opportunityDefinitions) {
    if (opportunity.positiveExamples.length === 0) {
      errors.push(`${mission.id}/${opportunity.id}: positive opportunity examples are required`);
    }
    if (opportunity.negativeExamples.length === 0) {
      errors.push(`${mission.id}/${opportunity.id}: negative opportunity examples are required`);
    }
  }

  return { ready: errors.length === 0, errors };
}

function hasRealTransferPath(program: RoleplayProgram): boolean {
  const missions = program.missionPlan
    .map(ref =>
      MISSION_CATALOG.find(
        mission => mission.id === ref.missionId && mission.version === ref.missionVersion
      )
    )
    .filter((mission): mission is MissionDefinition => Boolean(mission));

  for (let i = 0; i < missions.length; i += 1) {
    const a = missions[i];
    const skillsA = new Set([...a.primarySkillIds, ...a.secondarySkillIds]);
    for (let j = i + 1; j < missions.length; j += 1) {
      const b = missions[j];
      if (a.scenarioFamilyId === b.scenarioFamilyId) continue;
      if ([...b.primarySkillIds, ...b.secondarySkillIds].some(skill => skillsA.has(skill))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Fail-closed activation boundary for a learner-facing program.
 *
 * Draft/reviewed programs may be previewed, but only a released program whose
 * pinned mission content passes deterministic validation may become executable.
 */
export function validateProgramForActivation(
  program: RoleplayProgram
): ReleaseGateResult {
  const errors = [...validateProgramAgainstCatalog(program).errors];

  if (program.reviewStatus !== 'released') {
    errors.push(`${program.id}: program is ${program.reviewStatus}, not released`);
  }

  for (const ref of program.missionPlan) {
    const mission = MISSION_CATALOG.find(
      candidate => candidate.id === ref.missionId && candidate.version === ref.missionVersion
    );
    if (!mission) continue;
    errors.push(
      ...validateMissionForProgramRelease(mission).errors.map(
        error => `missionPlan/${ref.missionId}: ${error}`
      )
    );
  }

  if (program.missionPlan.length > 1 && !hasRealTransferPath(program)) {
    errors.push(`${program.id}: no real cross-family transfer path exists`);
  }

  if (program.finalSimulation) {
    const ref = program.finalSimulation.mission;
    const mission = MISSION_CATALOG.find(
      candidate => candidate.id === ref.missionId && candidate.version === ref.missionVersion
    );
    if (!mission) {
      errors.push(`${program.id}: final simulation mission is unavailable`);
    } else {
      errors.push(
        ...validateMissionForProgramRelease(mission).errors.map(
          error => `finalSimulation: ${error}`
        )
      );
    }
  }

  return { ready: errors.length === 0, errors: [...new Set(errors)] };
}

export function isProgramActivatable(program: RoleplayProgram): boolean {
  return validateProgramForActivation(program).ready;
}
