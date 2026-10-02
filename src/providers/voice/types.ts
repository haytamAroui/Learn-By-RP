export interface TransportCapabilities {
  speechRateControl: boolean;
  endOfTurnDelayControl: boolean;
  pushToTalk: boolean;
  scriptedLineInjection: boolean;
  blockingToolCalls: boolean;
  transcriptRevisions: boolean;
}

export interface VoiceEvent {
  type:
    | 'listening_start'
    | 'listening_end'
    | 'speech_result'
    | 'audio_level'
    | 'playback_start'
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
  dispose(): void;
}
