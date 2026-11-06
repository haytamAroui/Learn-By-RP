/**
 * Avatar asset loader entry point for type-checking and any bundler that does
 * not resolve platform extensions.
 *
 * Metro picks `.native.ts` on iOS/Android and `.web.ts` on web, so this file
 * is never what ships.
 */
export * from './avatarAssetLoader.native';
