import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getAvatarReaction,
  getAvatarState,
  pushAvatarReaction,
  resetAvatarState,
  setAvatarBaseState,
  subscribeAvatarState,
} from './avatarState';
import {
  expressionForReaction,
  expressionForState,
  reactionMouthShape,
} from './avatarExpressions';
import {
  markListeningEnded,
  markListeningStarted,
  markPlaybackEnded,
  markPlaybackStarted,
  resetPlaybackClock,
} from '../../providers/voice/playbackClock';

describe('avatar state', () => {
  afterEach(() => {
    resetAvatarState();
    resetPlaybackClock();
  });

  it('starts idle', () => {
    expect(getAvatarState()).toBe('idle');
  });

  it('takes the state the session sets', () => {
    setAvatarBaseState('thinking');
    expect(getAvatarState()).toBe('thinking');
  });

  it('speaks when the tutor speaks, whatever the session is doing', () => {
    setAvatarBaseState('thinking');
    markPlaybackStarted();
    expect(getAvatarState()).toBe('speaking');
  });

  it('goes back to the session state when the voice stops', () => {
    setAvatarBaseState('thinking');
    markPlaybackStarted();
    markPlaybackEnded();
    expect(getAvatarState()).toBe('thinking');
  });

  it('listens when the learner speaks', () => {
    markListeningStarted();
    expect(getAvatarState()).toBe('listening');
    markListeningEnded();
    expect(getAvatarState()).toBe('idle');
  });

  it('shows a reaction over everything else', () => {
    setAvatarBaseState('thinking');
    pushAvatarReaction('praise');
    expect(getAvatarState()).toBe('reacting');
    expect(getAvatarReaction()).toBe('praise');
  });

  it('notifies subscribers when the state changes', () => {
    const listener = vi.fn();
    subscribeAvatarState(listener);

    setAvatarBaseState('thinking');
    setAvatarBaseState('thinking');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('thinking');
  });

  it('survives a failing subscriber', () => {
    const failing = vi.fn(() => {
      throw new Error('renderer failed');
    });
    const healthy = vi.fn();
    subscribeAvatarState(failing);
    subscribeAvatarState(healthy);

    expect(() => setAvatarBaseState('thinking')).not.toThrow();
    expect(healthy).toHaveBeenCalled();
  });
});

describe('avatar expressions', () => {
  it('gives every state an expression', () => {
    for (const state of ['idle', 'listening', 'thinking', 'speaking', 'reacting'] as const) {
      const expression = expressionForState(state);
      expect(expression).toBeTruthy();
      expect(typeof expression.eyeOpen).toBe('number');
    }
  });

  it('raises the brows while listening', () => {
    expect(expressionForState('listening').weights.browInnerUp).toBeGreaterThan(0);
  });

  it('looks aside while thinking', () => {
    expect(Math.abs(expressionForState('thinking').head.yaw)).toBeGreaterThan(0.05);
  });

  it('smiles for a reaction', () => {
    const expression = expressionForReaction('praise');
    expect(expression.weights.mouthSmileLeft).toBeGreaterThan(0.3);
  });

  it('holds a warm mouth shape for a warm reaction', () => {
    expect(reactionMouthShape('praise')).toBe('aa');
    expect(reactionMouthShape('consider')).toBe('E');
  });
});
