import type React from 'react';
import type { ViewStyle } from 'react-native';

export interface AvatarStageCamera {
  position: [number, number, number];
  fov: number;
}

/** A portrait crop: the head fills the frame. */
export const PORTRAIT_CAMERA: AvatarStageCamera = {
  position: [0, 0.72, 2.6],
  fov: 30,
};

export interface AvatarStageProps {
  /** Rendered when a 3D stage is not possible on this device or build. */
  fallback?: React.ReactNode;
  /** The character model. Defaults to the procedural placeholder. */
  children?: React.ReactNode;
  /** Switch the stage off entirely. */
  enabled?: boolean;
  /** The learner asked for less motion. */
  reducedMotion?: boolean;
  /** Camera framing. Defaults to a portrait crop. */
  camera?: AvatarStageCamera;
  /** The face to show, from the avatar catalog. */
  avatarId?: string;
  width: number;
  height: number;
  style?: ViewStyle;
}
