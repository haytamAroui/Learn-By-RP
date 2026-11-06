/**
 * Whether a 3D character stage may be shown.
 *
 * The decision is kept as a pure function so it can be tested without a GL
 * context, and so the same rules apply on device and on the web build.
 */
export type AvatarStageAvailability =
  | 'available'
  | 'disabled'
  | 'no_webgl'
  | 'reduced_motion';

export interface AvatarStageCapabilityInput {
  /** 'web' | 'ios' | 'android' | anything else. */
  platform: string;
  /** A GL context could be created. */
  hasGl: boolean;
  /** The stage is switched on for this build. */
  enabled: boolean;
  /** The learner asked for less motion. */
  reducedMotion?: boolean;
}

export function resolveAvatarStageAvailability(
  input: AvatarStageCapabilityInput
): AvatarStageAvailability {
  if (!input.enabled) return 'disabled';
  if (!input.hasGl) return 'no_webgl';
  if (input.reducedMotion) return 'reduced_motion';
  return 'available';
}

export function isAvatarStageAvailable(input: AvatarStageCapabilityInput): boolean {
  return resolveAvatarStageAvailability(input) === 'available';
}
