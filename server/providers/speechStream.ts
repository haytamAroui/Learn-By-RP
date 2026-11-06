import { splitIntoSpeechChunks } from '../../src/providers/voice/speechChunks';
import { splitWavBase64, wavDurationMs } from '../../src/providers/voice/audioTiming';
import {
  estimateVisemeTimeline,
  visemeTimelineFromWords,
} from '../../src/providers/voice/visemes';
import type {
  SpeechSynthesisChunk,
  SpeechSynthesisRequest,
  SpeechSynthesisResponse,
} from '../../src/providers/runtime/contracts';

export interface SpeechProviderLike {
  id?: string;
  /** The provider can stream, so a line may be spoken one piece at a time. */
  streaming?: boolean;
  synthesize(request: SpeechSynthesisRequest): Promise<SpeechSynthesisResponse>;
}

export interface StreamSpeechOptions {
  /**
   * Synthesise each sentence on its own.
   *
   * This is the fastest way to a first sound, because the first sentence is
   * heard while the rest is still being synthesised. It costs one provider
   * request per sentence, which a metered or free-tier provider may not
   * allow, so it is opt in.
   */
  perSentence?: boolean;
}

/**
 * Share of the line that each sentence is expected to take, by length.
 *
 * The cut points are estimates. The audio is real and the pieces play back to
 * back, so an estimate that is a little off is not noticeable.
 */
function estimateBoundaries(pieces: string[], totalMs: number): number[] {
  const weights = pieces.map(piece => Math.max(1, piece.length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const boundaries: number[] = [];
  let elapsed = 0;

  for (let index = 0; index < pieces.length - 1; index += 1) {
    elapsed += (weights[index] / totalWeight) * totalMs;
    boundaries.push(Math.round(elapsed));
  }

  return boundaries;
}

/**
 * Hand over a spoken line in pieces.
 *
 * The pieces carry their offset within the line, so the client can play them
 * back to back and still run one mouth clock across the line.
 */
export async function streamSynthesizedSpeech(
  provider: SpeechProviderLike,
  request: SpeechSynthesisRequest,
  onChunk: (chunk: SpeechSynthesisChunk) => void,
  options: StreamSpeechOptions = {}
): Promise<void> {
  const pieces = splitIntoSpeechChunks(request.text);
  if (pieces.length === 0) return;

  // A provider that streams can be asked for one piece at a time, so the
  // first sound does not wait for the whole line.
  if (options.perSentence ?? provider.streaming === true) {
    await streamPerSentence(provider, request, pieces, onChunk);
    return;
  }

  await streamFromSingleSynthesis(provider, request, pieces, onChunk);
}

/**
 * One provider request, cut into pieces.
 *
 * A metered provider is charged per request, and a free tier may allow only a
 * handful a day, so the line is synthesised once and the audio is cut. The
 * first piece can then be played while the rest is still on its way.
 */
async function streamFromSingleSynthesis(
  provider: SpeechProviderLike,
  request: SpeechSynthesisRequest,
  pieces: string[],
  onChunk: (chunk: SpeechSynthesisChunk) => void
): Promise<void> {
  const result = await provider.synthesize(request);
  const audio = result.audio;
  if (!audio?.base64) {
    throw new Error('Speech provider returned no audio');
  }

  const totalMs = result.durationMs ?? wavDurationMs(audio.base64) ?? 0;
  const boundaries = estimateBoundaries(pieces, totalMs);
  const cut = boundaries.length > 0 ? splitWavBase64(audio.base64, boundaries) : null;

  if (!cut) {
    // The clip could not be cut, so the line is delivered as one piece.
    onChunk({
      text: request.text,
      audioBase64: audio.base64,
      mimeType: audio.mimeType,
      durationMs: totalMs,
      offsetMs: 0,
      visemes: mouthFor(result, request.text, totalMs),
    });
    return;
  }

  let offsetMs = 0;
  pieces.forEach((piece, index) => {
    const durationMs = index === pieces.length - 1
      ? Math.max(0, totalMs - offsetMs)
      : Math.max(0, boundaries[index] - offsetMs);
    onChunk({
      text: piece,
      audioBase64: cut[index],
      mimeType: audio.mimeType,
      durationMs,
      offsetMs,
      visemes: mouthFor(result, piece, durationMs),
    });
    offsetMs += durationMs;
  });
}

/**
 * One provider request per sentence.
 *
 * The first sound arrives after the first sentence instead of after the whole
 * line. This is the fastest path, and it is the one to use with a provider
 * that streams or has a generous quota.
 */
async function streamPerSentence(
  provider: SpeechProviderLike,
  request: SpeechSynthesisRequest,
  pieces: string[],
  onChunk: (chunk: SpeechSynthesisChunk) => void
): Promise<void> {
  let offsetMs = 0;

  for (const piece of pieces) {
    const result = await provider.synthesize({ ...request, text: piece });
    const audio = result.audio;
    if (!audio?.base64) {
      throw new Error('Speech provider returned no audio');
    }

    const durationMs = result.durationMs ?? wavDurationMs(audio.base64) ?? 0;
    onChunk({
      text: piece,
      audioBase64: audio.base64,
      mimeType: audio.mimeType,
      durationMs,
      offsetMs,
      visemes: mouthFor(result, piece, durationMs),
    });
    offsetMs += durationMs;
  }
}

/**
 * The mouth timeline for a piece.
 *
 * A provider that reports where each word is spoken gives a real clock, and
 * only the shapes inside a word are estimated. Otherwise the whole line is
 * estimated from its length.
 */
function mouthFor(
  result: SpeechSynthesisResponse,
  text: string,
  durationMs: number
): SpeechSynthesisChunk['visemes'] {
  if (result.words && result.words.length > 0) {
    return visemeTimelineFromWords(result.words).cues;
  }
  if (durationMs <= 0) return [];
  return estimateVisemeTimeline(text, durationMs).cues;
}
