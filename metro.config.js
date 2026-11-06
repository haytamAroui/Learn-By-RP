const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// 3D avatars ship as glTF binaries. Metro has no default handler for them, so
// they are registered as assets and loaded through expo-asset.
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'glb'];

module.exports = withNativeWind(config, { input: './global.css' });
