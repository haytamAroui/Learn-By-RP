import { TransportCapabilities } from '../../providers/voice/types';

export interface RoleplayCapabilityRequest {
  wantsSlowSpeech?: boolean;
  wantsLongThinkingTime?: boolean;
  wantsScriptedLineInjection?: boolean;
  requiresBlockingToolCalls?: boolean;
  needsTranscriptRevisions?: boolean;
}

export interface CapabilityDegradation {
  capability: keyof TransportCapabilities;
  requested: boolean;
  available: boolean;
  fallback:
    | 'best_effort_local_rate'
    | 'push_to_talk'
    | 'tap_when_done'
    | 'disable_challenge'
    | 'block_consequential_action'
    | 'none';
}

export interface NegotiatedRoleplayCapabilities {
  useSlowSpeech: boolean;
  thinkingMode: 'native_delay' | 'push_to_talk' | 'tap_when_done' | 'default';
  allowScriptedLineInjection: boolean;
  allowTranscriptRevisions: boolean;
  allowConsequentialToolActions: boolean;
  degradations: CapabilityDegradation[];
}

/**
 * Pedagogy requests capabilities; transport only reports what it can do.
 * Missing capabilities degrade the interaction mode, never the evidence rules.
 */
export function negotiateRoleplayCapabilities(
  available: TransportCapabilities,
  request: RoleplayCapabilityRequest
): NegotiatedRoleplayCapabilities {
  const degradations: CapabilityDegradation[] = [];

  let useSlowSpeech = false;
  if (request.wantsSlowSpeech) {
    useSlowSpeech = true;
    if (!available.speechRateControl) {
      degradations.push({
        capability: 'speechRateControl',
        requested: true,
        available: false,
        fallback: 'best_effort_local_rate',
      });
    }
  }

  let thinkingMode: NegotiatedRoleplayCapabilities['thinkingMode'] = 'default';
  if (request.wantsLongThinkingTime) {
    if (available.endOfTurnDelayControl) {
      thinkingMode = 'native_delay';
    } else if (available.pushToTalk) {
      thinkingMode = 'push_to_talk';
      degradations.push({
        capability: 'endOfTurnDelayControl',
        requested: true,
        available: false,
        fallback: 'push_to_talk',
      });
    } else {
      thinkingMode = 'tap_when_done';
      degradations.push({
        capability: 'endOfTurnDelayControl',
        requested: true,
        available: false,
        fallback: 'tap_when_done',
      });
    }
  }

  const allowScriptedLineInjection =
    !request.wantsScriptedLineInjection || available.scriptedLineInjection;
  if (request.wantsScriptedLineInjection && !available.scriptedLineInjection) {
    degradations.push({
      capability: 'scriptedLineInjection',
      requested: true,
      available: false,
      fallback: 'disable_challenge',
    });
  }

  const allowTranscriptRevisions =
    !request.needsTranscriptRevisions || available.transcriptRevisions;
  if (request.needsTranscriptRevisions && !available.transcriptRevisions) {
    degradations.push({
      capability: 'transcriptRevisions',
      requested: true,
      available: false,
      fallback: 'disable_challenge',
    });
  }

  const allowConsequentialToolActions =
    !request.requiresBlockingToolCalls || available.blockingToolCalls;
  if (request.requiresBlockingToolCalls && !available.blockingToolCalls) {
    degradations.push({
      capability: 'blockingToolCalls',
      requested: true,
      available: false,
      fallback: 'block_consequential_action',
    });
  }

  return {
    useSlowSpeech,
    thinkingMode,
    allowScriptedLineInjection,
    allowTranscriptRevisions,
    allowConsequentialToolActions,
    degradations,
  };
}
