import { describe, expect, it } from 'vitest';
import {
  DUTCH_REGIONAL_PROFILES,
  getDutchRegionalProfile,
  buildFlemishSpeechStyle,
} from './regionalProfiles';

describe('DUTCH_REGIONAL_PROFILES', () => {
  it('exposes the 5 primary Belgian Dutch regional profiles', () => {
    expect(DUTCH_REGIONAL_PROFILES.length).toBe(5);
    const ids = DUTCH_REGIONAL_PROFILES.map(p => p.id);
    expect(ids).toEqual([
      'vrt_standard',
      'antwerps',
      'gents',
      'west_vlaams',
      'brussels',
    ]);
  });

  it('provides complete metadata and sample text for each profile', () => {
    for (const profile of DUTCH_REGIONAL_PROFILES) {
      expect(profile.name).toBeTruthy();
      expect(profile.region).toBeTruthy();
      expect(profile.tag).toBeTruthy();
      expect(profile.description).toBeTruthy();
      expect(profile.stylePrompt).toBeTruthy();
      expect(profile.sampleText).toBeTruthy();
      expect(['female', 'male']).toContain(profile.defaultVoiceGender);
      expect(profile.edgeVoice).toMatch(/^nl-BE-(Dena|Arnaud)Neural$/);
    }
  });

  it('defaults to vrt_standard when profile ID is undefined or invalid', () => {
    expect(getDutchRegionalProfile(undefined).id).toBe('vrt_standard');
    expect(getDutchRegionalProfile('unknown' as any).id).toBe('vrt_standard');
  });

  it('retrieves specific profiles by ID', () => {
    expect(getDutchRegionalProfile('antwerps').name).toBe('Antwerpse Energie');
    expect(getDutchRegionalProfile('gents').name).toBe('Gents & Oost-Vlaams');
    expect(getDutchRegionalProfile('west_vlaams').name).toBe('Brugs & West-Vlaams');
    expect(getDutchRegionalProfile('brussels').name).toBe('Brusselse Zakelijke Presentator');
  });

  it('builds a composite Flemish speech style prompt', () => {
    const style = buildFlemishSpeechStyle('antwerps', 'Friendly barista');
    expect(style).toContain('Friendly barista.');
    expect(style).toContain('Antwerp cadence');

    const defaultStyle = buildFlemishSpeechStyle(undefined, undefined);
    expect(defaultStyle).toContain('Belgian Dutch (Vlaams) newscaster');
  });
});
