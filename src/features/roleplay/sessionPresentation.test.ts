import { describe, expect, it } from 'vitest';
import { NL_BE_MISSIONS } from '../../data/missions.nlBE';
import type { Passage, SceneState } from '../../types';
import { isPhraseProductionSupportRelevant } from '../learning/supportScope';
import { phraseTranslation, sceneCheckpointProgress, suggestedPhraseExposure } from './sessionPresentation';

const mission = NL_BE_MISSIONS[0];
const state: SceneState = { sceneId: mission.sceneId!, revision: 2, facts: {}, learnerKnows: [],
  characterKnows: [], checkpoints: [], isFinished: false, outcome: 'unknown' };

describe('conversation presentation', () => {
  it('counts only matching authored, revision-scoped scene checkpoints', () => {
    expect(sceneCheckpointProgress(mission, state)).toEqual({ completed: 0, total: 2 });
    expect(sceneCheckpointProgress(mission, { ...state, checkpoints: [
      { id: 'cp-nl-be-cafe-selection', description: '', timestamp: '', sceneRevision: 1 },
      { id: 'cp-nl-be-cafe-selection', description: '', timestamp: '', sceneRevision: 1 },
      { id: 'cp-nl-be-cafe-takeaway', description: '', timestamp: '', sceneRevision: 3 },
      { id: 'model-invented', description: '', timestamp: '', sceneRevision: 1 },
    ] })).toEqual({ completed: 1, total: 2 });
    expect(sceneCheckpointProgress(mission, { ...state, sceneId: 'other' })).toBeNull();
    expect(sceneCheckpointProgress(mission, { ...state, checkpoints: [
      { id: 'cp-nl-be-cafe-selection', description: '', timestamp: '' },
    ] })).toEqual({ completed: 0, total: 2 });
  });

  it('never substitutes English for missing French/Dutch translations', () => {
    expect(phraseTranslation(mission.usefulPhrases[0], 'fr')).toContain('Un café');
    expect(phraseTranslation(mission.usefulPhrases[0], 'en')).toBe(mission.usefulPhrases[0].meaning);
    expect(phraseTranslation(mission.usefulPhrases[0], 'nl')).toBeUndefined();
    expect(phraseTranslation({ ...mission.usefulPhrases[0], meaningTranslations: undefined }, 'fr')).toBeUndefined();
  });

  it('scopes revealed answers to the authored phrase and current attempt without inventing skill evidence', () => {
    const exposure = suggestedPhraseExposure({ sessionId: 's', attemptId: 'a', phraseId: 'p',
      kind: 'full_form', recordedAt: '2026-10-09T10:00:00Z' });
    expect(exposure).toMatchObject({ source: 'coach', kind: 'full_form', targetPhraseId: 'p', exposure: 'visible' });
    expect(exposure.targetSkillId).toBeUndefined();
    expect(exposure.targetOpportunityId).toBeUndefined();
    const passage: Passage = { id: 'u', sessionId: 's', attemptId: 'a', speaker: 'user', text: 'phrase',
      status: 'final', revisionKey: 'rev-1', assemblyVersion: 1, modality: 'typed', fragments: [],
      startedAt: '2026-10-09T10:00:02Z', endedAt: '2026-10-09T10:00:03Z' };
    expect(isPhraseProductionSupportRelevant({ exposure, phraseId: 'p', passage, attemptId: 'a' })).toBe(true);
    expect(isPhraseProductionSupportRelevant({ exposure, phraseId: 'unrelated', passage, attemptId: 'a' })).toBe(false);
    expect(isPhraseProductionSupportRelevant({ exposure, phraseId: 'p', passage: { ...passage, attemptId: 'b' }, attemptId: 'b' })).toBe(false);
    expect(suggestedPhraseExposure({ sessionId: 's', attemptId: 'a', phraseId: 'p', kind: 'model_phrase_audio',
      recordedAt: '2026-10-09T10:00:00Z' }).exposure).toBe('uncertain');
  });
});
