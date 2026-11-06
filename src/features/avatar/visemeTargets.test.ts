import { describe, expect, it } from 'vitest';
import {
  ARKIT_WEIGHTS,
  REST_POSE,
  VISEME_MORPH_TARGETS,
  blendMouthPose,
  mouthPoseForViseme,
} from './visemeTargets';
import {
  isAvatarStageAvailable,
  resolveAvatarStageAvailability,
} from './avatarCapabilities';

describe('mouth poses', () => {
  it('rests with nothing open', () => {
    expect(mouthPoseForViseme('sil')).toEqual(REST_POSE);
  });

  it('opens the jaw for an open vowel', () => {
    const pose = mouthPoseForViseme('aa');
    expect(pose.jawOpen).toBeGreaterThan(0.5);
  });

  it('closes the lips for a bilabial sound', () => {
    const pose = mouthPoseForViseme('PP');
    expect(pose.mouthClose).toBeGreaterThan(0.5);
    expect(pose.jawOpen).toBeLessThan(0.2);
  });

  it('rounds the lips for a rounded vowel', () => {
    const pose = mouthPoseForViseme('U');
    expect(pose.mouthRound).toBeGreaterThan(0.5);
  });

  it('widens the mouth for a spread vowel', () => {
    const pose = mouthPoseForViseme('E');
    expect(pose.mouthWide).toBeGreaterThan(0.5);
  });

  it('shows teeth for a fricative', () => {
    expect(mouthPoseForViseme('FF').teeth).toBeGreaterThan(0.5);
  });

  it('moves towards the target without overshooting', () => {
    const half = blendMouthPose(REST_POSE, mouthPoseForViseme('aa'), 0.5);
    expect(half.jawOpen).toBeCloseTo(mouthPoseForViseme('aa').jawOpen / 2, 5);
    expect(half.jawOpen).toBeLessThan(mouthPoseForViseme('aa').jawOpen);
  });

  it('reaches the target at a full step', () => {
    const target = mouthPoseForViseme('E');
    expect(blendMouthPose(REST_POSE, target, 1)).toEqual(target);
  });

  it('ignores a step outside the allowed range', () => {
    const target = mouthPoseForViseme('aa');
    expect(blendMouthPose(REST_POSE, target, 5)).toEqual(target);
    expect(blendMouthPose(REST_POSE, target, -1)).toEqual(REST_POSE);
  });

  it('names a morph target for every viseme', () => {
    for (const shape of Object.keys(VISEME_MORPH_TARGETS) as Array<keyof typeof VISEME_MORPH_TARGETS>) {
      expect(VISEME_MORPH_TARGETS[shape].length).toBeGreaterThan(0);
      expect(VISEME_MORPH_TARGETS[shape][0]).toBe(`viseme_${shape}`);
    }
  });

  it('exposes ARKit weights for every viseme', () => {
    for (const shape of Object.keys(ARKIT_WEIGHTS) as Array<keyof typeof ARKIT_WEIGHTS>) {
      expect(Object.keys(ARKIT_WEIGHTS[shape]).length).toBeGreaterThan(0);
    }
  });
});

describe('avatar stage availability', () => {
  const base = { platform: 'ios', hasGl: true, enabled: true };

  it('is available when the platform can render it', () => {
    expect(resolveAvatarStageAvailability(base)).toBe('available');
    expect(isAvatarStageAvailable(base)).toBe(true);
  });

  it('is off when the stage is disabled', () => {
    expect(resolveAvatarStageAvailability({ ...base, enabled: false })).toBe('disabled');
  });

  it('is off without a GL context', () => {
    expect(resolveAvatarStageAvailability({ ...base, hasGl: false })).toBe('no_webgl');
  });

  it('is off when the learner asked for less motion', () => {
    expect(resolveAvatarStageAvailability({ ...base, reducedMotion: true })).toBe(
      'reduced_motion'
    );
  });

  it('reports the disabled reason before the renderer reason', () => {
    expect(
      resolveAvatarStageAvailability({ ...base, enabled: false, hasGl: false })
    ).toBe('disabled');
  });
});
