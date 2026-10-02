import { PayloadSchema, Predicate, SceneActionName, SceneDefinition, SceneStateSnapshot } from '../../contracts/scene';
import {
  applyResult,
  createInitialScene,
  evaluatePredicate,
  reduceSceneAction,
} from './sceneReducer';

export interface ModelCheckPathStep {
  action: SceneActionName;
  revision: number;
}

export interface SceneModelCheckReport {
  sceneId: string;
  reachableStateCount: number;
  errors: string[];
  warnings: string[];
  achievedPath: ModelCheckPathStep[] | null;
  reachableActions: SceneActionName[];
  reachableOpportunityIds: string[];
  reachableCommunicationChallengeIds: string[];
}

interface QueueEntry {
  key: string;
  state: SceneStateSnapshot;
  path: ModelCheckPathStep[];
}

const MAX_REACHABLE_STATES = 4096;
const MAX_PATH_LENGTH = 32;

function visitPredicates(predicate: Predicate, visit: (predicate: Predicate) => void): void {
  visit(predicate);
  if (predicate.op === 'and' || predicate.op === 'or') {
    predicate.predicates.forEach(child => visitPredicates(child, visit));
  } else if (predicate.op === 'not') {
    visitPredicates(predicate.predicate, visit);
  }
}

function countCaps(scene: SceneDefinition): Partial<Record<SceneActionName, number>> {
  const caps: Partial<Record<SceneActionName, number>> = {};
  const predicates: Predicate[] = [
    ...scene.allowedActions.flatMap(action => action.preconditions),
    ...scene.completion.map(entry => entry.predicate),
    ...scene.checkpoints.map(entry => entry.after),
    ...scene.opportunityDefinitions.map(entry => entry.sceneCondition),
    ...scene.communicationChallenges.map(entry => entry.trigger),
    ...(scene.complication ? [scene.complication.trigger] : []),
  ];

  for (const root of predicates) {
    visitPredicates(root, predicate => {
      if (predicate.op !== 'countOf') return;
      caps[predicate.action] = Math.max(
        caps[predicate.action] ?? 0,
        predicate.value + 1
      );
    });
  }
  return caps;
}

function stateKey(
  state: SceneStateSnapshot,
  caps: Partial<Record<SceneActionName, number>>
): string {
  const facts = Object.fromEntries(
    Object.entries(state.facts).sort(([a], [b]) => a.localeCompare(b))
  );
  const counts = Object.fromEntries(
    Object.entries(caps)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([action, cap]) => [
        action,
        Math.min(state.actionCounts[action as SceneActionName] ?? 0, cap ?? 0),
      ])
  );
  return JSON.stringify({ facts, counts });
}

function sampleValue(rule: PayloadSchema['properties'][string]): unknown {
  if (rule.enum?.length) return rule.enum[0];
  switch (rule.type) {
    case 'string':
      return 'sample';
    case 'number':
      return 0;
    case 'boolean':
      return true;
    case 'object':
      return {};
    case 'array':
      return [];
  }
}

function samplePayload(schema: PayloadSchema | undefined): Record<string, unknown> {
  if (!schema) return {};
  const payload: Record<string, unknown> = {};
  for (const field of schema.required) {
    const rule = schema.properties[field];
    if (rule) payload[field] = sampleValue(rule);
  }
  return payload;
}

export function modelCheckScene(scene: SceneDefinition): SceneModelCheckReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const reachableActions = new Set<SceneActionName>();
  const reachableOpportunities = new Set<string>();
  const reachableCommunicationChallenges = new Set<string>();
  const caps = countCaps(scene);

  const initial = createInitialScene(scene, 'model-check', 'attempt-1');
  const initialKey = stateKey(initial, caps);
  const queue: QueueEntry[] = [{ key: initialKey, state: initial, path: [] }];
  const visited = new Set<string>([initialKey]);
  const statesByKey = new Map<string, SceneStateSnapshot>([[initialKey, initial]]);
  const pathByKey = new Map<string, ModelCheckPathStep[]>([[initialKey, []]]);
  const edges = new Map<string, Set<string>>();
  let achievedPath: ModelCheckPathStep[] | null = null;
  let reachableNonAchievedDeadlock = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const { key: currentKey, state, path } = current;

    for (const opportunity of scene.opportunityDefinitions) {
      if (
        evaluatePredicate(
          opportunity.sceneCondition,
          state.facts,
          state.actionCounts
        )
      ) {
        reachableOpportunities.add(opportunity.id);
      }
    }

    for (const challenge of scene.communicationChallenges) {
      if (
        evaluatePredicate(
          challenge.trigger,
          state.facts,
          state.actionCounts
        )
      ) {
        reachableCommunicationChallenges.add(challenge.id);
      }
    }

    if (state.outcome === 'achieved' && achievedPath === null) {
      achievedPath = path;
    }

    if (path.length >= MAX_PATH_LENGTH) continue;

    let acceptedFromState = 0;
    for (const action of scene.allowedActions) {
      const result = reduceSceneAction({
        scene,
        state,
        proposal: {
          actionId: `model-${visited.size}-${action.name}`,
          sessionId: state.sessionId,
          attemptId: state.attemptId,
          expectedSceneRevision: state.revision,
          action: action.name,
          payload: samplePayload(scene.actionSchemas[action.name]),
          sourceTurnIds: ['model-check'],
        },
      });

      if (!result.accepted) continue;
      acceptedFromState += 1;
      reachableActions.add(action.name);

      const next = applyResult(scene, state, result);
      const nextPath = [
        ...path,
        { action: action.name, revision: next.revision },
      ];
      const key = stateKey(next, caps);
      const outgoing = edges.get(currentKey) ?? new Set<string>();
      outgoing.add(key);
      edges.set(currentKey, outgoing);

      if (visited.has(key)) {
        if (
          JSON.stringify(next.facts) === JSON.stringify(state.facts) &&
          Object.keys(caps).length === 0
        ) {
          warnings.push(
            `cycle: ${action.name} can repeat without changing logical facts`
          );
        }
        continue;
      }

      visited.add(key);
      statesByKey.set(key, next);
      pathByKey.set(key, nextPath);
      if (visited.size > MAX_REACHABLE_STATES) {
        errors.push(
          `state-space exceeds ${MAX_REACHABLE_STATES} reachable logical states`
        );
        queue.length = 0;
        break;
      }
      queue.push({ key, state: next, path: nextPath });
    }

    if (state.outcome !== 'achieved' && acceptedFromState === 0) {
      reachableNonAchievedDeadlock = true;
    }
  }

  if (!achievedPath) errors.push('completion: achieved state is unreachable');

  // A scene may have one happy path while an authored complication becomes
  // available only inside a branch from which achievement is impossible.
  // Global reachability is therefore not enough: every reachable state in which
  // the complication may fire must itself retain a path to an achieved state.
  const reverseEdges = new Map<string, Set<string>>();
  for (const [from, targets] of edges) {
    for (const target of targets) {
      const incoming = reverseEdges.get(target) ?? new Set<string>();
      incoming.add(from);
      reverseEdges.set(target, incoming);
    }
  }

  const canReachAchieved = new Set<string>();
  const reverseQueue: string[] = [];
  for (const [key, state] of statesByKey) {
    if (state.outcome === 'achieved') {
      canReachAchieved.add(key);
      reverseQueue.push(key);
    }
  }

  while (reverseQueue.length > 0) {
    const key = reverseQueue.shift()!;
    for (const predecessor of reverseEdges.get(key) ?? []) {
      if (canReachAchieved.has(predecessor)) continue;
      canReachAchieved.add(predecessor);
      reverseQueue.push(predecessor);
    }
  }

  if (scene.complication) {
    for (const [key, state] of statesByKey) {
      if (
        !evaluatePredicate(
          scene.complication.trigger,
          state.facts,
          state.actionCounts
        ) ||
        canReachAchieved.has(key)
      ) {
        continue;
      }

      const path = pathByKey.get(key) ?? [];
      const renderedPath =
        path.length === 0
          ? 'scene start'
          : path.map(step => step.action).join(' -> ');
      errors.push(
        `unsafe complication: ${scene.complication.id} can trigger after ${renderedPath}, but no achieved state is reachable from that branch`
      );
      break;
    }
  }

  if (reachableNonAchievedDeadlock) {
    errors.push('deadlock: reachable non-achieved state has no accepted action');
  }

  for (const action of scene.allowedActions) {
    if (!reachableActions.has(action.name)) {
      errors.push(`dead action: ${action.name} is never reachable`);
    }
  }

  for (const opportunity of scene.opportunityDefinitions) {
    if (!reachableOpportunities.has(opportunity.id)) {
      errors.push(`unreachable opportunity: ${opportunity.id}`);
    }
  }

  for (const challenge of scene.communicationChallenges) {
    if (!reachableCommunicationChallenges.has(challenge.id)) {
      errors.push(`unreachable communication challenge: ${challenge.id}`);
    }
  }

  return {
    sceneId: scene.id,
    reachableStateCount: visited.size,
    errors,
    warnings: [...new Set(warnings)],
    achievedPath,
    reachableActions: [...reachableActions],
    reachableOpportunityIds: [...reachableOpportunities],
    reachableCommunicationChallengeIds: [...reachableCommunicationChallenges],
  };
}
