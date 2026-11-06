import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isAvatarReady,
  resetAvatarReadiness,
  setAvatarReady,
  subscribeAvatarReadiness,
  waitForAvatarReady,
} from './avatarReadiness';

describe('avatar readiness', () => {
  afterEach(() => {
    resetAvatarReadiness();
  });

  it('starts not ready', () => {
    expect(isAvatarReady()).toBe(false);
  });

  it('becomes ready when the stage reports in', () => {
    setAvatarReady(true);
    expect(isAvatarReady()).toBe(true);
  });

  it('notifies subscribers on a change only', () => {
    const listener = vi.fn();
    subscribeAvatarReadiness(listener);

    setAvatarReady(true);
    setAvatarReady(true);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(true);
  });

  it('resolves immediately when the avatar is already on screen', async () => {
    setAvatarReady(true);
    await expect(waitForAvatarReady(1000)).resolves.toBe(true);
  });

  it('resolves when the avatar arrives', async () => {
    const waiting = waitForAvatarReady(1000);
    setAvatarReady(true);
    await expect(waiting).resolves.toBe(true);
  });

  it('gives up after the timeout so the session continues', async () => {
    await expect(waitForAvatarReady(30)).resolves.toBe(false);
  });

  it('survives a failing subscriber', () => {
    const failing = vi.fn(() => {
      throw new Error('renderer failed');
    });
    const healthy = vi.fn();
    subscribeAvatarReadiness(failing);
    subscribeAvatarReadiness(healthy);

    expect(() => setAvatarReady(true)).not.toThrow();
    expect(healthy).toHaveBeenCalled();
  });
});
