import { api } from '../../lib/api';
import type {
  ConversationProvider,
  ConversationProviderEvent,
  ConversationProviderEventListener,
  ConversationTurnInput,
} from './types';

export class HttpConversationProvider implements ConversationProvider {
  readonly id = 'http-turn';
  private listeners = new Set<ConversationProviderEventListener>();

  subscribe(listener: ConversationProviderEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: ConversationProviderEvent) {
    for (const listener of [...this.listeners]) listener(event);
  }

  async respond(input: ConversationTurnInput) {
    this.emit({ type: 'response_started', providerId: this.id });
    try {
      const response = await api.actorRespond(input);
      this.emit({
        type: 'response_completed',
        providerId: this.id,
        response,
      });
      return response;
    } catch (error) {
      this.emit({
        type: 'error',
        providerId: this.id,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  dispose() {
    this.listeners.clear();
  }
}
