import {
  Predicate,
  SceneDefinition,
  SceneFactDefinition,
  SceneFactValue,
} from '../../contracts/scene';
import {
  isDirectlyEvidencedSkill,
  isKnownCommunicativeSkill,
} from '../../content/skills';

export const MAX_PREDICATE_DEPTH = 8;

export interface SceneValidationResult {
  valid: boolean;
  errors: string[];
}

const validatedScenes = new WeakSet<object>();

function acceptsValue(definition: SceneFactDefinition, value: SceneFactValue): boolean {
  switch (definition.type) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'enum':
      return typeof value === 'string' && definition.values.includes(value);
    case 'bounded_integer':
      return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= definition.min &&
        value <= definition.max
      );
  }
}

function validatePredicate(
  scene: SceneDefinition,
  predicate: Predicate,
  path: string,
  errors: string[],
  depth = 1
): void {
  if (depth > MAX_PREDICATE_DEPTH) {
    errors.push(`${path}: predicate depth exceeds ${MAX_PREDICATE_DEPTH}`);
    return;
  }

  if (predicate.op === 'and' || predicate.op === 'or') {
    if (predicate.predicates.length === 0) {
      errors.push(`${path}: ${predicate.op} requires at least one child predicate`);
    }
    predicate.predicates.forEach((child, index) =>
      validatePredicate(scene, child, `${path}.${predicate.op}[${index}]`, errors, depth + 1)
    );
    return;
  }

  if (predicate.op === 'not') {
    validatePredicate(scene, predicate.predicate, `${path}.not`, errors, depth + 1);
    return;
  }

  if (predicate.op === 'countOf') {
    const known = scene.allowedActions.some(action => action.name === predicate.action);
    if (!known) errors.push(`${path}: countOf references unavailable action ${predicate.action}`);
    if (!Number.isInteger(predicate.value) || predicate.value < 0) {
      errors.push(`${path}: countOf threshold must be a non-negative integer`);
    }
    return;
  }

  const definition = scene.factSchema[predicate.fact];
  if (!definition) {
    errors.push(`${path}: references undeclared fact ${predicate.fact}`);
    return;
  }

  if (predicate.op === 'exists') return;

  if (predicate.op === 'lte' || predicate.op === 'gte') {
    if (definition.type !== 'bounded_integer') {
      errors.push(`${path}: ${predicate.op} requires a bounded_integer fact`);
    }
    return;
  }

  if (predicate.op === 'in') {
    if (predicate.values.length === 0) {
      errors.push(`${path}: in requires at least one value`);
    }
    for (const value of predicate.values) {
      if (!acceptsValue(definition, value)) {
        errors.push(`${path}: value ${String(value)} is outside ${predicate.fact}'s domain`);
      }
    }
    return;
  }

  if (!acceptsValue(definition, predicate.value)) {
    errors.push(
      `${path}: value ${String(predicate.value)} is outside ${predicate.fact}'s domain`
    );
  }
}

export function validateSceneDefinition(scene: SceneDefinition): SceneValidationResult {
  const errors: string[] = [];
  const factNames = Object.keys(scene.factSchema);
  const initialNames = Object.keys(scene.initialFacts);

  if (
    scene.language === 'nl' &&
    scene.reviewStatus === 'released' &&
    !scene.speechVariety
  ) {
    errors.push('speechVariety: released Dutch scenes require a reviewed variety label');
  }


  for (const [fact, definition] of Object.entries(scene.factSchema)) {
    if (definition.type === 'enum') {
      if (definition.values.length === 0) errors.push(`factSchema.${fact}: enum is empty`);
      if (new Set(definition.values).size !== definition.values.length) {
        errors.push(`factSchema.${fact}: enum contains duplicate values`);
      }
    }
    if (definition.type === 'bounded_integer') {
      if (
        !Number.isInteger(definition.min) ||
        !Number.isInteger(definition.max) ||
        definition.min > definition.max
      ) {
        errors.push(`factSchema.${fact}: invalid bounded_integer range`);
      }
    }

    if (!(fact in scene.initialFacts)) {
      errors.push(`initialFacts: missing declared fact ${fact}`);
      continue;
    }
    if (!acceptsValue(definition, scene.initialFacts[fact])) {
      errors.push(`initialFacts.${fact}: value is outside declared domain`);
    }
  }

  for (const fact of initialNames) {
    if (!scene.factSchema[fact]) errors.push(`initialFacts: undeclared fact ${fact}`);
  }

  if (factNames.length === 0) errors.push('factSchema: scene must declare at least one fact');

  const actionNames = scene.allowedActions.map(action => action.name);
  if (new Set(actionNames).size !== actionNames.length) {
    errors.push('allowedActions: duplicate action name');
  }

  for (const action of scene.allowedActions) {
    if (!scene.actionSchemas[action.name]) {
      errors.push(`actionSchemas: missing schema for ${action.name}`);
    }

    action.preconditions.forEach((predicate, index) =>
      validatePredicate(scene, predicate, `action.${action.name}.preconditions[${index}]`, errors)
    );

    for (const [index, effect] of action.effects.entries()) {
      const definition = scene.factSchema[effect.set];
      if (!definition) {
        errors.push(`action.${action.name}.effects[${index}]: writes undeclared fact ${effect.set}`);
        continue;
      }
      if (!acceptsValue(definition, effect.value)) {
        errors.push(
          `action.${action.name}.effects[${index}]: value is outside ${effect.set}'s domain`
        );
      }
    }
  }

  scene.completion.forEach((entry, index) =>
    validatePredicate(scene, entry.predicate, `completion[${index}]`, errors)
  );
  scene.checkpoints.forEach((checkpoint, index) =>
    validatePredicate(scene, checkpoint.after, `checkpoints[${index}]`, errors)
  );

  if (scene.complication) {
    validatePredicate(scene, scene.complication.trigger, 'complication.trigger', errors);
  }

  const pressureBranchIds = scene.pressureBranches.map(item => item.id);
  if (new Set(pressureBranchIds).size !== pressureBranchIds.length) {
    errors.push('pressureBranches: duplicate pressure branch id');
  }
  for (const [index, branch] of scene.pressureBranches.entries()) {
    const path = `pressureBranches[${index}]`;
    if (!branch.actorInstruction.trim()) {
      errors.push(`${path}: actorInstruction must not be empty`);
    }
    validatePredicate(scene, branch.trigger, `${path}.trigger`, errors);
  }

  const challengeIds = scene.communicationChallenges.map(item => item.id);
  if (new Set(challengeIds).size !== challengeIds.length) {
    errors.push('communicationChallenges: duplicate challenge id');
  }

  const challengesById = new Map(
    scene.communicationChallenges.map(item => [item.id, item])
  );
  const opportunitiesById = new Map(
    scene.opportunityDefinitions.map(item => [item.id, item])
  );

  for (const [index, challenge] of scene.communicationChallenges.entries()) {
    const path = `communicationChallenges[${index}]`;
    if (!challenge.actorInstruction.trim()) {
      errors.push(`${path}: actorInstruction must not be empty`);
    }
    if (!scene.skillIds.includes(challenge.targetSkillId)) {
      errors.push(`${path}: skill ${challenge.targetSkillId} is not declared by scene.skillIds`);
    }
    if (!isKnownCommunicativeSkill(challenge.targetSkillId)) {
      errors.push(`${path}: skill ${challenge.targetSkillId} is not in the canonical skill catalog`);
    } else if (!isDirectlyEvidencedSkill(challenge.targetSkillId)) {
      errors.push(`${path}: skill ${challenge.targetSkillId} is derived and cannot own a challenge`);
    }

    const opportunity = opportunitiesById.get(challenge.opportunityId);
    if (!opportunity) {
      errors.push(`${path}: opportunity ${challenge.opportunityId} does not exist`);
    } else {
      if (opportunity.communicationChallengeId !== challenge.id) {
        errors.push(`${path}: opportunity ${challenge.opportunityId} does not link back to ${challenge.id}`);
      }
      if (opportunity.skillId !== challenge.targetSkillId) {
        errors.push(`${path}: opportunity skill ${opportunity.skillId} does not match target ${challenge.targetSkillId}`);
      }
    }
    validatePredicate(scene, challenge.trigger, `${path}.trigger`, errors);
  }

  const opportunityIds = scene.opportunityDefinitions.map(item => item.id);
  if (new Set(opportunityIds).size !== opportunityIds.length) {
    errors.push('opportunityDefinitions: duplicate opportunity id');
  }

  const declaredSkills = new Set(scene.skillIds);
  const availableActions = new Set(actionNames);
  for (const [index, opportunity] of scene.opportunityDefinitions.entries()) {
    const path = `opportunityDefinitions[${index}]`;
    if (!declaredSkills.has(opportunity.skillId)) {
      errors.push(`${path}: skill ${opportunity.skillId} is not declared by scene.skillIds`);
    }
    if (!isKnownCommunicativeSkill(opportunity.skillId)) {
      errors.push(`${path}: skill ${opportunity.skillId} is not in the canonical skill catalog`);
    } else if (!isDirectlyEvidencedSkill(opportunity.skillId)) {
      errors.push(`${path}: skill ${opportunity.skillId} is derived and cannot own an opportunity`);
    }
    if (opportunity.communicationChallengeId) {
      const challenge = challengesById.get(opportunity.communicationChallengeId);
      if (!challenge) {
        errors.push(`${path}: unknown communication challenge ${opportunity.communicationChallengeId}`);
      } else if (challenge.opportunityId !== opportunity.id) {
        errors.push(`${path}: challenge ${challenge.id} points to ${challenge.opportunityId}, not ${opportunity.id}`);
      }
    }
    for (const action of opportunity.relevantActionIds ?? []) {
      if (!availableActions.has(action)) {
        errors.push(`${path}: relevant action ${action} is unavailable in this scene`);
      }
    }
    validatePredicate(scene, opportunity.sceneCondition, `${path}.sceneCondition`, errors);
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidSceneDefinition(scene: SceneDefinition): void {
  if (validatedScenes.has(scene)) return;
  const result = validateSceneDefinition(scene);
  if (!result.valid) {
    throw new Error(
      `Invalid scene definition ${scene.id}:\n- ${result.errors.join('\n- ')}`
    );
  }
  validatedScenes.add(scene);
}
