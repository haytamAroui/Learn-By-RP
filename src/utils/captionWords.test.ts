import { describe, expect, it } from 'vitest';
import { segmentCaptionWords } from './captionWords';

describe('segmentCaptionWords (Mural pattern)', () => {
  it('preserves complete text fidelity and extracts clean lookup tokens', () => {
    const input = 'Goeiemorgen! Een koffie met melk, alstublieft.';
    const segments = segmentCaptionWords(input);

    expect(segments.map(s => s.text).join('')).toBe(input);

    const lookups = segments.filter(s => s.lookup).map(s => s.lookup);
    expect(lookups).toEqual([
      'Goeiemorgen',
      'Een',
      'koffie',
      'met',
      'melk',
      'alstublieft',
    ]);
  });

  it('handles empty strings and whitespace gracefully', () => {
    expect(segmentCaptionWords('')).toEqual([]);
    expect(segmentCaptionWords('   ').map(s => s.text).join('')).toBe('   ');
    expect(segmentCaptionWords('   ').every(s => s.lookup === undefined)).toBe(true);
  });

  it('handles Dutch contractions and punctuation correctly', () => {
    const input = "Wat mag 't zijn?";
    const segments = segmentCaptionWords(input);
    expect(segments.map(s => s.text).join('')).toBe(input);
    const lookups = segments.filter(s => s.lookup).map(s => s.lookup);
    expect(lookups).toContain('Wat');
    expect(lookups).toContain('mag');
    expect(lookups).toContain('zijn');
  });
});
