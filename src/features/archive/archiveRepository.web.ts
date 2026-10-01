import { IndexedDbArchiveRepository } from './IndexedDbArchiveRepository';
import { ArchiveRepository } from './ArchiveRepository.types';

/**
 * Web persistence is IndexedDB.
 *
 * `expo-sqlite` exposes web support only through WASM, which Expo still labels
 * alpha and which requires cross-origin isolation headers. Rather than ship a
 * broken or half-configured archive on the web, web gets its own implementation
 * of the same contract. The parity fixture asserts the two agree.
 */
export const archiveRepository: ArchiveRepository = new IndexedDbArchiveRepository();
