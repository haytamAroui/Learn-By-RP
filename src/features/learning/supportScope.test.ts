import { describe, expect, it } from 'vitest';
import { Passage, SupportExposure } from '../../types';
import {
  isPhraseProductionSupportRelevant,
  isProductionFormExposure,
  isSkillProductionSupportRelevant,
} from './supportScope';

const PASSAGE: Passage = {
  id: 'p-1',
  sessionId: 's-1',
  attemptId: 'attempt-1',
  speaker: 'user',
  revisionKey: 'rev-1',
  assemblyVersion: 1,
  status: 'final',
  text: '¿Tiene leche de avena?',
  modality: 'spoken',
  startedAt: '2026-10-02T01:00:00.000Z',
  endedAt: '2026-10-02T01:00:05.000Z',
  fragments: [],
};

function exposure(overrides: Partial<SupportExposure> = {}): SupportExposure {
  return {
    id: 'exp-1',
    sessionId: 's-1',
    attemptId: 'attempt-1',
    source: 'coach',
    kind: 'full_form',
    targetSkillId: 'skill-request-substitution',
    targetOpportunityId: 'opp-1',
    targetPhraseId: 'phrase-a',
    targetItemIds: ['phrase-a'],
    exposure: 'visible',
    recordedAt: '2026-10-02T01:00:03.000Z',
    ...overrides,
  };
}

describe('scoped support semantics', () => {
  it('a hint for one phrase affects only that phrase', () => {
    const scoped = exposure();

    expect(isPhraseProductionSupportRelevant({ exposure: scoped, phraseId: 'phrase-a', passage: PASSAGE, attemptId: 'attempt-1' })).toBe(true);
    expect(isPhraseProductionSupportRelevant({ exposure: scoped, phraseId: 'phrase-b', passage: PASSAGE, attemptId: 'attempt-1' })).toBe(false);
  });

  it('meaning of the character turn is not production-form support', () => {
    const meaning = exposure({
      kind: 'meaning_of_assistant_turn',
      targetSkillId: undefined,
      targetOpportunityId: undefined,
      targetPhraseId: undefined,
      targetItemIds: [],
    });

    expect(isProductionFormExposure(meaning)).toBe(false);
    expect(isPhraseProductionSupportRelevant({ exposure: meaning, phraseId: 'phrase-a', passage: PASSAGE, attemptId: 'attempt-1' })).toBe(false);
  });

  it('intent guidance is recorded without downgrading production', () => {
    expect(isProductionFormExposure(exposure({ kind: 'intent_hint' }))).toBe(false);
  });

  it('caption/replay/slow/explanation are comprehension accommodations, not production help', () => {
    for (const kind of [
      'caption_view',
      'assistant_audio_replay',
      'assistant_audio_slow',
      'meaning_of_assistant_turn',
      'explanation',
    ] as const) {
      expect(isProductionFormExposure(exposure({ kind })), kind).toBe(false);
    }
  });

  it('skill support must match the exact opportunity when one is scoped', () => {
    const scoped = exposure();

    expect(
      isSkillProductionSupportRelevant({
        exposure: scoped,
        passage: PASSAGE,
        attemptId: 'attempt-1',
        skillId: 'skill-request-substitution',
        opportunityInstanceId: 'opp-1',
      })
    ).toBe(true);

    expect(
      isSkillProductionSupportRelevant({
        exposure: scoped,
        passage: PASSAGE,
        attemptId: 'attempt-1',
        skillId: 'skill-request-substitution',
        opportunityInstanceId: 'opp-other',
      })
    ).toBe(false);
  });

  it('versioned production support expires outside the policy window', () => {
    const oldSupport = exposure({
      policyVersion: 3,
      recordedAt: '2026-10-02T00:55:00.000Z',
    });

    expect(
      isPhraseProductionSupportRelevant({
        exposure: oldSupport,
        phraseId: 'phrase-a',
        passage: PASSAGE,
        attemptId: 'attempt-1',
      })
    ).toBe(false);
  });

  it('support shown after the learner passage does not downgrade that passage', () => {
    expect(
      isSkillProductionSupportRelevant({
        exposure: exposure({ recordedAt: '2026-10-02T01:00:06.000Z' }),
        passage: PASSAGE,
        attemptId: 'attempt-1',
        skillId: 'skill-request-substitution',
        opportunityInstanceId: 'opp-1',
      })
    ).toBe(false);
  });
});
