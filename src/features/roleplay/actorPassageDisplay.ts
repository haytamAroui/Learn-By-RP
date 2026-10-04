import type { Passage } from '../../types';
import { parseActorResponse } from '../../providers/conversation/parseActorResponse';

/** Clean legacy structured actor payloads for presentation without rewriting saved evidence. */
export function normalizeActorPassageForDisplay(passage: Passage): Passage {
  if (passage.speaker !== 'assistant') return passage;

  const text = passage.text.trim();
  const isStructuredPayload = text.startsWith('{') || /^\\*=\s*\{/.test(text);
  if (!isStructuredPayload) return passage;

  const response = parseActorResponse(text);
  if (response.replyText === text && !response.meaning) return passage;

  return {
    ...passage,
    text: response.replyText,
    meaning: passage.meaning || response.meaning || undefined,
  };
}
