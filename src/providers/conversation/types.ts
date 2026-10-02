import type { ActorResponse } from '../../lib/api';

export interface ConversationTurnInput {
  missionId: string;
  character: any;
  setting: string;
  learnerGoal: string;
  sceneFacts: any;
  /** Authored action names only; actor may propose no other action. */
  allowedActions: string[];
  mode: string;
  recentPassages: any[];
  userMessage: string;
  targetLanguage: string;
  explanationLanguage: string;
}

/**
 * Normalized actor-transport events.
 *
 * Realtime providers expose transport progress through this contract instead of
 * forcing the session coordinator to infer lifecycle from a final text promise.
 * HTTP remains a valid adapter by emitting coarse started/completed/error events.
 */
export type ConversationProviderEvent =
  | {
      type: 'connected';
      providerId: string;
      connectionGeneration?: number;
    }
  | {
      type: 'disconnected';
      providerId: string;
      connectionGeneration?: number;
    }
  | {
      type: 'response_started';
      providerId: string;
      responseId?: string;
    }
  | {
      type: 'response_text_delta';
      providerId: string;
      responseId?: string;
      delta: string;
    }
  | {
      type: 'response_completed';
      providerId: string;
      responseId?: string;
      response: ActorResponse;
    }
  | {
      type: 'response_cancelled';
      providerId: string;
      responseId?: string;
    }
  | {
      type: 'error';
      providerId: string;
      responseId?: string;
      message: string;
    };

export type ConversationProviderEventListener = (
  event: ConversationProviderEvent
) => void;

export interface ConversationProvider {
  readonly id: string;
  connect?(): Promise<void>;
  subscribe(listener: ConversationProviderEventListener): () => void;
  respond(input: ConversationTurnInput): Promise<ActorResponse>;
  cancel?(): void;
  dispose(): void;
}
