/**
 * Shared scene-runtime boundary.
 *
 * Hosted server execution and client mirrors import scene contracts from this
 * module so there is one versioned reducer surface. The pure reducer remains
 * reusable by build-time verification, but only the hosted scene store executes
 * authoritative transitions in hosted mode.
 */
export {
  applyResult,
  createInitialScene,
  evaluateCompletion,
  evaluatePredicate,
  permissibleOptions,
  reduceSceneAction,
  validatePayload,
} from '../sceneReducer';

export type { ReducerInput } from '../sceneReducer';

export { SCENE_CONTRACT_VERSION } from '../../../contracts/scene';

export type {
  AllowedAction,
  Mutation,
  PayloadSchema,
  Predicate,
  SceneActionName,
  SceneActionProposal,
  SceneActionResult,
  SceneDefinition,
  SceneFactSchema,
  SceneFactValue,
  SceneForkRequest,
  SceneStateSnapshot,
} from '../../../contracts/scene';
