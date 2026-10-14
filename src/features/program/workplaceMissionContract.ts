import type { MissionDefinition } from '../../types';
import { workplaceContextFor } from '../../content/workplaceContexts';

/**
 * Authoring contract for the workplace vertical. This is not an assessment of
 * employees: it checks that every professional mission has authentic task DNA
 * and a known, explicitly selected occupational context.
 */
export function validateWorkplaceMissionContract(mission: MissionDefinition): string[] {
  if (!mission.workplaceContextId && !mission.workplaceTaskId) return [];

  const errors: string[] = [];
  const context = mission.workplaceContextId
    ? workplaceContextFor(mission.workplaceContextId)
    : undefined;

  if (!context) {
    errors.push(`${mission.id}: unknown workplace context`);
  }
  if (!mission.workplaceTaskId || !context?.taskIds.includes(mission.workplaceTaskId)) {
    errors.push(`${mission.id}: workplace task is not reviewed for this context`);
  }
  if (mission.language !== 'nl' || context?.locale !== 'nl-BE') {
    errors.push(`${mission.id}: workplace pilot must use Belgian Dutch`);
  }

  const required: readonly (keyof NonNullable<MissionDefinition['taskContract']>)[] = [
    'learnerRole',
    'communicationNeed',
    'friction',
    'consequence',
    'rescue',
    'realWorldBridge',
  ];
  for (const field of required) {
    if (!mission.taskContract?.[field]?.trim()) {
      errors.push(`${mission.id}: taskContract.${field} must be authored`);
    }
  }
  if (!mission.sceneId) {
    errors.push(`${mission.id}: workplace task must link to an authored scene`);
  }
  if (mission.primarySkillIds.length === 0) {
    errors.push(`${mission.id}: workplace task must declare a communicative skill`);
  }
  return errors;
}
