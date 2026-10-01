import { describe, expect, it, vi } from 'vitest';

// The hook imports react-native, whose entry re-exports Flow syntax that cannot be
// parsed outside a Metro/Vite web pipeline. The mapping functions are pure, so the
// module is imported with that import stubbed rather than by moving the pure table
// somewhere else: keeping it next to the hook is the point, because a table that
// drifts from its consumer is how an accessibility setting stops being honoured.
vi.mock('react-native', () => ({
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: () => ({ remove: () => {} }),
  },
  Platform: { OS: 'web' },
}));

const { motionTokens, shouldPauseDecorativeMotion } = await import('./index');

/**
 * The reduced-motion mapping is a contract, not a preference.
 *
 * These assertions exist because the failure is silent and looks fine in review:
 * an animation that still runs is not an error, it is just the thing the user
 * turned off. So the table is pinned explicitly.
 */

describe('motionTokens', () => {
  it('collapses every channel when reduced', () => {
    const off = motionTokens(false);
    const on = motionTokens(true);

    // Zero duration and a zero loop are what actually stop the motion.
    expect(on.duration).toBe(0);
    expect(on.loop).toBe(0);
    expect(on.allowLoop).toBe(false);

    // Press feedback becomes colour-only rather than disappearing, so the control
    // still acknowledges the touch.
    expect(on.pressScale).toBe(1);
    expect(off.pressScale).toBeLessThan(1);
  });

  it('keeps motion available when not reduced', () => {
    const off = motionTokens(false);

    expect(off.reduced).toBe(false);
    expect(off.duration).toBeGreaterThan(0);
    expect(off.loop).toBeGreaterThan(0);
    expect(off.allowLoop).toBe(true);
  });

  it('never reports reduced while motion is enabled', () => {
    expect(motionTokens(false).reduced).toBe(false);
    expect(motionTokens(true).reduced).toBe(true);
  });
});

describe('shouldPauseDecorativeMotion', () => {
  it('pauses continuous motion when the preference is set', () => {
    expect(shouldPauseDecorativeMotion(true, 'active')).toBe(true);
  });

  it('keeps it running in the foreground when the preference is not set', () => {
    expect(shouldPauseDecorativeMotion(false, 'active')).toBe(false);
  });

  it('pauses in the background regardless of the preference', () => {
    // A looping animation that keeps running off-screen is the case the plan calls
    // out: decorative motion costs battery for nobody.
    expect(shouldPauseDecorativeMotion(false, 'background')).toBe(true);
    expect(shouldPauseDecorativeMotion(false, 'inactive')).toBe(true);
  });
});