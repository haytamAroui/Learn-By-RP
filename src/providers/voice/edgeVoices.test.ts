import { describe, expect, it } from 'vitest';
import { pickEdgeVoice } from './edgeVoices';

describe('edge voice selection', () => {
  it('picks the exact regional voice for the requested gender', () => {
    expect(pickEdgeVoice('nl-BE', 'female').shortName).toBe('nl-BE-DenaNeural');
    expect(pickEdgeVoice('nl-BE', 'male').shortName).toBe('nl-BE-ArnaudNeural');
  });

  it('accepts an underscore locale', () => {
    expect(pickEdgeVoice('nl_BE', 'female').locale).toBe('nl-BE');
  });

  it('does not answer Belgian Dutch with a Netherlands voice', () => {
    expect(pickEdgeVoice('nl-BE', 'female').shortName).not.toBe('nl-NL-ColetteNeural');
  });

  it('falls back to the same language in another region', () => {
    const voice = pickEdgeVoice('nl-NL', 'female');
    expect(voice.shortName).toBe('nl-NL-ColetteNeural');
    expect(voice.locale).toBe('nl-NL');
  });

  it('keeps the requested gender when the region is unknown', () => {
    expect(pickEdgeVoice('pt-BR', 'male').gender).toBe('male');
  });

  it('uses a female voice when no gender is given', () => {
    expect(pickEdgeVoice('fr-FR').gender).toBe('female');
  });

  it('falls back to a default voice for an unknown language', () => {
    const voice = pickEdgeVoice('xx-XX');
    expect(voice.shortName).toBe('en-US-AriaNeural');
  });

  it('falls back to a default voice for an empty locale', () => {
    expect(pickEdgeVoice('', 'male').shortName).toBe('en-US-GuyNeural');
  });
});
