/**
 * Avatar stage entry point for type-checking and any bundler that does not
 * resolve platform extensions.
 *
 * Metro picks `.native.tsx` on iOS/Android and `.web.tsx` on web, so this
 * file is never what ships. It exists so the module resolves for `tsc` and
 * for the Node test run, which has no platform.
 */
export * from './AvatarStage.native';
