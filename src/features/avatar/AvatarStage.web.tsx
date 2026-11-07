import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { ProceduralAvatar } from './ProceduralAvatar';
import { AvatarPlaybackProvider } from './avatarPlaybackContext';
import { AvatarStageBoundary } from './AvatarStageBoundary';
import { setAvatarReady } from './avatarReadiness';
import type { AvatarStageProps } from './avatarStage.types';
import { PORTRAIT_CAMERA } from './avatarStage.types';
import { useAvatarPlaybackHandle } from './useAvatarPlayback';

/**
 * Web build of the 3D character stage.
 * Uses React Three Fiber Canvas with real-time lip-sync and viseme tracking.
 * Gracefully falls back to designed artwork via AvatarStageBoundary if WebGL is unavailable.
 */
export function AvatarStage({
  fallback = null,
  children,
  enabled = true,
  camera = PORTRAIT_CAMERA,
  width,
  height,
  style,
}: AvatarStageProps) {
  const playback = useAvatarPlaybackHandle();

  useEffect(() => {
    setAvatarReady(true);
    return () => setAvatarReady(false);
  }, []);

  if (!enabled) {
    return <>{fallback}</>;
  }

  return (
    <AvatarStageBoundary fallback={fallback}>
      <AvatarPlaybackProvider value={playback}>
        <View style={[{ width, height }, style]}>
          <Canvas
            camera={{ position: camera.position, fov: camera.fov }}
            style={StyleSheet.absoluteFill}
            frameloop="always"
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[2, 3, 3]} intensity={1.1} />
            {children ?? <ProceduralAvatar />}
          </Canvas>
        </View>
      </AvatarPlaybackProvider>
    </AvatarStageBoundary>
  );
}
