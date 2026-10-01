import { api } from '../../lib/api';
import type { ConversationProvider, ConversationTurnInput } from './types';

export class HttpConversationProvider implements ConversationProvider {
  readonly id = 'http-turn';

  respond(input: ConversationTurnInput) {
    return api.actorRespond(input);
  }

  dispose() {
    // Stateless provider.
  }
}
