import { MISSION_CATALOG } from '../../src/data/missions';
import { getScene } from '../../src/content/scenes';
import type { SceneDefinition, SceneFactValue, SpeechVariety } from '../../src/contracts/scene';
import type { MissionDefinition } from '../../src/types';

export interface ResolvedActorContext {
  mission: MissionDefinition;
  scene?: SceneDefinition;
  sceneFacts: Record<string, SceneFactValue>;
  allowedActions: string[];
  /** Reviewed server-derived variety; client input cannot override this. */
  speechVariety?: SpeechVariety;
}

export type ActorContextResult =
  | { ok: true; value: ResolvedActorContext }
  | { ok: false; error: string };

function finiteFact(
  scene: SceneDefinition,
  key: string,
  value: unknown
): SceneFactValue | undefined {
  const definition = scene.factSchema[key];
  if (!definition) return undefined;

  if (definition.type === 'boolean') {
    return typeof value === 'boolean' ? value : undefined;
  }
  if (definition.type === 'enum') {
    return typeof value === 'string' && definition.values.includes(value)
      ? value
      : undefined;
  }
  return Number.isInteger(value) &&
    Number(value) >= definition.min &&
    Number(value) <= definition.max
    ? Number(value)
    : undefined;
}

/**
 * Converts an untrusted client actor request into reviewed runtime context.
 * Client-supplied character personas, goals, actions and arbitrary scene facts
 * never become model authority.
 */
export function resolveActorContext(body: Record<string, unknown>): ActorContextResult {
  const missionId = typeof body.missionId === 'string' ? body.missionId : '';
  const missionVersion = Number(body.missionVersion);
  const mission = MISSION_CATALOG.find(
    item => item.id === missionId && item.version === missionVersion
  );
  if (!mission) {
    return { ok: false, error: 'Unknown or stale mission version' };
  }

  if (!mission.sceneId) {
    return {
      ok: true,
      value: {
        mission,
        sceneFacts: {},
        allowedActions: [],
        speechVariety: undefined,
      },
    };
  }

  const scene = getScene(mission.sceneId);
  if (!scene || scene.reviewStatus !== 'released') {
    return { ok: false, error: 'Mission scene is not released' };
  }
  if (body.sceneId !== scene.id || Number(body.sceneVersion) !== scene.version) {
    return { ok: false, error: 'Unknown or stale scene version' };
  }

  const rawFacts =
    body.sceneFacts && typeof body.sceneFacts === 'object' && !Array.isArray(body.sceneFacts)
      ? (body.sceneFacts as Record<string, unknown>)
      : {};
  const sceneFacts: Record<string, SceneFactValue> = { ...scene.initialFacts };
  for (const key of Object.keys(scene.factSchema)) {
    const value = finiteFact(scene, key, rawFacts[key]);
    if (value !== undefined) sceneFacts[key] = value;
  }

  return {
    ok: true,
    value: {
      mission,
      scene,
      sceneFacts,
      allowedActions: scene.allowedActions.map(action => action.name),
      speechVariety: scene.speechVariety,
    },
  };
}
