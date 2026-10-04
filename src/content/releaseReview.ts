/**
 * Release review records (Phase 1I).
 *
 * The gate asked for a locale/audio/assets review and there was nowhere to record
 * one, so the review could not even be started. This is that somewhere: a record
 * per scene, whose absence is reported as a specific gap rather than as silence.
 *
 * Two rules keep it honest:
 *
 * 1. A scene's `released` flag is not a review. It says the content shipped in
 *    the build; it says nothing about whether a qualified person checked it.
 * 2. The bundled-asset inventory is a claim about the repository, so a test
 *    verifies it against the filesystem. A hand-kept count that drifts is worse
 *    than none, because it reads as coverage.
 *
 * `SCENE_RELEASE_REVIEW_RECORDS` is empty. That is the accurate state, not an
 * oversight: no qualified reviewer has accepted any of this content yet.
 */

import type { LanguageCode } from '../types';
import type { SceneDefinition } from '../contracts/scene';

/** What a reviewer was actually looking at. */
export type ReviewDimension = 'locale_copy' | 'voice' | 'visuals';

export interface ReviewerAttribution {
  dimension: ReviewDimension;
  reviewerId: string;
  reviewedAt: string;
  notes?: string;
}

export interface BundledAssetInventory {
  /**
   * Recorded speech files shipped with the app. Zero means every utterance is
   * synthesized at runtime, so there is no reference recording to judge
   * pronunciation, pacing or register against.
   */
  audioFiles: number;
  /** Illustration files shipped with the app. Zero means the product has none. */
  imageFiles: number;
}

export interface SceneReleaseReviewRecord {
  sceneId: string;
  /** Locale the scene's authored content is written in. */
  contentLocale: LanguageCode;
  reviewers: ReviewerAttribution[];
  scopeNotes?: string;
}

/**
 * What actually ships alongside the code.
 *
 * Verified against the filesystem by `releaseReview.test.ts`, so this cannot
 * quietly keep claiming coverage that production no longer has.
 */
export const BUNDLED_ASSET_INVENTORY: BundledAssetInventory = {
  audioFiles: 0,
  imageFiles: 0,
};

/**
 * Recorded reviews, keyed by scene id.
 *
 * Empty by design. Adding an entry asserts that a named person reviewed that
 * dimension on that date, which is a claim no script can make.
 */
export const SCENE_RELEASE_REVIEW_RECORDS: Readonly<Record<string, SceneReleaseReviewRecord>> = {};

/**
 * What is still unrecorded for a scene.
 *
 * Reported rather than inferred, so "no record" and "reviewed and found wanting"
 * stay distinguishable in the release output. The asset findings are reported
 * even when no record exists at all, because they are repository facts rather
 * than review results, and they are what blocks a pilot today.
 */
export function sceneReviewGaps(scene: SceneDefinition): string[] {
  const record = SCENE_RELEASE_REVIEW_RECORDS[scene.id];
  const gaps: string[] = [];

  if (!record) {
    gaps.push(`${scene.id}: no release review record`);
  } else {
    const reviewed = new Set(record.reviewers.map(entry => entry.dimension));
    for (const dimension of ['locale_copy', 'voice', 'visuals'] as const) {
      if (!reviewed.has(dimension)) {
        gaps.push(`${scene.id}: ${dimension.replace('_', ' ')} not reviewed`);
      }
    }
  }

  if (BUNDLED_ASSET_INVENTORY.audioFiles === 0) {
    gaps.push(
      `${scene.id}: no bundled audio, so every voice is synthesized at runtime and there is nothing to audition`
    );
  }
  if (BUNDLED_ASSET_INVENTORY.imageFiles === 0) {
    gaps.push(
      `${scene.id}: no bundled imagery, so the scene has no illustrated orientation`
    );
  }

  return gaps;
}

/** Scenes whose release review is complete enough to state. */
export function isSceneReleaseReviewed(scene: SceneDefinition): boolean {
  return sceneReviewGaps(scene).length === 0;
}

/** Every recorded review, flattened, for reporting. */
export function recordedReviews(): ReviewerAttribution[] {
  return Object.values(SCENE_RELEASE_REVIEW_RECORDS).flatMap(record => record.reviewers);
}