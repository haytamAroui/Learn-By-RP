import { describe, expect, it } from 'vitest';
import {
  asAuthoredOutcome,
  sceneResultCopyKey,
  sceneResultKind,
} from './sceneOutcome';

describe('sceneResultKind', () => {
  it('maps every authored scene outcome to its own kind', () => {
    expect(sceneResultKind('achieved')).toBe('achieved');
    expect(sceneResultKind('partial')).toBe('partial');
    expect(sceneResultKind('not_achieved')).toBe('not_achieved');
  });

  it('keeps a genuine unknown distinct from an unreadable one', () => {
    expect(sceneResultKind('unknown')).toBe('unknown');
  });

  /*
   * The regression this module exists for.
   *
   * `SessionRecord.taskOutcome` uses completed / partly_completed / changed_direction
   * and `SceneState.outcome` uses achieved / partial / not_achieved. The two vocabularies
   * are bridged by `sessionOutcomeFromScene`, so "completed" is a real value in this
   * codebase - just not in this field. A visual fixture seeded `sceneState.outcome:
   * 'completed'`, the receipt correctly refused to claim a result, and the wrong state
   * was recorded as a baseline. Task-outcome values must never read as scene results.
   */
  it('does not read task-outcome vocabulary as a scene result', () => {
    for (const taskOutcome of ['completed', 'partly_completed', 'changed_direction']) {
      expect(sceneResultKind(taskOutcome)).toBe('unknown');
    }
  });

  it('fails closed on values outside the vocabulary', () => {
    for (const junk of [
      'achieved ',
      'Achieved',
      'ACHIEVED',
      'complete',
      'finished',
      'true',
      '',
      null,
      undefined,
      0,
      1,
      {},
      [],
      ['achieved'],
      NaN,
    ]) {
      expect(sceneResultKind(junk)).toBe('unknown');
    }
  });

  it('never resolves to a positive result it was not given', () => {
    // A finished scene is not an achieved scene. `isFinished` and the summary text are
    // not evidence of outcome, and must not be able to imply one here.
    expect(sceneResultKind({ isFinished: true, summary: 'You ordered two drinks.' })).toBe(
      'unknown'
    );
  });
});

describe('sceneResultCopyKey', () => {
  it('gives each kind distinct learner-facing copy', () => {
    expect(sceneResultCopyKey('achieved')).toBe('sceneAchieved');
    expect(sceneResultCopyKey('partial')).toBe('scenePartial');
    expect(sceneResultCopyKey('not_achieved')).toBe('sceneNotAchieved');
    expect(sceneResultCopyKey('unknown')).toBe('sceneUnknown');
  });

  it('sends unrecognised outcomes to the fail-closed copy', () => {
    expect(sceneResultCopyKey('completed')).toBe('sceneUnknown');
    expect(sceneResultCopyKey(undefined)).toBe('sceneUnknown');
  });
});

describe('asAuthoredOutcome', () => {
  it('passes authored values through', () => {
    expect(asAuthoredOutcome('achieved')).toBe('achieved');
    expect(asAuthoredOutcome('partial')).toBe('partial');
    expect(asAuthoredOutcome('not_achieved')).toBe('not_achieved');
    expect(asAuthoredOutcome('unknown')).toBe('unknown');
  });

  it('rejects rather than repairs an unreadable outcome', () => {
    // The distinction matters at an input boundary: "this record says the scene
    // reported nothing" and "this record is malformed" are different facts, and a
    // caller that conflates them will treat corrupt data as a real observation.
    expect(asAuthoredOutcome('completed')).toBeUndefined();
    expect(asAuthoredOutcome(undefined)).toBeUndefined();
    expect(asAuthoredOutcome(null)).toBeUndefined();
  });
});
