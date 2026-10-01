import Constants from 'expo-constants';
import { api } from '../../lib/api';
import type { ActorResponse } from '../../lib/api';
import type { ConversationProvider, ConversationTurnInput } from './types';
import { HttpConversationProvider } from './httpConversationProvider';
import { OpenAIRealtimeConversationProvider } from './openAIRealtimeConversationProvider';

export type ConversationProviderPreference =
  | 'http'
  | 'openai-realtime'
  | 'auto';

function configuredPreference(): ConversationProviderPreference {
  const extra = Constants.expoConfig?.extra?.conversationProvider;
  const raw =
    typeof extra === 'string'
      ? extra
      : process.env.EXPO_PUBLIC_CONVERSATION_PROVIDER;

  if (raw === 'http' || raw === 'openai-realtime' || raw === 'auto') return raw;
  return 'auto';
}

class ResilientConversationProvider implements ConversationProvider {
  readonly id: string;
  private active: ConversationProvider;

  constructor(
    private readonly primary: ConversationProvider,
    private readonly fallback: ConversationProvider
  ) {
    this.active = primary;
    this.id = `${primary.id}->${fallback.id}`;
  }

  async connect() {
    try {
      if (this.active.connect) await this.active.connect();
    } catch (error) {
      if (this.active === this.fallback) throw error;

      console.warn(
        `Conversation provider ${this.primary.id} could not pre-connect; using ${this.fallback.id}:`,
        error
      );
      this.primary.dispose();
      this.active = this.fallback;
      await this.fallback.connect?.();
    }
  }

  async respond(input: ConversationTurnInput): Promise<ActorResponse> {
    try {
      return await this.active.respond(input);
    } catch (error) {
      if (this.active === this.fallback) throw error;

      console.warn(
        `Conversation provider ${this.primary.id} failed; using ${this.fallback.id} for the rest of this session:`,
        error
      );

      this.primary.dispose();
      this.active = this.fallback;
      return this.fallback.respond(input);
    }
  }

  cancel() {
    this.active.cancel?.();
  }

  dispose() {
    this.primary.dispose();
    if (this.fallback !== this.primary) this.fallback.dispose();
  }
}

class AutoConversationProvider implements ConversationProvider {
  readonly id = 'auto';
  private resolved: ConversationProvider | null = null;

  private async resolve(): Promise<ConversationProvider> {
    if (this.resolved) return this.resolved;

    try {
      const capabilities = await api.providers();
      if (capabilities.realtime?.available) {
        this.resolved = new ResilientConversationProvider(
          new OpenAIRealtimeConversationProvider(),
          new HttpConversationProvider()
        );
        return this.resolved;
      }
    } catch (error) {
      console.warn('Provider discovery failed; using HTTP conversation provider:', error);
    }

    this.resolved = new HttpConversationProvider();
    return this.resolved;
  }

  async connect() {
    const provider = await this.resolve();
    await provider.connect?.();
  }

  async respond(input: ConversationTurnInput): Promise<ActorResponse> {
    const provider = await this.resolve();
    return provider.respond(input);
  }

  cancel() {
    this.resolved?.cancel?.();
  }

  dispose() {
    this.resolved?.dispose();
    this.resolved = null;
  }
}

export function createConversationProvider(
  preference: ConversationProviderPreference = configuredPreference()
): ConversationProvider {
  if (preference === 'openai-realtime') {
    return new ResilientConversationProvider(
      new OpenAIRealtimeConversationProvider(),
      new HttpConversationProvider()
    );
  }

  if (preference === 'auto') {
    return new AutoConversationProvider();
  }

  return new HttpConversationProvider();
}
