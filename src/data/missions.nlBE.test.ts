import { describe, expect, it } from 'vitest';
import { NL_BE_MISSIONS } from './missions.nlBE';
import { getScene } from '../content/scenes';

describe('Belgian Dutch starter conversation', () => {
  it('provides a complete Dutch dialogue with English and French translations', () => {
    const mission = NL_BE_MISSIONS.find(item => item.id === 'mission-nl-be-koffiebar');
    expect(mission?.sampleConversation).toHaveLength(6);

    for (const turn of mission?.sampleConversation ?? []) {
      expect(turn.nl.trim()).not.toBe('');
      expect(turn.en.trim()).not.toBe('');
      expect(turn.fr.trim()).not.toBe('');
    }
  });

  it('does not reuse the sample dialogue as an authored assessment rubric', () => {
    const mission = NL_BE_MISSIONS.find(item => item.id === 'mission-nl-be-koffiebar');
    const scene = mission?.sceneId ? getScene(mission.sceneId) : undefined;
    const rubricExamples = scene?.opportunityDefinitions.flatMap(opportunity => [
      ...opportunity.positiveExamples,
      ...opportunity.negativeExamples,
    ]) ?? [];
    for (const turn of mission?.sampleConversation ?? []) {
      expect(rubricExamples).not.toContain(turn.nl);
    }
  });
});
