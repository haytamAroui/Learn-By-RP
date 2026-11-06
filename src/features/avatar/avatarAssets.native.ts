/**
 * The avatar assets, by catalog key.
 *
 * The renderer is the only place that needs the binaries, so the map lives
 * here and stays out of the shared code.
 */
export const AVATAR_ASSETS: Record<string, number> = {
  tutor: require('../../assets/avatars/tutor.glb'),
  'tutor-alt': require('../../assets/avatars/tutor-alt.glb'),
};

export function avatarAssetFor(assetKey: string): number | undefined {
  return AVATAR_ASSETS[assetKey];
}
