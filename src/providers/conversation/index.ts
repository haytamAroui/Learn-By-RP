import Constants from 'expo-constants';
import { api } from '../../lib/api';
import type { ActorResponse } from '../../lib/api';
import type {
  ConversationProvider,
  ConversationProviderEventListener,
  ConversationTurnInput,
} from './types';
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
  private disposed = false;
  private turnGeneration = 0;

  constructor(
    private readonly primary: ConversationProvider,
    private readonly fallback: ConversationProvider
  ) {
    this.active = primary;
    this.id = `${primary.id}->${fallback.id}`;
  }

  subscribe(listener: ConversationProviderEventListener): () => void {
    const unsubscribePrimary = this.primary.subscribe(listener);
    const unsubscribeFallback =
      this.fallback === this.primary
        ? () => {}
        : this.fallback.subscribe(listener);

    return () => {
      unsubscribePrimary();
      unsubscribeFallback();
    };
  }

  async connect() {
    if (this.disposed) throw new Error('Conversation provider is disposed');
    try {
      if (this.active.connect) await this.active.connect();
      if (this.disposed) throw new Error('Conversation provider is disposed');
    } catch (error) {
      if (this.disposed) throw error;
      if (this.active === this.fallback) throw error;

      console.warn(
        `Conversation provider ${this.primary.id} could not pre-connect; using ${this.fallback.id}:`,
        error
      );
      this.primary.dispose();
      this.active = this.fallback;
      await this.fallback.connect?.();
      if (this.disposed) throw new Error('Conversation provider is disposed');
    }
  }

  async respond(input: ConversationTurnInput): Promise<ActorResponse> {
    if (this.disposed) throw new Error('Conversation provider is disposed');
    const generation = ++this.turnGeneration;
    try {
      const response = await this.active.respond(input);
      if (this.disposed || generation !== this.turnGeneration) throw new Error('Conversation turn cancelled');
      return response;
    } catch (error) {
      if (this.disposed || generation !== this.turnGeneration) throw error;
      if (this.active === this.fallback) throw error;

      console.warn(
        `Conversation provider ${this.primary.id} failed. The turn was not replayed; the next learner retry will use ${this.fallback.id}:`,
        error
      );

      this.primary.dispose();
      this.active = this.fallback;
      throw error;
    }
  }

  cancel() {
    this.turnGeneration += 1;
    this.active.cancel?.();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.primary.dispose();
    if (this.fallback !== this.primary) this.fallback.dispose();
  }
}

class AutoConversationProvider implements ConversationProvider {
  readonly id = 'auto';
  private resolved: ConversationProvider | null = null;
  private listeners = new Set<ConversationProviderEventListener>();
  private unsubscribeResolved: (() => void) | null = null;
  private disposed = false;

  private setResolved(provider: ConversationProvider): ConversationProvider {
    this.resolved = provider;
    this.unsubscribeResolved?.();
    this.unsubscribeResolved = provider.subscribe(event => {
      for (const listener of [...this.listeners]) listener(event);
    });
    return provider;
  }

  subscribe(listener: ConversationProviderEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async resolve(): Promise<ConversationProvider> {
    if (this.disposed) throw new Error('Conversation provider is disposed');
    if (this.resolved) return this.resolved;

    try {
      const capabilities = await api.providers();
      if (this.disposed) throw new Error('Conversation provider is disposed');
      if (capabilities.realtime?.available) {
        return this.setResolved(
          new ResilientConversationProvider(
            new OpenAIRealtimeConversationProvider(),
            new HttpConversationProvider()
          )
        );
      }
    } catch (error) {
      if (this.disposed) throw error;
      console.warn('Provider discovery failed; using HTTP conversation provider:', error);
    }

    return this.setResolved(new HttpConversationProvider());
  }

  async connect() {
    if (this.disposed) throw new Error('Conversation provider is disposed');
    const provider = await this.resolve();
    await provider.connect?.();
  }

  async respond(input: ConversationTurnInput): Promise<ActorResponse> {
    if (this.disposed) throw new Error('Conversation provider is disposed');
    const provider = await this.resolve();
    return provider.respond(input);
  }

  cancel() {
    this.resolved?.cancel?.();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribeResolved?.();
    this.unsubscribeResolved = null;
    this.resolved?.dispose();
    this.resolved = null;
    this.listeners.clear();
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
