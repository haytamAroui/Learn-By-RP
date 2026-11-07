/**
 * Caption word segmentation for LearnByRP.
 * Adapted from the Mural core caption linking pattern.
 *
 * Preserves exact text, whitespace, and punctuation for display,
 * while extracting clean word tokens for interactive tap-to-lookup.
 */

export interface CaptionSegment {
  text: string;
  lookup?: string;
}

const PUNCTUATION_REGEX = /^[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»—–]+|[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»—–]+$/g;
const LETTER_REGEX = /\p{L}/u;

/**
 * Splits caption text into display segments with extractable lookup words.
 */
export function segmentCaptionWords(text: string): CaptionSegment[] {
  if (!text) return [];

  const segments: CaptionSegment[] = [];
  let run = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isWhitespace = /\s/.test(char);

    if (run.length > 0) {
      const lastIsWhitespace = /\s/.test(run[run.length - 1]);
      if (lastIsWhitespace !== isWhitespace) {
        segments.push(createSegment(run));
        run = '';
      }
    }
    run += char;
  }

  if (run.length > 0) {
    segments.push(createSegment(run));
  }

  return segments;
}

function createSegment(text: string): CaptionSegment {
  const cleanWord = text.replace(PUNCTUATION_REGEX, '').trim();
  const hasLetters = LETTER_REGEX.test(cleanWord);
  return {
    text,
    lookup: hasLetters ? cleanWord : undefined,
  };
}
