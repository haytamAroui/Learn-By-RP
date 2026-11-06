import React, { useEffect } from 'react';
import { AvatarStageBoundary } from './AvatarStageBoundary';
import { setAvatarReady } from './avatarReadiness';
import type { AvatarStageProps } from './avatarStage.types';

/**
 * The web build of the character stage.
 *
 * The web renderer keeps the designed artwork. A GL renderer is a native
 * concern here, and keeping three.js out of the web bundle keeps the web
 * build as small as it was before the stage existed.
 */
export function AvatarStage({ fallback = null }: AvatarStageProps) {
  // The artwork is on screen immediately, so the session may speak.
  useEffect(() => {
    setAvatarReady(true);
  }, []);

  return <AvatarStageBoundary fallback={fallback}>{fallback}</AvatarStageBoundary>;
}
