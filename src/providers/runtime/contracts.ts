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
  speed?: number;
  style?: string;
}

export interface SpeechSynthesisResponse {
  audio: SynthesizedAudio | null;
  fallback: 'none' | 'native';
}

export interface RealtimeSessionRequest {
  missionId: string;
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
