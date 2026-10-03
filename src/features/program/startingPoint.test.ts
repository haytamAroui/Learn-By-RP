import { describe, expect, it } from 'vitest';
import {
  buildStartingPointProfile,
  deriveProgramEntryMode,
  legacyComfortLevelForEntryMode,
} from './startingPoint';

describe('learner starting point', () => {
  it('starts a complete beginner with Observe', () => {
    expect(
      deriveProgramEntryMode({
        studiedBefore: 'none',
        understandsEveryday: 'no',
        canAnswerBasic: 'no',
      })
    ).toBe('observe_first');
  });

  it('starts a learner with some exposure in Guided mode', () => {
    expect(
      deriveProgramEntryMode({
        studiedBefore: 'a_little',
        understandsEveryday: 'sometimes',
        canAnswerBasic: 'with_help',
      })
    ).toBe('guided_first');
  });

  it('uses a tolerant warm-up when the learner can already answer', () => {
    expect(
      deriveProgramEntryMode({
        studiedBefore: 'yes',
        understandsEveryday: 'yes',
        canAnswerBasic: 'yes',
      })
    ).toBe('warmup_first');
  });

  it('uses a tolerant warm-up when the learner is not sure', () => {
    expect(
      deriveProgramEntryMode({
        studiedBefore: 'not_sure',
        understandsEveryday: 'not_sure',
        canAnswerBasic: 'not_sure',
      })
    ).toBe('warmup_first');
  });

  it('builds a local profile without inventing a CEFR label', () => {
    const profile = buildStartingPointProfile(
      {
        studiedBefore: 'none',
        understandsEveryday: 'no',
        canAnswerBasic: 'no',
      },
      '2026-10-03T12:00:00.000Z'
    );

    expect(profile).toEqual({
      answers: {
        studiedBefore: 'none',
        understandsEveryday: 'no',
        canAnswerBasic: 'no',
      },
      entryMode: 'observe_first',
      warmupCompleted: false,
      recordedAt: '2026-10-03T12:00:00.000Z',
    });
    expect(legacyComfortLevelForEntryMode(profile.entryMode)).toBe('beginner');
  });
});
