import type {
  ProviderRuntimeDescriptor,
  RealtimeSessionDescriptor,
  RealtimeSessionRequest,
  SpeechSynthesisRequest,
  SpeechSynthesisResponse,
} from '../providers/runtime/contracts';
import Constants, { ExecutionEnvironment } from 'expo-constants';

function resolveBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof fromExtra === 'string' && fromExtra.trim()) {
    return fromExtra.trim().replace(/\/+$/, '');
  }

  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/+$/, '');
  }

  // Metro serves the web build from the same host as the API in local dev.
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return 'https://YOUR-DEPLOYED-BACKEND.example.com';
  }

  return 'http://localhost:3000';
}

export const API_BASE_URL = resolveBaseUrl();

class ApiError extends Error {
  status: number;
  payload: any;

  constructor(message: string, status: number, payload?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function getRequest<T>(path: string, timeoutMs = 10000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const init = {
      method: 'GET',
      signal: controller.signal,
    } as RequestInit;

    const response = await fetch(`${API_BASE_URL}${path}`, init);

    const text = await response.text();
    const parsed = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new ApiError(
        parsed?.error || `Request to ${path} failed with ${response.status}`,
        response.status,
        parsed
      );
    }

    return parsed as T;
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(path: string, body: unknown, timeoutMs = 30000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const init = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    } as RequestInit;

    const response = await fetch(`${API_BASE_URL}${path}`, init);

    const text = await response.text();
    let parsed: any = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { error: text };
      }
    }

    if (!response.ok) {
      throw new ApiError(
        parsed?.error || `Request to ${path} failed with ${response.status}`,
        response.status,
        parsed
      );
    }

    return parsed as T;
  } finally {
    clearTimeout(timer);
  }
}

export interface ActorAction {
  name: string;
  payload?: Record<string, any>;
}

export interface ActorResponse {
  replyText: string;
  meaning: string;
  proposedAction: ActorAction | null;
  audioBase64?: string;
  audioMimeType?: string;
}

export const api = {
  actorRespond: (body: {
    character: any;
    setting: string;
    learnerGoal: string;
    sceneFacts: any;
    mode: string;
    recentPassages: any[];
    userMessage: string;
    targetLanguage: string;
    explanationLanguage: string;
  }) => request<ActorResponse>('/api/actor/respond', body),

  /**
   * Scene truth is owned by the backend reducer and reached through
   * `SceneMirror`, which carries the actionId and the expected revision. The
   * client does not get to decide what is true in the fiction, so there is no
   * client-side "apply this action" call.
   */
  coachHint: (body: {
    step: string;
    targetLanguage: string;
    explanationLanguage: string;
    characterName: string;
    lastAssistantLine: string;
    learnerGoal: string;
  }) => request<{ hint: string }>('/api/coach/hint', body),

  assessment: (body: {
    sessionId: string;
    attemptId: string;
    /** Lets the server narrow which skills the model may propose. */
    missionId?: string;
    passages: any[];
    supportExposures: any[];
    usefulPhrases: any[];
    language: string;
  }) => request<any>('/api/assessment', body, 60000),

  providers: () =>
    getRequest<ProviderRuntimeDescriptor>('/api/providers'),

  synthesizeSpeech: (body: SpeechSynthesisRequest) =>
    request<SpeechSynthesisResponse>('/api/speech/synthesize', body, 12000),

  createRealtimeSession: (body: RealtimeSessionRequest) =>
    request<RealtimeSessionDescriptor>('/api/realtime/session', body, 15000),
};

export { ApiError };
