import type {
  ProviderRuntimeDescriptor,
  RealtimeSessionDescriptor,
  RealtimeSessionRequest,
  SpeechSynthesisRequest,
  SpeechSynthesisResponse,
} from '../providers/runtime/contracts';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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

type ApiConsentState = 'unknown' | 'granted' | 'denied';

let apiConsentContext: {
  voice: ApiConsentState;
  savedAnalysis: ApiConsentState;
} = {
  voice: 'unknown',
  savedAnalysis: 'unknown',
};

const GUEST_TOKEN_KEY = 'learnbyrp.guest_identity.v1';
let guestTokenPromise: Promise<string> | null = null;

async function guestIdentityToken(): Promise<string> {
  if (!guestTokenPromise) {
    guestTokenPromise = (async () => {
      const cached = Platform.OS === 'web'
        ? await AsyncStorage.getItem(GUEST_TOKEN_KEY)
        : await SecureStore.getItemAsync(GUEST_TOKEN_KEY);
      if (cached) return cached;
      const response = await fetch(`${API_BASE_URL}/api/guest/identity`, { method: 'POST' });
      if (!response.ok) throw new Error('Could not establish a private guest session');
      const payload = await response.json() as { token?: unknown };
      if (typeof payload.token !== 'string' || !payload.token) throw new Error('Guest identity response was invalid');
      if (Platform.OS === 'web') await AsyncStorage.setItem(GUEST_TOKEN_KEY, payload.token);
      else await SecureStore.setItemAsync(GUEST_TOKEN_KEY, payload.token);
      return payload.token;
    })().catch(error => {
      guestTokenPromise = null;
      throw error;
    });
  }
  return guestTokenPromise;
}

export async function providerAuthorizationHeaders(): Promise<Record<string, string>> {
  return { Authorization: `Bearer ${await guestIdentityToken()}` };
}

export function setApiConsentContext(input: {
  voice: ApiConsentState;
  savedAnalysis: ApiConsentState;
}) {
  apiConsentContext = input;
}

export function setApiConsentScope(scope: 'voice' | 'savedAnalysis', state: ApiConsentState) {
  apiConsentContext = { ...apiConsentContext, [scope]: state };
}

function providerHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'x-learnbyrp-consent-voice': apiConsentContext.voice,
    'x-learnbyrp-consent-saved-analysis': apiConsentContext.savedAnalysis,
  };
}

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

async function request<T>(path: string, body: unknown, timeoutMs = 30000, externalSignal?: AbortSignal): Promise<T> {
  if (path === '/api/assessment' && apiConsentContext.savedAnalysis !== 'granted') {
    throw new ApiError('Saved-analysis consent is required', 403);
  }
  const controller = new AbortController();
  if (externalSignal?.aborted) controller.abort(externalSignal.reason);
  const abortFromCaller = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener('abort', abortFromCaller, { once: true });
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = await guestIdentityToken();
    const init = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...providerHeaders(token),
      },
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
    externalSignal?.removeEventListener('abort', abortFromCaller);
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
    missionId: string;
    missionVersion: number;
    sceneId?: string;
    sceneVersion?: number;
    character: any;
    setting: string;
    learnerGoal: string;
    sceneFacts: any;
    allowedActions: string[];
    mode: string;
    recentPassages: any[];
    userMessage: string;
    targetLanguage: string;
    /** Informational on HTTP; server re-derives authority from the pinned scene. */
    speechVariety?: import('../contracts/scene').SpeechVariety;
    explanationLanguage: string;
  }, signal?: AbortSignal) => request<ActorResponse>('/api/actor/respond', body, 30000, signal),

  /**
   * Scene truth is owned by the backend reducer and reached through
   * `SceneMirror`, which carries the actionId and the expected revision. The
   * client does not get to decide what is true in the fiction, so there is no
   * client-side "apply this action" call.
   */
  coachHint: (body: {
    step: string;
    missionId: string;
    targetLanguage: string;
    explanationLanguage: string;
    characterName: string;
    lastAssistantLine: string;
    learnerGoal: string;
    targetSkillId: string;
    targetOpportunityId?: string;
    targetPhraseId?: string;
    targetPhraseForm?: string;
  }) =>
    request<{
      hint: string;
      targetSkillId: string;
      targetOpportunityId?: string;
      targetPhraseId?: string;
    }>('/api/coach/hint', body),

  assessment: (body: {
    sessionId: string;
    attemptId: string;
    /** Lets the server narrow which skills the model may propose. */
    missionId?: string;
    passages: any[];
    supportExposures: any[];
    usefulPhrases: any[];
    language: string;
    /** Runtime-created opportunities the assessor may reference. */
    opportunityInstances?: Array<{
      id: string;
      opportunityId: string;
      skillId: string;
      status: string;
      detection: string;
    }>;
  }) => request<any>('/api/assessment', body, 60000),

  providers: () =>
    getRequest<ProviderRuntimeDescriptor>('/api/providers'),

  synthesizeSpeech: (body: SpeechSynthesisRequest) =>
    request<SpeechSynthesisResponse>('/api/speech/synthesize', body, 12000),

  createRealtimeSession: (body: RealtimeSessionRequest) =>
    request<RealtimeSessionDescriptor>('/api/realtime/session', body, 15000),

  markSessionDeleted: (sessionId: string) =>
    request<{ deleted: true }>('/api/privacy/deletion', { sessionId }, 5000),
};

export { ApiError };
