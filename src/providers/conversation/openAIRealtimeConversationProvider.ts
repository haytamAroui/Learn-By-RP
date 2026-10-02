import type { ActorResponse } from '../../lib/api';
import { api } from '../../lib/api';
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

function actorInstructions(input: ConversationTurnInput): string {
  const characterName = input.character?.name || 'Character';
  const role = input.character?.role || 'conversation partner';
  const boundaries = Array.isArray(input.character?.knowledgeBoundary)
    ? input.character.knowledgeBoundary.join('; ')
    : '';
  const recentPassages = (input.recentPassages || []).slice(-5);
  const contextPassages =
    recentPassages.at(-1)?.speaker === 'user' &&
    recentPassages.at(-1)?.text?.trim() === input.userMessage.trim()
      ? recentPassages.slice(0, -1)
      : recentPassages;
  const recentContext = contextPassages.map(
      passage =>
        `${passage.speaker === 'user' ? 'Learner' : characterName}: ${passage.text}`
    )
    .join('\n');

  return `You are roleplaying as ${characterName} (${role}).
Setting: ${input.setting}.
Learner goal: ${input.learnerGoal}.
Mode: ${input.mode}.
Character speaking style: ${input.character?.voiceStyle || 'natural and conversational'}.
Current scene facts: ${JSON.stringify(input.sceneFacts || {})}.
Speak naturally and briefly in ${input.targetLanguage}.
Stay in character and respect these knowledge boundaries: ${boundaries || 'Only know what the character reasonably knows.'}
Never act as a tutor, coach, evaluator, or grammar teacher. Help and correction belong to a separate private coach.
You may propose only these authored scene actions: ${input.allowedActions.length ? input.allowedActions.join(', ') : '(none)'}.
Recent context:
${recentContext || '(start of conversation)'}.

Return ONLY a compact JSON object:
{"replyText":"1-2 natural spoken sentences in ${input.targetLanguage}","meaning":"${input.explanationLanguage} translation","proposedAction":null}

If a scene action is clearly required, proposedAction may use exactly one name from the authored allowlist above. If no listed action fits, return null.
Never invent scene facts, actions, coaching, evidence, or learner evaluation. Never include markdown.`;
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

function parseActorResponse(raw: string): ActorResponse {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return {
      replyText: typeof parsed.replyText === 'string' ? parsed.replyText : trimmed,
      meaning: typeof parsed.meaning === 'string' ? parsed.meaning : '',
      proposedAction:
        parsed.proposedAction && typeof parsed.proposedAction.name === 'string'
          ? parsed.proposedAction
          : null,
    };
  } catch {
    return {
      replyText: trimmed.replace(/^["'`]+|["'`]+$/g, ''),
      meaning: '',
      proposedAction: null,
    };
  }
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

  async connect(): Promise<void> {
    if (this.connected && this.socket?.readyState === WebSocket.OPEN) return;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = this.openConnection().finally(() => {
      this.connectPromise = null;
    });
    return this.connectPromise;
  }

  private async openConnection(): Promise<void> {
    const session = await api.createRealtimeSession({
      targetLanguage: 'auto',
      explanationLanguage: 'auto',
      instructions: 'Roleplay conversation session.',
    });

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(session.model)}`,
        ['realtime', `openai-insecure-api-key.${session.clientSecret}`]
      );
      this.socket = ws as unknown as RealtimeSocket;

      const timer = setTimeout(() => {
        try {
          ws.close();
        } catch {
          // ignore
        }
        reject(new Error('Realtime connection timed out'));
      }, 10000);

      ws.onopen = () => {
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
        clearTimeout(timer);
        this.connected = false;
        this.emit({
          type: 'error',
          providerId: this.id,
          message: 'Realtime connection failed',
        });
        reject(new Error('Realtime connection failed'));
      };

      ws.onclose = () => {
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
      };

      ws.onmessage = event => this.handleMessage(event.data);
    });
  }

  async respond(input: ConversationTurnInput): Promise<ActorResponse> {
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
        if (this.pending) this.pending = null;
        reject(new Error('Realtime response timed out'));
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
    }
  }

  cancel() {
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
  }

  dispose() {
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
