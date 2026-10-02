import { describe, expect, it } from 'vitest';
import { Passage, SessionRecord, SupportExposure } from '../../types';
import {
  isPhraseProductionSupportRelevant,
  isProductionFormExposure,
  isSkillProductionSupportRelevant,
  selectHistoricalCrossSessionSupport,
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

  it('briefing and recap support carries across attempts only on the same UTC evidence day', () => {
    const recap = exposure({
      id: 'recap-1',
      sessionId: 'prior-session',
      attemptId: 'prior-attempt',
      source: 'recap',
      kind: 'recap_exposure',
      targetSkillId: undefined,
      targetOpportunityId: undefined,
      targetPhraseId: 'phrase-a',
      targetItemIds: ['phrase-a'],
      policyVersion: 5,
      recordedAt: '2026-10-02T00:05:00.000Z',
    });

    expect(
      isPhraseProductionSupportRelevant({
        exposure: recap,
        phraseId: 'phrase-a',
        passage: PASSAGE,
        attemptId: 'attempt-1',
      })
    ).toBe(true);

    expect(
      isPhraseProductionSupportRelevant({
        exposure: recap,
        phraseId: 'phrase-b',
        passage: PASSAGE,
        attemptId: 'attempt-1',
      })
    ).toBe(false);

    expect(
      isPhraseProductionSupportRelevant({
        exposure: recap,
        phraseId: 'phrase-a',
        passage: {
          ...PASSAGE,
          startedAt: '2026-10-03T00:01:00.000Z',
          endedAt: '2026-10-03T00:01:05.000Z',
        },
        attemptId: 'attempt-1',
      })
    ).toBe(false);
  });

  it('selects only earlier same-day historical briefing/recap rows for mission phrases', () => {
    const historical: SessionRecord = {
      id: 'old-session',
      missionId: 'mission-old',
      missionVersion: 1,
      language: 'es',
      mode: 'guided',
      coldAttempt: false,
      state: 'recap_ready',
      startedAt: '2026-10-02T00:00:00.000Z',
      endedAt: '2026-10-02T00:10:00.000Z',
      passages: [],
      supportExposures: [
        exposure({
          id: 'briefing-a',
          sessionId: 'old-session',
          attemptId: 'attempt-1',
          source: 'briefing',
          kind: 'briefing_exposure',
          targetPhraseId: 'phrase-a',
          targetItemIds: ['phrase-a'],
          recordedAt: '2026-10-02T00:01:00.000Z',
        }),
        exposure({
          id: 'recap-b',
          sessionId: 'old-session',
          attemptId: 'attempt-1',
          source: 'recap',
          kind: 'recap_exposure',
          targetPhraseId: 'phrase-b',
          targetItemIds: ['phrase-b'],
          recordedAt: '2026-10-02T00:09:00.000Z',
        }),
        exposure({
          id: 'coach-a',
          sessionId: 'old-session',
          attemptId: 'attempt-1',
          source: 'coach',
          kind: 'full_form',
          targetPhraseId: 'phrase-a',
          targetItemIds: ['phrase-a'],
          recordedAt: '2026-10-02T00:02:00.000Z',
        }),
      ],
      observations: [],
      taskOutcome: 'completed',
      sceneState: {
        sceneId: 'scene-old',
        revision: 1,
        facts: {},
        learnerKnows: [],
        characterKnows: [],
        checkpoints: [],
        isFinished: true,
        outcome: 'achieved',
      },
    };

    const selected = selectHistoricalCrossSessionSupport({
      sessions: [historical],
      currentSessionId: 'new-session',
      targetPhraseIds: ['phrase-a'],
      currentSessionStartedAt: '2026-10-02T01:00:00.000Z',
    });

    expect(selected.map(item => item.id)).toEqual(['briefing-a']);

    expect(
      selectHistoricalCrossSessionSupport({
        sessions: [historical],
        currentSessionId: 'new-session',
        targetPhraseIds: ['phrase-a', 'phrase-b'],
        currentSessionStartedAt: '2026-10-03T01:00:00.000Z',
      })
    ).toEqual([]);
  });

});
