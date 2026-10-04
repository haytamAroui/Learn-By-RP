import type { ActorResponse } from '../../lib/api';

/** Parse the text-only actor payload returned by OpenAI Realtime. */
export function parseActorResponse(raw: string): ActorResponse {
  const trimmed = raw.trim();
  // Some Realtime responses frame a structured object as `={...}`. Treat the
  // equals sign as a wrapper only when it is immediately followed by JSON;
  // otherwise preserve it as ordinary reply text.
  const jsonCandidate = trimmed.replace(/^\\*=\s*(?=\{)/, '');
  try {
    const parsed = JSON.parse(jsonCandidate);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Actor response is not an object');
    }
    return {
      replyText: typeof parsed.replyText === 'string' ? parsed.replyText : trimmed,
      meaning: typeof parsed.meaning === 'string' ? parsed.meaning : '',
      proposedAction:
        parsed.proposedAction && typeof parsed.proposedAction.name === 'string'
          ? parsed.proposedAction
          : null,
    };
  } catch {
    return {
      replyText: trimmed.replace(/^["'`]+|["'`]+$/g, ''),
      meaning: '',
      proposedAction: null,
    };
  }
}
