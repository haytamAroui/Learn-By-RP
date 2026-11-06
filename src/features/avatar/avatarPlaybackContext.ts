import { createContext, useContext } from 'react';
import type { AvatarPlaybackHandle } from './useAvatarPlayback';

const AvatarPlaybackContext = createContext<AvatarPlaybackHandle | null>(null);

export const AvatarPlaybackProvider = AvatarPlaybackContext.Provider;

/**
 * The playback handle of the surrounding stage.
 *
 * A character model reads the clock from here, so an asset with morph targets
 * and the procedural placeholder behave the same way.
 */
export function useAvatarPlaybackContext(): AvatarPlaybackHandle {
  const handle = useContext(AvatarPlaybackContext);
  if (!handle) {
    throw new Error('useAvatarPlaybackContext must be used inside an avatar stage');
  }
  return handle;
}
