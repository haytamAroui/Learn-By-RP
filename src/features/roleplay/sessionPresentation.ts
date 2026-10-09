import type { MissionDefinition, SceneState, SupportExposure, UsefulPhrase } from '../../types';
import { getScene } from '../../content/scenes';
import { LEARNING_POLICY_VERSION } from '../learning/policy';

/** Presentation of reducer-confirmed checkpoints, never a turn count or mastery score. */
export function sceneCheckpointProgress(mission: MissionDefinition, state: SceneState) {
  const scene = mission.sceneId ? getScene(mission.sceneId) : undefined;
  if (!scene || state.sceneId !== scene.id || !scene.checkpoints.length) return null;
  const completed = new Set(state.checkpoints.filter(checkpoint =>
    typeof checkpoint.sceneRevision === 'number' && checkpoint.sceneRevision <= state.revision
  ).map(checkpoint => checkpoint.id));
  return { total: scene.checkpoints.length,
    completed: scene.checkpoints.filter(checkpoint => completed.has(checkpoint.id)).length };
}

export function phraseTranslation(phrase: UsefulPhrase, language: string): string | undefined {
  if (language === 'fr') return phrase.meaningTranslations?.fr;
  if (language === 'nl') return phrase.meaningTranslations?.nl;
  return phrase.meaning;
}

/** Exact authored phrase scope. Do not infer a skill/opportunity from a helpful phrase. */
export function suggestedPhraseExposure(input: {
  sessionId: string; attemptId: string; phraseId: string; recordedAt: string;
  kind: 'full_form' | 'model_phrase_audio' | 'typed_example';
}): SupportExposure {
  return {
    id: `exp-suggestion-${input.kind}-${input.attemptId}-${input.phraseId}-${input.recordedAt}`,
    sessionId: input.sessionId, attemptId: input.attemptId,
    source: 'coach', kind: input.kind, targetPhraseId: input.phraseId,
    targetItemIds: [input.phraseId],
    // Persist before playback; a provider failure cannot claim successful listening.
    exposure: input.kind === 'model_phrase_audio' ? 'uncertain' : 'visible',
    policyVersion: LEARNING_POLICY_VERSION, recordedAt: input.recordedAt,
  };
}
