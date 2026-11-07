import { describe, expect, it } from 'vitest';
import {
  detectBelgianDutchPhonetics,
  PHONETIC_FEATURES,
} from './phoneticGuidance';

describe('SoundSteps nl-BE: phonetic guidance', () => {
  it('detects soft-g in Dutch phrases', () => {
    const tip = detectBelgianDutchPhonetics('Goeiemorgen, een koffie graag');
    expect(tip?.id).toBe('soft_g');
    expect(tip?.ipa).toContain('/ɣ/');
  });

  it('detects bilabial-w in Dutch phrases lacking g', () => {
    const tip = detectBelgianDutchPhonetics('Wat kost dat?');
    expect(tip?.id).toBe('bilabial_w');
    expect(tip?.ipa).toBe('[β̞]');
  });

  it('detects pure monophthongs in words with ee / oo / eu', () => {
    const tip = detectBelgianDutchPhonetics('Meenemen alstublieft');
    expect(tip?.id).toBe('pure_monophthongs');
    expect(tip?.ipa).toContain('/eː/');
  });

  it('detects Flemish diphthongs in phrases with ij / ei / ui', () => {
    const tip = detectBelgianDutchPhonetics('Kijk naar de prijs');
    expect(tip?.id).toBe('flemish_diphthongs');
    expect(tip?.ipa).toContain('/ɛi/');
  });

  it('detects alveolar r when no other primary feature takes precedence', () => {
    const tip = detectBelgianDutchPhonetics('Perron');
    expect(tip?.id).toBe('alveolar_r');
  });

  it('returns null for empty or invalid input', () => {
    expect(detectBelgianDutchPhonetics('')).toBeNull();
    expect(detectBelgianDutchPhonetics(null as any)).toBeNull();
  });

  it('supports SoundSteps clinical role contracts', () => {
    const target: import('./phoneticGuidance').SoundStepsTargetContext = {
      role: 'contrast_reference',
      targetPhoneme: 'soft_g',
      word: 'goed',
      contrastPair: 'hoed',
      phraseContext: 'Dat is heel goed.',
    };
    expect(target.role).toBe('contrast_reference');
    expect(target.targetPhoneme).toBe('soft_g');
    expect(target.contrastPair).toBe('hoed');
  });
});
