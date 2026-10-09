/**
 * Release review records (Phase 1I).
 *
 * The important test here is the one that counts files: the asset inventory is a
 * claim about the repository, and a claim that cannot be checked is how a review
 * list starts reading as coverage it does not have.
 */

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  BUNDLED_ASSET_INVENTORY,
  SCENE_RELEASE_REVIEW_RECORDS,
  SCENE_VISUAL_ASSETS,
  isSceneReleaseReviewed,
  recordedReviews,
  sceneReviewGaps,
} from './releaseReview';
import { SCENES } from './scenes';
import type { SceneDefinition } from '../contracts/scene';

const SCENE_LIST = Object.values(SCENES) as SceneDefinition[];

function walk(dir: string, visit: (file: string) => void): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, visit);
      continue;
    }
    visit(full);
  }
}

describe('bundled asset inventory', () => {
  const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.aac'];
  const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

  it('matches what actually ships in src/', () => {
    let audioFiles = 0;
    let imageFiles = 0;

    walk(join(process.cwd(), 'src'), file => {
      const lower = file.toLowerCase();
      if (AUDIO_EXTENSIONS.some(extension => lower.endsWith(extension))) audioFiles += 1;
      if (IMAGE_EXTENSIONS.some(extension => lower.endsWith(extension))) imageFiles += 1;
    });

    expect(BUNDLED_ASSET_INVENTORY.audioFiles).toBe(audioFiles);
    expect(BUNDLED_ASSET_INVENTORY.imageFiles).toBe(imageFiles);
  });

  it('tracks the bundled image renderer and the scene that owns its assets', () => {
    // An image component usage without an image file would make the inventory
    // above understate what the app tries to load.
    const componentUsers: string[] = [];
    walk(join(process.cwd(), 'src'), file => {
      if (!/\.(ts|tsx)$/.test(file)) return;
      const source = readFileSync(file, 'utf8');
      if (/<Image(Background)?[\s/>]/.test(source) && !source.includes('ScrollView')) {
        componentUsers.push(relative(process.cwd(), file));
      }
    });

    expect(componentUsers).toEqual([]);
    expect(Object.keys(SCENE_VISUAL_ASSETS)).toContain('scene.nl-be.cafe.breakfast');
    for (const file of SCENE_VISUAL_ASSETS['scene.nl-be.cafe.breakfast']) {
      expect(statSync(join(process.cwd(), file)).size).toBeGreaterThan(0);
    }
  });
});

describe('scene release review', () => {
  it('records no review while no qualified reviewer has accepted the content', () => {
    expect(recordedReviews()).toEqual([]);
    expect(SCENE_LIST.length).toBeGreaterThan(0);
  });

  it('reports every released scene as unreviewed rather than silently approved', () => {
    const reviewed = SCENE_LIST.filter(isSceneReleaseReviewed).map(scene => scene.id);
    expect(reviewed).toEqual([]);
  });

  it('names the missing record and the absent assets for each scene', () => {
    for (const scene of SCENE_LIST) {
      const gaps = sceneReviewGaps(scene);
      expect(gaps, scene.id).toContain(`${scene.id}: no release review record`);
      expect(gaps, scene.id).toContain(
        `${scene.id}: no bundled audio, so every voice is synthesized at runtime and there is nothing to audition`
      );
    }
  });

  it('rejects a record that claims a review nobody performed', () => {
    // A record whose reviewer has no dimension, or a dimension with no reviewer,
    // would turn this file back into decoration.
    for (const [sceneId, record] of Object.entries(SCENE_RELEASE_REVIEW_RECORDS)) {
      expect(record.sceneId, sceneId).toBe(sceneId);
      for (const entry of record.reviewers) {
        expect(entry.reviewerId.trim(), `${sceneId}/${entry.dimension}`).not.toBe('');
        expect(Number.isFinite(Date.parse(entry.reviewedAt)), `${sceneId}/${entry.dimension}`).toBe(true);
      }
    }
  });
});
