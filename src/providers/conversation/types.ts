import type { ActorResponse } from '../../lib/api';

export interface ConversationTurnInput {
  character: any;
  setting: string;
  learnerGoal: string;
  sceneFacts: any;
  mode: string;
  recentPassages: any[];
  userMessage: string;
  targetLanguage: string;
  explanationLanguage: string;
}

export interface ConversationProvider {
  readonly id: string;
  connect?(): Promise<void>;
  respond(input: ConversationTurnInput): Promise<ActorResponse>;
  cancel?(): void;
  dispose(): void;
}
