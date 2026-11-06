import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getPlaybackClockState,
  markPlaybackEnded,
  markPlaybackStarted,
  publishPlaybackProgress,
  resetPlaybackClock,
  subscribePlaybackClock,
} from './playbackClock';

describe('shared playback clock', () => {
  afterEach(() => {
    resetPlaybackClock();
  });

  it('starts idle', () => {
    const state = getPlaybackClockState();
    expect(state.speaking).toBe(false);
    expect(state.viseme).toBe('sil');
  });

  it('reports speaking when playback starts', () => {
    markPlaybackStarted();
    expect(getPlaybackClockState().speaking).toBe(true);
  });

  it('publishes the position and the mouth shape', () => {
    publishPlaybackProgress({ currentTimeMs: 420, durationMs: 2000, viseme: 'aa' });
    const state = getPlaybackClockState();
    expect(state.currentTimeMs).toBe(420);
    expect(state.durationMs).toBe(2000);
    expect(state.viseme).toBe('aa');
    expect(state.speaking).toBe(true);
  });

  it('never publishes a negative position', () => {
    publishPlaybackProgress({ currentTimeMs: -10, durationMs: -5, viseme: 'PP' });
    const state = getPlaybackClockState();
    expect(state.currentTimeMs).toBe(0);
    expect(state.durationMs).toBe(0);
  });

  it('returns to rest when playback ends', () => {
    markPlaybackStarted();
    publishPlaybackProgress({ currentTimeMs: 100, durationMs: 900, viseme: 'E' });
    markPlaybackEnded();
    const state = getPlaybackClockState();
    expect(state.speaking).toBe(false);
    expect(state.viseme).toBe('sil');
  });

  it('notifies subscribers and stops after unsubscribing', () => {
    const listener = vi.fn();
    const unsubscribe = subscribePlaybackClock(listener);

    markPlaybackStarted();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ speaking: true })
    );

    unsubscribe();
    markPlaybackEnded();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('survives a failing subscriber', () => {
    const failing = vi.fn(() => {
      throw new Error('renderer failed');
    });
    const healthy = vi.fn();
    subscribePlaybackClock(failing);
    subscribePlaybackClock(healthy);

    expect(() => markPlaybackStarted()).not.toThrow();
    expect(healthy).toHaveBeenCalled();
  });
});
