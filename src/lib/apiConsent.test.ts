import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiBaseUrl: 'http://test.invalid' } } },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
    removeItem: vi.fn(async () => undefined),
  },
}));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => undefined),
  deleteItemAsync: vi.fn(async () => undefined),
}));
import { api, setApiConsentContext, setApiConsentScope } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const fetchMock = vi.fn();
afterEach(() => vi.unstubAllGlobals());
beforeEach(async () => {
  await AsyncStorage.removeItem('learnbyrp.guest_identity.v1');
  await SecureStore.deleteItemAsync('learnbyrp.guest_identity.v1');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, text: async () => '{}', json: async () => ({ token: 'test-guest-token' }) });
  setApiConsentContext({ voice: 'unknown', savedAnalysis: 'unknown' });
});

describe('assessment consent before network I/O', () => {
  const input = { sessionId: 'session', attemptId: 'attempt', passages: [], supportExposures: [], usefulPhrases: [], language: 'nl-BE' };
  it.each(['unknown', 'denied'] as const)('blocks %s consent without sending transcript data', async state => {
    setApiConsentScope('savedAnalysis', state);
    await expect(api.assessment(input)).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('permits an explicitly granted assessment and blocks the next request immediately after withdrawal', async () => {
    setApiConsentScope('savedAnalysis', 'granted');
    await api.assessment(input);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    setApiConsentScope('savedAnalysis', 'denied');
    await expect(api.assessment(input)).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
