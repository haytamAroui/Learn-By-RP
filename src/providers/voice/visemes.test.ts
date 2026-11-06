import { describe, expect, it } from 'vitest';
import {
  estimateSpeechDurationMs,
  estimateVisemeTimeline,
  timelineFromCues,
  visemeAt,
  visemeCuesForWord,
  visemeTimelineFromWords,
} from './visemes';

const VISEMES = [
  'sil',
  'PP',
  'FF',
  'TH',
  'DD',
  'kk',
  'CH',
  'SS',
  'nn',
  'RR',
  'aa',
  'E',
  'I',
  'O',
  'U',
] as const;

describe('viseme timeline estimation', () => {
  it('covers the whole duration with contiguous cues', () => {
    const timeline = estimateVisemeTimeline('Goeiedag, hoe gaat het?', 2000);

    expect(timeline.durationMs).toBe(2000);
    expect(timeline.cues.length).toBeGreaterThan(0);

    const covered = timeline.cues.reduce((sum, cue) => sum + cue.durationMs, 0);
    expect(covered).toBe(2000);

    for (let index = 1; index < timeline.cues.length; index += 1) {
      const previous = timeline.cues[index - 1];
      const current = timeline.cues[index];
      expect(current.offsetMs).toBe(previous.offsetMs + previous.durationMs);
    }
  });

  it('is deterministic for the same text and duration', () => {
    const first = estimateVisemeTimeline('Een koffie, alstublieft.', 1500);
    const second = estimateVisemeTimeline('Een koffie, alstublieft.', 1500);
    expect(first).toEqual(second);
  });

  it('produces no cues when there is no duration', () => {
    const timeline = estimateVisemeTimeline('Hallo', 0);
    expect(timeline.cues).toEqual([]);
    expect(timeline.durationMs).toBe(0);
  });

  it('produces no cues for text without speakable content', () => {
    const timeline = estimateVisemeTimeline('   ', 1000);
    expect(timeline.cues).toEqual([]);
    expect(timeline.durationMs).toBe(1000);
  });

  it('keeps the mouth moving for scripts without latin letters', () => {
    const timeline = estimateVisemeTimeline('こんにちは', 1200);
    expect(timeline.cues.length).toBe(1);
    expect(timeline.cues[0].durationMs).toBe(1200);
    expect(timeline.cues[0].shape).not.toBe('sil');
  });

  it('separates words with a silence cue', () => {
    const timeline = estimateVisemeTimeline('ja nee', 1000);
    expect(timeline.cues.some(cue => cue.shape === 'sil')).toBe(true);
  });

  it('maps a playback position to the covering cue', () => {
    const timeline = estimateVisemeTimeline('Hallo wereld', 1000);
    const first = timeline.cues[0];
    expect(visemeAt(timeline, first.offsetMs)).toBe(first.shape);
    expect(visemeAt(timeline, first.offsetMs + first.durationMs - 1)).toBe(first.shape);
  });

  it('rests outside the timeline', () => {
    const timeline = estimateVisemeTimeline('Hallo', 500);
    expect(visemeAt(timeline, -10)).toBe('sil');
    expect(visemeAt(timeline, 5000)).toBe('sil');
    expect(visemeAt(null, 10)).toBe('sil');
  });

  it('closes the mouth on bilabials and opens it on open vowels', () => {
    const timeline = estimateVisemeTimeline('mama', 800);
    const shapes = timeline.cues.map(cue => cue.shape);
    expect(shapes).toContain('PP');
    expect(shapes).toContain('aa');
  });

  it('only uses canonical viseme names', () => {
    const timeline = estimateVisemeTimeline('De zon schijnt over de stad.', 3000);
    for (const cue of timeline.cues) {
      expect(VISEMES).toContain(cue.shape);
    }
  });

  it('keeps provider supplied cues and reports their length', () => {
    const timeline = timelineFromCues([
      { shape: 'aa', offsetMs: 0, durationMs: 120 },
      { shape: 'sil', offsetMs: 120, durationMs: 30 },
    ]);
    expect(timeline.durationMs).toBe(150);
    expect(timeline.cues).toHaveLength(2);
  });

  it('treats missing provider cues as an empty timeline', () => {
    expect(timelineFromCues(undefined).cues).toEqual([]);
    expect(timelineFromCues([]).durationMs).toBe(0);
  });
});

describe('speech duration estimate', () => {
  it('scales with the number of words', () => {
    const short = estimateSpeechDurationMs('Hallo', 1);
    const long = estimateSpeechDurationMs('Hallo hoe gaat het met jou', 1);
    expect(long).toBeGreaterThan(short);
  });

  it('shortens the estimate when the speech is faster', () => {
    const normal = estimateSpeechDurationMs('Hallo hoe gaat het', 1);
    const fast = estimateSpeechDurationMs('Hallo hoe gaat het', 2);
    expect(fast).toBeLessThan(normal);
  });

  it('returns zero for empty text', () => {
    expect(estimateSpeechDurationMs('   ', 1)).toBe(0);
  });
});

describe('mouth timeline from reported word timings', () => {
  it('places the shapes inside the word that was spoken', () => {
    const cues = visemeCuesForWord('mama', 1000, 400);

    expect(cues.length).toBeGreaterThan(0);
    for (const cue of cues) {
      expect(cue.offsetMs).toBeGreaterThanOrEqual(1000);
      expect(cue.offsetMs + cue.durationMs).toBeLessThanOrEqual(1400);
    }
  });

  it('builds one timeline from a sequence of words', () => {
    const timeline = visemeTimelineFromWords([
      { text: 'Goeiedag', offsetMs: 0, durationMs: 500 },
      { text: 'Lotte', offsetMs: 600, durationMs: 400 },
    ]);

    expect(timeline.cues.length).toBeGreaterThan(1);
    expect(timeline.durationMs).toBeLessThanOrEqual(1000);
    for (const cue of timeline.cues) {
      expect(cue.offsetMs).toBeLessThan(1000);
    }
  });

  it('keeps the words in order', () => {
    const timeline = visemeTimelineFromWords([
      { text: 'tweede', offsetMs: 500, durationMs: 200 },
      { text: 'eerste', offsetMs: 0, durationMs: 200 },
    ]);
    const offsets = timeline.cues.map(cue => cue.offsetMs);
    expect([...offsets].sort((a, b) => a - b)).toEqual(offsets);
  });

  it('has no cues when no word was timed', () => {
    expect(visemeTimelineFromWords([]).cues).toEqual([]);
  });
});
