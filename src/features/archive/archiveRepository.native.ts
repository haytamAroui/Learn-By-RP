import { SqliteArchiveRepository } from './SqliteArchiveRepository';
import { ArchiveRepository } from './ArchiveRepository.types';

/**
 * The archive singleton, resolved per platform.
 *
 * Metro picks `.native.ts` on iOS/Android and `.web.ts` on web, which is what
 * keeps `expo-sqlite` out of the web bundle: the native implementation is never
 * imported there, so the dynamic import inside `database.ts` is never reached and
 * never bundled. That single import is the reason web export used to fail.
 */
export const archiveRepository: ArchiveRepository = new SqliteArchiveRepository();
