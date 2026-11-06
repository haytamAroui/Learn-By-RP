/**
 * Mouth-shape estimation for roleplay speech.
 *
 * The speech provider returns audio without phoneme timings, so the avatar
 * needs its own mouth clock. This module derives a viseme timeline from the
 * spoken text and the measured audio duration. It is an estimate, not a
 * phonetic alignment: it produces a believable mouth rhythm, not exact
 * phoneme boundaries.
 *
 * The viseme set is the canonical Oculus set, which is what Ready Player Me
 * models and every other glTF avatar rig carry as `viseme_*` morph targets.
 * The same names are used by the Rhubarb, Azure and Polly converters, so a
 * provider that reports real visemes can replace this estimator without the
 * client changing.
 *
 * The module is dependency free on purpose. The server uses it to attach a
 * timeline to synthesized audio, and the client uses it to rebuild a timeline
 * when the provider did not supply one.
 */

export type VisemeShape =
  | 'sil'
  | 'PP'
  | 'FF'
  | 'TH'
  | 'DD'
  | 'kk'
  | 'CH'
  | 'SS'
  | 'nn'
  | 'RR'
  | 'aa'
  | 'E'
  | 'I'
  | 'O'
  | 'U';

export interface VisemeCue {
  shape: VisemeShape;
  offsetMs: number;
  durationMs: number;
}

export interface VisemeTimeline {
  durationMs: number;
  cues: VisemeCue[];
}

const VOWEL_WEIGHT = 1;
const CONSONANT_WEIGHT = 0.55;
const WORD_GAP_WEIGHT = 0.8;
const SILENCE_WEIGHT = 0.5;

const LATIN_LETTER = /[a-z]/;
const LETTER = /[a-z\p{L}]/u;
const DIGIT = /[0-9]/;

/** Multi-letter shapes are matched before single letters. */
const DIGRAPHS: ReadonlyArray<readonly [string, VisemeShape]> = [
  ['sch', 'SS'],
  ['sch', 'SS'],
  ['ch', 'CH'],
  ['sh', 'CH'],
  ['th', 'TH'],
  ['ng', 'nn'],
  ['ij', 'E'],
  ['ee', 'E'],
  ['ea', 'E'],
  ['ei', 'E'],
  ['ie', 'E'],
  ['ai', 'E'],
  ['oo', 'U'],
  ['ou', 'U'],
  ['au', 'U'],
  ['eu', 'U'],
  ['oy', 'U'],
  ['uy', 'U'],
];

const SINGLE_SHAPES: Readonly<Record<string, VisemeShape>> = {
  a: 'aa',
  e: 'E',
  i: 'I',
  o: 'O',
  u: 'U',
  y: 'I',
  m: 'PP',
  b: 'PP',
  p: 'PP',
  f: 'FF',
  v: 'FF',
  w: 'U',
  h: 'aa',
  j: 'CH',
  r: 'RR',
  l: 'RR',
  n: 'nn',
  s: 'SS',
  z: 'SS',
  t: 'DD',
  d: 'DD',
  g: 'kk',
  k: 'kk',
  c: 'kk',
  x: 'SS',
  q: 'kk',
};

interface WeightedUnit {
  shape: VisemeShape;
  weight: number;
}

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isVowelShape(shape: VisemeShape): boolean {
  return shape === 'aa' || shape === 'E' || shape === 'I' || shape === 'O' || shape === 'U';
}

/**
 * Split one word into mouth units. Latin words use grapheme rules; anything
 * else (digits, other scripts) becomes one neutral movement so the mouth is
 * never frozen while a line is being spoken.
 */
function wordUnits(word: string): WeightedUnit[] {
  const units: WeightedUnit[] = [];
  let index = 0;

  while (index < word.length) {
    const digraph = DIGRAPHS.find(([letters]) => word.startsWith(letters, index));
    if (digraph) {
      units.push({
        shape: digraph[1],
        weight: isVowelShape(digraph[1]) ? VOWEL_WEIGHT : CONSONANT_WEIGHT,
      });
      index += digraph[0].length;
      continue;
    }

    const letter = word[index];
    if (!LATIN_LETTER.test(letter)) {
      index += 1;
      continue;
    }

    const shape = SINGLE_SHAPES[letter];
    units.push({
      shape,
      weight: isVowelShape(shape) ? VOWEL_WEIGHT : CONSONANT_WEIGHT,
    });
    index += 1;
  }

  if (units.length > 0) return units;

  const hasSpeakableContent = [...word].some(character => LETTER.test(character) || DIGIT.test(character));
  if (!hasSpeakableContent) return [];
  return [{ shape: 'aa', weight: VOWEL_WEIGHT }];
}

function mergeAdjacent(units: WeightedUnit[]): WeightedUnit[] {
  const merged: WeightedUnit[] = [];
  for (const unit of units) {
    const previous = merged[merged.length - 1];
    if (previous && previous.shape === unit.shape) {
      merged[merged.length - 1] = {
        shape: unit.shape,
        weight: previous.weight + unit.weight,
      };
      continue;
    }
    merged.push(unit);
  }
  return merged;
}

/**
 * Build a viseme timeline for `text` stretched across `durationMs`.
 *
 * The cues are contiguous and cover the whole duration, so a consumer can map
 * a playback position to a mouth shape without gaps.
 */
export function estimateVisemeTimeline(text: string, durationMs: number): VisemeTimeline {
  const safeDuration = Math.max(0, Math.round(durationMs));
  if (safeDuration <= 0) return { durationMs: 0, cues: [] };

  const normalized = stripDiacritics(String(text ?? '')).toLowerCase();
  const units: WeightedUnit[] = [];
  let pendingGap = false;

  for (const rawToken of normalized.split(/(\s+)/)) {
    if (!rawToken) continue;
    if (/^\s+$/.test(rawToken)) {
      pendingGap = units.length > 0;
      continue;
    }

    const spoken = rawToken.replace(/[^\p{L}\p{N}]/gu, '');

    if (pendingGap) {
      units.push({ shape: 'sil', weight: WORD_GAP_WEIGHT });
      pendingGap = false;
    }

    units.push(...wordUnits(spoken));
  }

  if (units.length === 0) {
    return { durationMs: safeDuration, cues: [] };
  }

  const merged = mergeAdjacent(units);
  const totalWeight = merged.reduce((sum, unit) => sum + unit.weight, 0);
  if (totalWeight <= 0) return { durationMs: safeDuration, cues: [] };

  const cues: VisemeCue[] = [];
  let offsetMs = 0;

  merged.forEach((unit, index) => {
    const isLast = index === merged.length - 1;
    const duration = isLast
      ? safeDuration - offsetMs
      : Math.round((safeDuration * unit.weight) / totalWeight);
    const clamped = Math.max(0, duration);
    if (clamped > 0) {
      cues.push({ shape: unit.shape, offsetMs, durationMs: clamped });
      offsetMs += clamped;
    }
  });

  if (cues.length === 0) return { durationMs: safeDuration, cues: [] };

  const covered = cues.reduce((sum, cue) => sum + cue.durationMs, 0);
  if (covered !== safeDuration) {
    const last = cues[cues.length - 1];
    last.durationMs = Math.max(0, last.durationMs + (safeDuration - covered));
    if (last.durationMs === 0) cues.pop();
  }

  return { durationMs: safeDuration, cues };
}

/**
 * Mouth timeline for a spoken word, placed at its position in the audio.
 *
 * A provider that reports word timings gives the mouth a real clock: the word
 * is spoken between these offsets, so the shapes belong there and nowhere
 * else.
 */
export function visemeCuesForWord(
  text: string,
  offsetMs: number,
  durationMs: number
): VisemeCue[] {
  if (durationMs <= 0) return [];
  const units = mergeAdjacent(wordUnits(String(text ?? '').toLowerCase()));
  if (units.length === 0) return [];

  const totalWeight = units.reduce((sum, unit) => sum + unit.weight, 0);
  if (totalWeight <= 0) return [];

  const cues: VisemeCue[] = [];
  let elapsed = 0;

  units.forEach((unit, index) => {
    const isLast = index === units.length - 1;
    const span = isLast
      ? durationMs - elapsed
      : Math.round((durationMs * unit.weight) / totalWeight);
    const clamped = Math.max(0, span);
    if (clamped > 0) {
      cues.push({ shape: unit.shape, offsetMs: offsetMs + elapsed, durationMs: clamped });
      elapsed += clamped;
    }
  });

  return cues;
}

/**
 * Mouth timeline built from reported word timings.
 *
 * This is the accurate path: the words carry the timing, and only the mouth
 * shapes inside each word are estimated. A provider that does not report word
 * timings falls back to the whole-line estimate.
 */
export function visemeTimelineFromWords(
  words: ReadonlyArray<{ text: string; offsetMs: number; durationMs: number }>
): VisemeTimeline {
  const cues: VisemeCue[] = [];

  for (const word of words) {
    for (const cue of visemeCuesForWord(word.text, word.offsetMs, word.durationMs)) {
      cues.push(cue);
    }
  }

  cues.sort((a, b) => a.offsetMs - b.offsetMs);
  const durationMs = cues.reduce((end, cue) => Math.max(end, cue.offsetMs + cue.durationMs), 0);
  return { durationMs, cues };
}

/** Mouth shape at a playback position. Outside the timeline the mouth rests. */
export function visemeAt(timeline: VisemeTimeline | null | undefined, timeMs: number): VisemeShape {
  if (!timeline || timeline.cues.length === 0) return 'sil';
  if (timeMs < 0) return 'sil';

  let low = 0;
  let high = timeline.cues.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const cue = timeline.cues[mid];
    if (timeMs < cue.offsetMs) {
      high = mid - 1;
      continue;
    }
    if (timeMs >= cue.offsetMs + cue.durationMs) {
      low = mid + 1;
      continue;
    }
    return cue.shape;
  }

  return 'sil';
}

/**
 * Rough spoken duration for text that has no measured audio duration.
 * Used only when the transport cannot know the real length, so the mouth keeps
 * moving for roughly as long as the line takes.
 */
export function estimateSpeechDurationMs(text: string, speed = 1): number {
  const words = String(text ?? '')
    .split(/\s+/)
    .filter(word => word.length > 0);
  if (words.length === 0) return 0;
  const safeSpeed = speed > 0 ? speed : 1;
  return Math.round((words.length * 340) / safeSpeed);
}

/** Timeline for cues that came from the provider, keeping provider timing. */
export function timelineFromCues(cues: VisemeCue[] | null | undefined): VisemeTimeline {
  if (!cues || cues.length === 0) return { durationMs: 0, cues: [] };
  const durationMs = cues.reduce((end, cue) => Math.max(end, cue.offsetMs + cue.durationMs), 0);
  return { durationMs, cues };
}
