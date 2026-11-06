/**
 * Splitting a spoken line into pieces that can be synthesised and played one
 * after another.
 *
 * A tutor line that arrives as one clip is heard only after the whole line has
 * been synthesised. Synthesising in pieces lets the first sound arrive while
 * the rest is still being prepared, which is the difference between a reply
 * that feels instant and one that feels like a wait.
 */
const SENTENCE_PATTERN = /[^.!?…]*[.!?…]+|[^.!?…]+$/g;

/** A piece longer than this is split again at a word boundary. */
export const DEFAULT_MAX_CHUNK_CHARS = 140;

function splitLongSentence(sentence: string, maxChars: number): string[] {
  const words = sentence.split(' ').filter(word => word.length > 0);
  const parts: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars) {
      if (current) parts.push(current);
      current = word;
      continue;
    }
    current = candidate;
  }

  if (current) parts.push(current);
  return parts;
}

/**
 * Break a line into speakable pieces.
 *
 * Every sentence is its own piece, because a piece is a synthesis call and
 * the first sound cannot be heard before the first piece exists. A sentence
 * that is too long for one clip is split at a word boundary rather than
 * mid-word.
 */
export function splitIntoSpeechChunks(
  text: string,
  maxChars: number = DEFAULT_MAX_CHUNK_CHARS
): string[] {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const sentences = (normalized.match(SENTENCE_PATTERN) ?? [])
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);

  const chunks: string[] = [];

  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      chunks.push(...splitLongSentence(sentence, maxChars));
      continue;
    }
    chunks.push(sentence);
  }

  return chunks;
}
