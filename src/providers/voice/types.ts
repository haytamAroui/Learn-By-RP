import type { VisemeCue, VisemeShape } from './visemes';

export interface TransportCapabilities {
  speechRateControl: boolean;
  endOfTurnDelayControl: boolean;
  pushToTalk: boolean;
  scriptedLineInjection: boolean;
  blockingToolCalls: boolean;
  transcriptRevisions: boolean;
}

/**
 * Playback position while provider audio is playing.
 *
 * `durationMs` is 0 when the transport cannot measure the length of the clip.
 * `viseme` is the mouth shape for the current position.
 */
export interface VoicePlaybackProgress {
  currentTimeMs: number;
  durationMs: number;
  viseme: VisemeShape;
}

export interface VoiceEvent {
  type:
    | 'listening_start'
    | 'listening_end'
    | 'speech_result'
    | 'audio_level'
    | 'playback_start'
    | 'playback_progress'
    | 'playback_end'
    | 'error'
    | 'interrupted';
  payload?: any;
}

export interface VoicePlaybackOptions {
  audioBase64?: string;
  mimeType?: string;
  speed?: number;
  lang?: string;
  locale?: string;
  /** Mouth timeline for the clip. When absent the transport estimates one. */
  visemes?: VisemeCue[];
  /** Start of this clip within the whole spoken line, in milliseconds. */
  chunkOffsetMs?: number;
}

export interface VoiceTransport {
  readonly id: string;
  readonly capabilities: TransportCapabilities;
  setLanguage(languageCode: string, preferredLocale?: string): void;
  subscribe(listener: (event: VoiceEvent) => void): () => void;
  startListening(): Promise<boolean>;
  stopListening(): void;
  setMuted(muted: boolean): void;
  stopPlayback(): void;
  playSpeech(text: string, options?: VoicePlaybackOptions): Promise<void>;
  /**
   * Queue a piece of a spoken line.
   *
   * Pieces are played in the order they are queued, back to back, and the
   * returned promise resolves when that piece has finished playing. This is
   * what lets the first sound be heard while the rest of the line is still
   * being synthesised.
   */
  enqueueSpeech(text: string, options?: VoicePlaybackOptions): Promise<void>;
  dispose(): void;
}
