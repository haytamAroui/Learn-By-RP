import { describe, expect, it } from 'vitest';
import { GEMINI_VOICE_PERSONAS } from './geminiVoices';

describe('GEMINI_VOICE_PERSONAS', () => {
  it('exposes all 9 authentic Google Gemini 3.8 Flash voice design personas', () => {
    expect(GEMINI_VOICE_PERSONAS).toHaveLength(9);
    const ids = GEMINI_VOICE_PERSONAS.map(p => p.id);
    expect(ids).toEqual([
      'Kore',
      'Aoede',
      'Leda',
      'Zephyr',
      'Despina',
      'Autonoe',
      'Puck',
      'Charon',
      'Fenrir',
    ]);
  });

  it('contains valid personality titles, Flemish descriptions, and sample dialogue', () => {
    for (const persona of GEMINI_VOICE_PERSONAS) {
      expect(persona.name).toBeTruthy();
      expect(persona.title).toContain('—');
      expect(persona.description).toBeTruthy();
      expect(persona.sampleText).toBeTruthy();
      expect(['female', 'male']).toContain(persona.gender);
    }
  });

  it('matches the personas from VlaamsVoice audio compendium', () => {
    const charon = GEMINI_VOICE_PERSONAS.find(p => p.id === 'Charon');
    expect(charon).toBeDefined();
    expect(charon?.title).toBe('Diep — Rijp & Warm');
    expect(charon?.gender).toBe('male');

    const kore = GEMINI_VOICE_PERSONAS.find(p => p.id === 'Kore');
    expect(kore).toBeDefined();
    expect(kore?.title).toBe('Helder — Nieuws & Formeel');
    expect(kore?.gender).toBe('female');

    const aoede = GEMINI_VOICE_PERSONAS.find(p => p.id === 'Aoede');
    expect(aoede).toBeDefined();
    expect(aoede?.title).toBe('Warm — Warm & Verhalend');
    expect(aoede?.gender).toBe('female');
  });
});
