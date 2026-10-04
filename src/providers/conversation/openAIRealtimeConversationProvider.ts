import type { ActorResponse } from '../../lib/api';
import { api } from '../../lib/api';
import { actorInstructions } from './actorInstructions';
import { parseActorResponse } from './parseActorResponse';
import type {
  ConversationProvider,
  ConversationProviderEvent,
  ConversationProviderEventListener,
  ConversationTurnInput,
} from './types';

interface RealtimeSocket {
  readonly readyState: number;
  send(data: string): void;
  close(): void;
  onopen: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onclose: ((event: any) => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
}

interface PendingTurn {
  resolve: (response: ActorResponse) => void;
  reject: (error: Error) => void;
  text: string;
  timer: ReturnType<typeof setTimeout>;
}

function responseDoneText(event: any): string {
  const outputs = Array.isArray(event?.response?.output) ? event.response.output : [];
  for (const item of outputs) {
    const parts = Array.isArray(item?.content) ? item.content : [];
    for (const part of parts) {
      if (part?.type === 'output_text' && typeof part.text === 'string' && part.text.trim()) {
        return part.text;
      }
    }
  }
  return '';
}

/**
 * OpenAI Realtime used as a persistent text-turn conversation brain.
 *
 * We intentionally keep microphone capture and speech playback outside this
 * provider. That lets Expo Go use native STT today, Gemini/native TTS for output,
 * and a future raw-PCM/WebRTC adapter without changing LiveSessionView.
 */
export class OpenAIRealtimeConversationProvider implements ConversationProvider {
  readonly id = 'openai-realtime';

  private socket: RealtimeSocket | null = null;
  private pending: PendingTurn | null = null;
  private listeners = new Set<ConversationProviderEventListener>();
  private connected = false;
  private connectionGeneration = 0;
  private connectPromise: Promise<void> | null = null;
  private lastInstructions = '';
  private disposed = false;
  private connectGeneration = 0;

  subscribe(listener: ConversationProviderEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: ConversationProviderEvent) {
    for (const listener of [...this.listeners]) {
      try {
        listener(event);
      } catch (error) {
        console.warn('Conversation event listener failed:', error);
      }
    }
  }

  private responseId(event: any): string | undefined {
    if (typeof event?.response_id === 'string') return event.response_id;
    if (typeof event?.response?.id === 'string') return event.response.id;
    return undefined;
  }

  private retireSocket(socket: RealtimeSocket | null = this.socket) {
    if (!socket || this.socket !== socket) return;
    this.connectGeneration += 1;
    this.socket = null;
    this.connected = false;
    this.connectPromise = null;
    try { socket.close(); } catch { /* ignore */ }
  }

  async connect(): Promise<void> {
    if (this.disposed) throw new Error('Realtime provider is disposed');
    if (this.connected && this.socket?.readyState === WebSocket.OPEN) return;
    if (this.connectPromise) return this.connectPromise;

    const generation = ++this.connectGeneration;
    const connecting = this.openConnection(generation).finally(() => {
      if (this.connectPromise === connecting) this.connectPromise = null;
    });
    this.connectPromise = connecting;
    return connecting;
  }

  private async openConnection(generation: number): Promise<void> {
    const session = await api.createRealtimeSession({
      targetLanguage: 'auto',
      explanationLanguage: 'auto',
      instructions: 'Roleplay conversation session.',
    });
    if (this.disposed || generation !== this.connectGeneration) {
      throw new Error('Realtime connection was cancelled');
    }

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(session.model)}`,
        ['realtime', `openai-insecure-api-key.${session.clientSecret}`]
      );
      this.socket = ws as unknown as RealtimeSocket;
      let settled = false;
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      };

      const timer = setTimeout(() => {
        try {
          ws.close();
        } catch {
          // ignore
        }
        fail(new Error('Realtime connection timed out'));
      }, 10000);

      ws.onopen = () => {
        if (this.disposed || generation !== this.connectGeneration) {
          try { ws.close(); } catch { /* ignore */ }
          fail(new Error('Realtime connection was cancelled'));
          return;
        }
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.connected = true;
        this.connectionGeneration += 1;
        this.emit({
          type: 'connected',
          providerId: this.id,
          connectionGeneration: this.connectionGeneration,
        });
        resolve();
      };

      ws.onerror = () => {
        if (generation !== this.connectGeneration || this.disposed) {
          fail(new Error('Realtime connection was cancelled'));
          return;
        }
        clearTimeout(timer);
        this.connected = false;
        this.emit({
          type: 'error',
          providerId: this.id,
          message: 'Realtime connection failed',
        });
        fail(new Error('Realtime connection failed'));
      };

      ws.onclose = () => {
        if (generation !== this.connectGeneration || this.disposed) {
          fail(new Error('Realtime connection was cancelled'));
          return;
        }
        this.connected = false;
        this.emit({
          type: 'disconnected',
          providerId: this.id,
          connectionGeneration: this.connectionGeneration,
        });
        if (this.pending) {
          clearTimeout(this.pending.timer);
          this.pending.reject(new Error('Realtime connection closed'));
          this.pending = null;
        }
        if (!settled) fail(new Error('Realtime connection closed'));
      };

      ws.onmessage = event => {
        if (!this.disposed && generation === this.connectGeneration) this.handleMessage(event.data);
      };
    });
  }

  async respond(input: ConversationTurnInput): Promise<ActorResponse> {
    if (this.disposed) throw new Error('Realtime provider is disposed');
    await this.connect();
    const ws = this.socket;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('Realtime connection is not open');
    }
    if (this.pending) {
      throw new Error('Realtime provider already has a turn in flight');
    }

    const instructions = actorInstructions(input);
    if (instructions !== this.lastInstructions) {
      ws.send(
        JSON.stringify({
          type: 'session.update',
          session: {
            type: 'realtime',
            output_modalities: ['text'],
            instructions,
          },
        })
      );
      this.lastInstructions = instructions;
    }

    ws.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: input.userMessage }],
        },
      })
    );

    ws.send(
      JSON.stringify({
        type: 'response.create',
        response: {
          output_modalities: ['text'],
        },
      })
    );

    return new Promise<ActorResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        const pending = this.pending;
        if (!pending) return;
        this.pending = null;
        pending.reject(new Error('Realtime response timed out'));
        this.retireSocket(ws);
      }, 30000);

      this.pending = { resolve, reject, text: '', timer };
    });
  }

  private handleMessage(raw: unknown) {
    if (typeof raw !== 'string') return;

    let event: any;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }

    if (!this.pending) return;

    if (event.type === 'response.created') {
      this.emit({
        type: 'response_started',
        providerId: this.id,
        responseId: this.responseId(event),
      });
      return;
    }

    if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
      this.pending.text += event.delta;
      this.emit({
        type: 'response_text_delta',
        providerId: this.id,
        responseId: this.responseId(event),
        delta: event.delta,
      });
      return;
    }

    if (event.type === 'response.output_text.done') {
      const text =
        typeof event.text === 'string' && event.text.trim()
          ? event.text
          : this.pending.text;
      const pending = this.pending;
      this.pending = null;
      clearTimeout(pending.timer);
      const response = parseActorResponse(text);
      this.emit({
        type: 'response_completed',
        providerId: this.id,
        responseId: this.responseId(event),
        response,
      });
      pending.resolve(response);
      return;
    }

    if (event.type === 'response.done') {
      const pending = this.pending;
      this.pending = null;
      clearTimeout(pending.timer);
      const text = pending.text.trim() || responseDoneText(event).trim();
      if (text) {
        const response = parseActorResponse(text);
        this.emit({
          type: 'response_completed',
          providerId: this.id,
          responseId: this.responseId(event),
          response,
        });
        pending.resolve(response);
      } else {
        const message = 'Realtime response completed without text';
        this.emit({
          type: 'error',
          providerId: this.id,
          responseId: this.responseId(event),
          message,
        });
        pending.reject(new Error(message));
      }
      return;
    }

    if (event.type === 'error') {
      const pending = this.pending;
      this.pending = null;
      clearTimeout(pending.timer);
      const message =
        event.error?.message || 'Realtime provider returned an error';
      this.emit({
        type: 'error',
        providerId: this.id,
        responseId: this.responseId(event),
        message,
      });
      pending.reject(new Error(message));
      this.retireSocket();
    }
  }

  cancel() {
    const hadPendingTurn = Boolean(this.pending);
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ type: 'response.cancel' }));
      } catch {
        // ignore
      }
    }
    if (this.pending) {
      clearTimeout(this.pending.timer);
      this.pending.reject(new Error('Realtime turn cancelled'));
      this.pending = null;
      this.emit({
        type: 'response_cancelled',
        providerId: this.id,
      });
    }
    // A cancelled response may still produce delayed events. Retire its socket
    // so none of those events can be mistaken for the next turn's response.
    if (hadPendingTurn) {
      const socket = this.socket;
      this.connectGeneration += 1;
      this.socket = null;
      this.connected = false;
      this.connectPromise = null;
      try { socket?.close(); } catch { /* ignore */ }
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.connectGeneration += 1;
    this.cancel();
    try {
      this.socket?.close();
    } catch {
      // ignore
    }
    this.socket = null;
    this.connected = false;
    this.connectPromise = null;
    this.listeners.clear();
  }
}
