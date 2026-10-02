import { describe, expect, it } from 'vitest';
import { Passage, SupportExposure } from '../../types';
import {
  isPhraseProductionSupportRelevant,
  isProductionFormExposure,
  isSkillProductionSupportRelevant,
} from './supportScope';
import {
  createModelPhraseAudioExposure,
  mergeVisibleCaptionViewExposures,
} from './supportSurfaces';

function passage(overrides: Partial<Passage> = {}): Passage {
  return {
    id: 'assistant-1',
    sessionId: 's-1',
    attemptId: 'attempt-parent',
    speaker: 'assistant',
    revisionKey: 'rev-1',
    assemblyVersion: 1,
    status: 'final',
    text: '¿Para llevar o para tomar aquí?',
    modality: 'spoken',
    startedAt: '2026-10-02T10:00:00.000Z',
    endedAt: '2026-10-02T10:00:02.000Z',
    fragments: [],
    ...overrides,
  };
}

describe('non-coach support surface instrumentation', () => {
  it('records visible assistant captions once per current attempt without making them production help', () => {
    const visible = [
      passage(),
      passage({
        id: 'user-1',
        speaker: 'user',
        attemptId: 'attempt-1',
        text: 'Para llevar.',
      }),
      passage({ id: 'assistant-partial', status: 'partial' }),
    ];

    const first = mergeVisibleCaptionViewExposures({
      existing: [],
      visiblePassages: visible,
      sessionId: 's-1',
      attemptId: 'attempt-retry',
      recordedAt: '2026-10-02T10:01:00.000Z',
    });

    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({
      id: 'exp-caption-view-attempt-retry-assistant-1',
      attemptId: 'attempt-retry',
      turnId: 'assistant-1',
      source: 'caption',
      kind: 'caption_view',
      targetItemIds: [],
      exposure: 'visible',
    });
    expect(isProductionFormExposure(first[0])).toBe(false);

    const second = mergeVisibleCaptionViewExposures({
      existing: first,
      visiblePassages: visible,
      sessionId: 's-1',
      attemptId: 'attempt-retry',
      recordedAt: '2026-10-02T10:01:05.000Z',
    });

    expect(second).toBe(first);
  });

  it('records model phrase audio with exact phrase, skill and opportunity scope', () => {
    const exposure = createModelPhraseAudioExposure({
      sessionId: 's-1',
      attemptId: 'attempt-1',
      targetSkillId: 'skill-request-substitution',
      targetOpportunityId: 'opportunity:attempt-1:opp-1',
      targetPhraseId: 'phrase.es.oat_milk_request',
      recordedAt: '2026-10-02T10:00:03.000Z',
    });

    expect(exposure).toMatchObject({
      source: 'coach',
      kind: 'model_phrase_audio',
      targetSkillId: 'skill-request-substitution',
      targetOpportunityId: 'opportunity:attempt-1:opp-1',
      targetPhraseId: 'phrase.es.oat_milk_request',
      targetItemIds: ['phrase.es.oat_milk_request'],
      exposure: 'played',
    });
    expect(isProductionFormExposure(exposure)).toBe(true);

    const learnerPassage = passage({
      id: 'learner-1',
      speaker: 'user',
      attemptId: 'attempt-1',
      text: '¿Tiene leche de avena?',
      startedAt: '2026-10-02T10:00:04.000Z',
      endedAt: '2026-10-02T10:00:06.000Z',
    });

    expect(
      isPhraseProductionSupportRelevant({
        exposure,
        phraseId: 'phrase.es.oat_milk_request',
        passage: learnerPassage,
        attemptId: 'attempt-1',
      })
    ).toBe(true);
    expect(
      isPhraseProductionSupportRelevant({
        exposure,
        phraseId: 'phrase.other',
        passage: learnerPassage,
        attemptId: 'attempt-1',
      })
    ).toBe(false);

    expect(
      isSkillProductionSupportRelevant({
        exposure,
        passage: learnerPassage,
        attemptId: 'attempt-1',
        skillId: 'skill-request-substitution',
        opportunityInstanceId: 'opportunity:attempt-1:opp-1',
      })
    ).toBe(true);
    expect(
      isSkillProductionSupportRelevant({
        exposure,
        passage: learnerPassage,
        attemptId: 'attempt-1',
        skillId: 'skill-request-substitution',
        opportunityInstanceId: 'opportunity:attempt-1:opp-other',
      })
    ).toBe(false);
  });
});
