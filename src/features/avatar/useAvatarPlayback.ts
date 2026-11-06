import { useEffect, useRef } from 'react';
import {
  getPlaybackClockState,
  subscribePlaybackClock,
} from '../../providers/voice/playbackClock';
import type { VisemeShape } from '../../providers/voice/visemes';

/**
 * Live handle on the playback clock.
 *
 * The handle exposes refs rather than React state on purpose. A renderer
 * reads the shape inside its own frame loop, so a 30 Hz mouth does not become
 * 30 React renders per second.
 */
export interface AvatarPlaybackHandle {
  shapeRef: React.MutableRefObject<VisemeShape>;
  speakingRef: React.MutableRefObject<boolean>;
  currentTimeRef: React.MutableRefObject<number>;
  durationRef: React.MutableRefObject<number>;
}

export function useAvatarPlaybackHandle(): AvatarPlaybackHandle {
  const shapeRef = useRef<VisemeShape>(getPlaybackClockState().viseme);
  const speakingRef = useRef<boolean>(getPlaybackClockState().speaking);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  useEffect(() => {
    const unsubscribe = subscribePlaybackClock(clock => {
      shapeRef.current = clock.viseme;
      speakingRef.current = clock.speaking;
      currentTimeRef.current = clock.currentTimeMs;
      durationRef.current = clock.durationMs;
    });
    return unsubscribe;
  }, []);

  return { shapeRef, speakingRef, currentTimeRef, durationRef };
}
