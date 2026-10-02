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

type ConsentScope = 'voice' | 'saved_analysis';
type ConsentSnapshot = Partial<
  Record<ConsentScope, { granted: boolean; version: string }>
>;

let localConsentSnapshot: ConsentSnapshot = {};

const GUEST_TOKEN_KEY = 'learnbyrp.guest_access_token.v1';

async function readGuestToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(GUEST_TOKEN_KEY);
  }

  try {
    return await SecureStore.getItemAsync(GUEST_TOKEN_KEY);
  } catch {
    return AsyncStorage.getItem(GUEST_TOKEN_KEY);
  }
}

async function writeGuestToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (token) await AsyncStorage.setItem(GUEST_TOKEN_KEY, token);
    else await AsyncStorage.removeItem(GUEST_TOKEN_KEY);
    return;
  }

  try {
    if (token) await SecureStore.setItemAsync(GUEST_TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(GUEST_TOKEN_KEY);
  } catch {
    if (token) await AsyncStorage.setItem(GUEST_TOKEN_KEY, token);
    else await AsyncStorage.removeItem(GUEST_TOKEN_KEY);
  }
}

async function provisionGuestToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/access/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });

  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload?.token !== 'string' || !payload.token) {
    throw new Error(payload?.error || 'Could not provision bounded guest access');
  }

  await writeGuestToken(payload.token);
  return payload.token;
}

async function guestToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const existing = await readGuestToken();
    if (existing) return existing;
  }

  await writeGuestToken(null);
  return provisionGuestToken();
}

async function authenticatedHeaders(forceRefresh = false): Promise<Record<string, string>> {
  return {
    Authorization: `Bearer ${await guestToken(forceRefresh)}`,
  };
}

async function setServerConsent(
  scope: ConsentScope,
  granted: boolean,
  version: string,
  forceRefresh = false
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/access/consent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await authenticatedHeaders(forceRefresh)),
    },
    body: JSON.stringify({ scope, granted, version }),
  });

  if (response.status === 401 && !forceRefresh) {
    await setServerConsent(scope, granted, version, true);
    return;
  }

  if (!response.ok) {
    const payload: any = await response.json().catch(() => ({}));
    throw new ApiError(
      payload?.error || `Consent sync failed with ${response.status}`,
      response.status,
      payload
    );
  }
}

async function syncKnownConsents(forceRefreshToken = false): Promise<void> {
  let first = true;
  for (const scope of ['voice', 'saved_analysis'] as const) {
    const decision = localConsentSnapshot[scope];
    if (!decision) continue;
    await setServerConsent(
      scope,
      decision.granted,
      decision.version,
      forceRefreshToken && first
    );
    first = false;
  }
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

async function getRequest<T>(
  path: string,
  timeoutMs = 10000,
  authenticated = false
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const init = {
      method: 'GET',
      headers: authenticated ? await authenticatedHeaders() : undefined,
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

function requiredConsentForPath(path: string): ConsentScope | null {
  if (path === '/api/realtime/session') return 'voice';
  if (path === '/api/assessment') return 'saved_analysis';
  return null;
}

async function request<T>(
  path: string,
  body: unknown,
  timeoutMs = 30000,
  retryAuth = true
): Promise<T> {
  const requiredScope = requiredConsentForPath(path);
  if (requiredScope) {
    const decision = localConsentSnapshot[requiredScope];
    if (!decision || decision.granted !== true) {
      throw new ApiError('consent_required', 403, {
        error: 'consent_required',
        scope: requiredScope,
        decided: Boolean(decision),
      });
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const init = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await authenticatedHeaders()),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    } as RequestInit;

    const response = await fetch(`${API_BASE_URL}${path}`, init);

    if (response.status === 401 && retryAuth) {
      clearTimeout(timer);
      await guestToken(true);
      await syncKnownConsents();
      return request<T>(path, body, timeoutMs, false);
    }

    const text = await response.text();
    let parsed: any = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { error: text };
      }
    }

    if (
      response.status === 403 &&
      retryAuth &&
      parsed?.error === 'consent_required' &&
      (parsed?.scope === 'voice' || parsed?.scope === 'saved_analysis')
    ) {
      const decision = localConsentSnapshot[parsed.scope as ConsentScope];
      if (decision) {
        await setServerConsent(
          parsed.scope as ConsentScope,
          decision.granted,
          decision.version
        );
        return request<T>(path, body, timeoutMs, false);
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
  access: {
    ensureGuest: async () => {
      await guestToken();
    },
    setLocalConsentSnapshot: (snapshot: ConsentSnapshot) => {
      localConsentSnapshot = { ...snapshot };
    },
    syncKnownConsents: () => syncKnownConsents(),
    syncConsent: async (
      scope: ConsentScope,
      granted: boolean,
      version: string
    ) => {
      localConsentSnapshot = {
        ...localConsentSnapshot,
        [scope]: { granted, version },
      };
      await setServerConsent(scope, granted, version);
    },
  },
  actorRespond: (body: {
    missionId: string;
    character: any;
    setting: string;
    learnerGoal: string;
    sceneFacts: any;
    allowedActions: string[];
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
};

export { ApiError };
