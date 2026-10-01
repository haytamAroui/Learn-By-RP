/**
 * Archive entry point for type-checking and any bundler that does not resolve
 * platform extensions.
 *
 * Metro picks `.native.ts` on iOS/Android and `.web.ts` on web, so this file is
 * never what ships. It exists so the module resolves for `tsc` and for the Node
 * test run, which has no platform.
 *
 * Note the filenames deliberately differ in more than case: `archiveRepository`
 * and `SqliteArchiveRepository` must never collide, because a case-insensitive
 * filesystem would silently make them one file and destroy whichever was written
 * second.
 */
export * from './archiveRepository.native';