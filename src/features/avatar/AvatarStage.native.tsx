import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { AvatarModelGLTF } from './AvatarModelGLTF';
import { ProceduralAvatar } from './ProceduralAvatar';
import { AvatarPlaybackProvider } from './avatarPlaybackContext';
import { AvatarStageBoundary } from './AvatarStageBoundary';
import { setAvatarReady } from './avatarReadiness';
import { avatarAssetFor } from './avatarAssets.native';
import { avatarById, DEFAULT_AVATAR_ID } from './avatarCatalog';
import type { AvatarStageProps } from './avatarStage.types';
import { PORTRAIT_CAMERA } from './avatarStage.types';
import { useAvatarPlaybackHandle } from './useAvatarPlayback';
import { resolveAvatarStageAvailability } from './avatarCapabilities';

export type { AvatarStageProps };


/**
 * A single 3D character surface.
 *
 * The stage owns no learning state. It follows the shared playback clock, so
 * the mouth moves with the voice and nothing else. When a GL context cannot
 * be created the caller keeps its own artwork, which is why the fallback is a
 * prop rather than a hard dependency on the renderer.
 */
export function AvatarStage({
  fallback = null,
  children,
  enabled = true,
  reducedMotion = false,
  camera = PORTRAIT_CAMERA,
  avatarId = DEFAULT_AVATAR_ID,
  width,
  height,
  style,
}: AvatarStageProps) {
  const playback = useAvatarPlaybackHandle();
  const [modelFailed, setModelFailed] = useState(false);

  // The model is chosen by the catalog, and a character that changes face
  // between turns is worse than a character that never changes.
  const asset = useMemo(() => {
    const option = avatarById(avatarId) ?? avatarById(DEFAULT_AVATAR_ID);
    return option ? avatarAssetFor(option.asset) : undefined;
  }, [avatarId]);

  // A new session starts with an avatar that is not on screen yet.
  useEffect(() => {
    setAvatarReady(false);
    return () => setAvatarReady(false);
  }, []);

  const availability = resolveAvatarStageAvailability({
    platform: Platform.OS,
    // A GL context is created by the canvas itself; a device that cannot
    // create one is handled by the boundary below.
    hasGl: true,
    enabled,
    reducedMotion,
  });

  if (availability !== 'available') {
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
          >
            <ambientLight intensity={0.75} />
            <directionalLight position={[2, 3, 3]} intensity={1.1} />
            {children ?? (
              modelFailed || !asset ? (
                <ProceduralAvatar />
              ) : (
                <AvatarModelGLTF source={asset} onError={() => setModelFailed(true)} />
              )
            )}
          </Canvas>
        </View>
      </AvatarPlaybackProvider>
    </AvatarStageBoundary>
  );
}
