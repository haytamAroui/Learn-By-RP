import { describe, expect, it } from 'vitest';
import { NL_BE_MISSIONS } from './missions.nlBE';
import { getScene } from '../content/scenes';
import { validateMissionScenarioFamily } from '../content/scenarioFamilies';
import { validateCharacterBehaviorPolicy } from '../features/roleplay/characterPolicy';

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

  it('provides exactly 60 curated situations: 20 A1, 20 A2, and 20 B1', () => {
    expect(NL_BE_MISSIONS).toHaveLength(60);

    const a1Missions = NL_BE_MISSIONS.filter(m => m.levelRange === 'A1');
    const a2Missions = NL_BE_MISSIONS.filter(m => m.levelRange === 'A2');
    const b1Missions = NL_BE_MISSIONS.filter(m => m.levelRange === 'B1');

    expect(a1Missions).toHaveLength(20);
    expect(a2Missions).toHaveLength(20);
    expect(b1Missions).toHaveLength(20);
  });

  it('includes all 24 authentic Werkgesprek units across A1 to B1', () => {
    const expectedWgCodes = Array.from({ length: 24 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return `WG${num}`;
    });

    for (const code of expectedWgCodes) {
      const match = NL_BE_MISSIONS.find(m =>
        m.id.toLowerCase().includes(code.toLowerCase()) ||
        m.title.startsWith(code) ||
        (code === 'WG01' && m.id === 'mission-nl-be-eerste-werkdag') ||
        (code === 'WG02' && m.id === 'mission-nl-be-werkinstructie') ||
        (code === 'WG04' && m.id === 'mission-nl-be-probleem-melden') ||
        (code === 'WG07' && m.id === 'mission-nl-be-ziekte-melden') ||
        (code === 'WG18' && m.id === 'mission-nl-be-werf-controle')
      );
      expect(match, `Expected mission for ${code}`).toBeDefined();
    }
  });

  it('validates every mission against reviewed scenario family and character behavior policies', () => {
    for (const mission of NL_BE_MISSIONS) {
      expect(validateMissionScenarioFamily(mission), `${mission.id} family errors`).toEqual([]);
      expect(validateCharacterBehaviorPolicy(mission), `${mission.id} behavior errors`).toEqual([]);
    }
  });
});
