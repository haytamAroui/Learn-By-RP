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
  private disposed = false;
  private activeController: AbortController | null = null;

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
    if (this.disposed) throw new Error('Conversation provider is disposed');
    if (this.activeController) throw new Error('HTTP provider already has a turn in flight');
    const controller = new AbortController();
    this.activeController = controller;
    this.emit({ type: 'response_started', providerId: this.id });
    try {
      const response = await api.actorRespond(input, controller.signal);
      if (this.disposed || controller.signal.aborted) throw new Error('HTTP turn cancelled');
      this.emit({
        type: 'response_completed',
        providerId: this.id,
        response,
      });
      return response;
    } catch (error) {
      if (!this.disposed && !controller.signal.aborted) this.emit({
        type: 'error', providerId: this.id,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      if (this.activeController === controller) this.activeController = null;
    }
  }

  cancel() {
    if (!this.activeController || this.activeController.signal.aborted) return;
    this.activeController.abort();
    this.emit({ type: 'response_cancelled', providerId: this.id });
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.activeController?.abort();
    this.listeners.clear();
  }
}
