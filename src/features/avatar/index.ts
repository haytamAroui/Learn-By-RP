export { AvatarStage } from './AvatarStage';
export type { AvatarStageProps, AvatarStageCamera } from './avatarStage.types';
export { PORTRAIT_CAMERA } from './avatarStage.types';
export {
  isAvatarReady,
  setAvatarReady,
  subscribeAvatarReadiness,
  waitForAvatarReady,
} from './avatarReadiness';
export { useAvatarPlaybackHandle } from './useAvatarPlayback';
export type { AvatarPlaybackHandle } from './useAvatarPlayback';
export {
  AvatarPlaybackProvider,
  useAvatarPlaybackContext,
} from './avatarPlaybackContext';
export {
  isAvatarStageAvailable,
  resolveAvatarStageAvailability,
  type AvatarStageAvailability,
  type AvatarStageCapabilityInput,
} from './avatarCapabilities';
export {
  blendMouthPose,
  mouthPoseForViseme,
  REST_POSE,
  VISEME_MORPH_TARGETS,
  type MouthPose,
} from './visemeTargets';
