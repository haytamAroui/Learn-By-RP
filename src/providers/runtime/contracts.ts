import type { VoiceGender } from '../../types';
import type { VisemeCue } from '../voice/visemes';

export type ProviderId =
  | 'gemini'
  | 'openai-realtime'
  | 'openai-compatible'
  | 'native'
  | 'deterministic'
  | (string & {});

export type ProviderCapability =
  | 'structured_text'
  | 'tts'
  | 'realtime_text'
  | 'realtime_audio'
  | 'stt';

export interface ProviderDescriptor {
  id: ProviderId;
  capabilities: ProviderCapability[];
  available: boolean;
  model?: string;
}

export interface ProviderRuntimeDescriptor {
  conversation: ProviderDescriptor;
  speech: ProviderDescriptor;
  realtime?: ProviderDescriptor;
}

export interface SynthesizedAudio {
  provider: ProviderId;
  model?: string;
  voice?: string;
  base64: string;
  mimeType: string;
  sampleRateHz?: number;
}

export interface SpeechSynthesisRequest {
  text: string;
  language: string;
  locale?: string;
  voice?: string;
  voiceGender?: VoiceGender;
  speed?: number;
  style?: string;
}

/**
 * One spoken word and where it sits in the audio.
 *
 * A provider that reports word timings gives the mouth a real clock instead of
 * an estimate, which is what makes lip-sync match the voice.
 */
export interface SpeechWordTiming {
  text: string;
  offsetMs: number;
  durationMs: number;
}

export interface SpeechSynthesisResponse {
  audio: SynthesizedAudio | null;
  fallback: 'none' | 'native';
  /** Mouth timeline for the synthesized clip, when it could be derived. */
  visemes?: VisemeCue[];
  /** Measured length of the synthesized clip in milliseconds. */
  durationMs?: number;
  /** Word timings, when the provider reports them. */
  words?: SpeechWordTiming[];
}

/**
 * One synthesised piece of a spoken line.
 *
 * A line is delivered as an ordered sequence of chunks so the first sound can
 * be played while the rest is still being synthesised.
 */
export interface SpeechSynthesisChunk {
  /** The spoken text of this piece. */
  text: string;
  /** Base64 audio for this piece. */
  audioBase64: string;
  mimeType: string;
  /** Length of this piece in milliseconds. */
  durationMs: number;
  /** Start of this piece within the whole line, in milliseconds. */
  offsetMs: number;
  /** Mouth timeline for this piece, relative to the start of the piece. */
  visemes?: VisemeCue[];
}

export type SpeechSynthesisStreamEvent =
  | { type: 'chunk'; chunk: SpeechSynthesisChunk }
  | { type: 'end' }
  | { type: 'error'; error: string };

export interface RealtimeSessionRequest {
  targetLanguage: string;
  explanationLanguage: string;
  instructions: string;
  voice?: string;
}

export interface RealtimeSessionDescriptor {
  provider: 'openai-realtime';
  transport: 'websocket';
  model: string;
  clientSecret: string;
  expiresAt?: number;
}
