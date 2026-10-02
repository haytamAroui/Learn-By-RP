import { TransportCapabilities } from '../../providers/voice/types';
import type { CommunicationChallengeType } from '../../contracts/scene';

export type { CommunicationChallengeType } from '../../contracts/scene';

export const COMMUNICATION_CHALLENGE_ORDER = [
  'fast_speech',
  'unknown_word',
  'unclear_detail',
  'scripted_mishearing',
  'unexpected_followup',
] as const satisfies readonly CommunicationChallengeType[];

export const COMMUNICATION_CHALLENGE_REQUIREMENTS = {
  fast_speech: ['speechRateControl'],
  unknown_word: ['scriptedLineInjection'],
  unclear_detail: ['scriptedLineInjection'],
  scripted_mishearing: ['scriptedLineInjection'],
  unexpected_followup: ['scriptedLineInjection'],
} as const satisfies Record<
  CommunicationChallengeType,
  readonly (keyof TransportCapabilities)[]
>;

export interface CommunicationChallengeCompatibility {
  challengeType: CommunicationChallengeType;
  requiredCapabilities: readonly (keyof TransportCapabilities)[];
  missingCapabilities: (keyof TransportCapabilities)[];
  supported: boolean;
}

/**
 * Challenge compatibility is a deterministic transport contract.
 *
 * A challenge is eligible only when every required transport capability is
 * available. Keeping requirements as arrays allows a future challenge to depend
 * on more than one transport feature without changing the selection contract.
 */
export function communicationChallengeCompatibility(
  challengeType: CommunicationChallengeType,
  available: TransportCapabilities
): CommunicationChallengeCompatibility {
  const requiredCapabilities =
    COMMUNICATION_CHALLENGE_REQUIREMENTS[challengeType];
  const missingCapabilities = requiredCapabilities.filter(
    capability => available[capability] !== true
  );

  return {
    challengeType,
    requiredCapabilities,
    missingCapabilities,
    supported: missingCapabilities.length === 0,
  };
}

export function isCommunicationChallengeSupported(
  challengeType: CommunicationChallengeType,
  available: TransportCapabilities
): boolean {
  return communicationChallengeCompatibility(challengeType, available).supported;
}

export function supportedCommunicationChallenges(
  available: TransportCapabilities
): CommunicationChallengeType[] {
  return COMMUNICATION_CHALLENGE_ORDER.filter(challengeType =>
    isCommunicationChallengeSupported(challengeType, available)
  );
}

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
  /**
   * Transport-dependent communication challenges that may be surfaced by the
   * pedagogy/UI. Unsupported challenge types never enter this list.
   */
  availableCommunicationChallenges: CommunicationChallengeType[];
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
    availableCommunicationChallenges:
      supportedCommunicationChallenges(available),
    degradations,
  };
}
