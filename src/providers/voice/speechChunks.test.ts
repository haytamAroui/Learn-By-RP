import { describe, expect, it } from 'vitest';
import { splitIntoSpeechChunks } from './speechChunks';

describe('speech chunking', () => {
  it('returns nothing for empty text', () => {
    expect(splitIntoSpeechChunks('')).toEqual([]);
    expect(splitIntoSpeechChunks('   ')).toEqual([]);
  });

  it('keeps a short line as one piece', () => {
    expect(splitIntoSpeechChunks('Hallo!')).toEqual(['Hallo!']);
  });

  it('splits at sentence boundaries and keeps the punctuation', () => {
    expect(splitIntoSpeechChunks('Goeiedag. Welkom in Brussel!')).toEqual([
      'Goeiedag.',
      'Welkom in Brussel!',
    ]);
  });

  it('keeps question marks as sentence ends', () => {
    expect(splitIntoSpeechChunks('Wat mag het zijn? Ik luister.')).toEqual([
      'Wat mag het zijn?',
      'Ik luister.',
    ]);
  });

  it('gives every sentence its own piece so the first sound can arrive early', () => {
    expect(splitIntoSpeechChunks('Ja. Nee. Misschien. Goed.')).toEqual([
      'Ja.',
      'Nee.',
      'Misschien.',
      'Goed.',
    ]);
  });

  it('splits a long sentence at a word boundary', () => {
    const long = `${'woord '.repeat(60)}einde`;
    const chunks = splitIntoSpeechChunks(long, 60);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(60);
    }
    expect(chunks.join(' ')).toBe(long);
  });

  it('keeps every word of the line', () => {
    const text = 'Een koffie, alstublieft. Dat is alles.';
    const joined = splitIntoSpeechChunks(text).join(' ');
    expect(joined).toBe(text);
  });

  it('normalises repeated whitespace', () => {
    expect(splitIntoSpeechChunks('Hallo   wereld')).toEqual(['Hallo wereld']);
  });
});
