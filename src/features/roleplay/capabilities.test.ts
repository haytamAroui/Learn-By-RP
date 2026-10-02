import { describe, expect, it } from 'vitest';
import {
  negotiateRoleplayCapabilities,
  supportedCommunicationChallenges,
} from './capabilities';
import { TransportCapabilities } from '../../providers/voice/types';

const FULL: TransportCapabilities = {
  speechRateControl: true,
  endOfTurnDelayControl: true,
  pushToTalk: true,
  scriptedLineInjection: true,
  blockingToolCalls: true,
  transcriptRevisions: true,
};

describe('roleplay capability negotiation', () => {
  it('uses native capabilities when available', () => {
    expect(
      negotiateRoleplayCapabilities(FULL, {
        wantsSlowSpeech: true,
        wantsLongThinkingTime: true,
        wantsScriptedLineInjection: true,
        requiresBlockingToolCalls: true,
        needsTranscriptRevisions: true,
      })
    ).toMatchObject({
      useSlowSpeech: true,
      thinkingMode: 'native_delay',
      allowScriptedLineInjection: true,
      allowTranscriptRevisions: true,
      allowConsequentialToolActions: true,
      availableCommunicationChallenges: [
        'fast_speech',
        'scripted_mishearing',
      ],
      degradations: [],
    });
  });

  it('falls back to push-to-talk for long thinking time', () => {
    const result = negotiateRoleplayCapabilities(
      { ...FULL, endOfTurnDelayControl: false },
      { wantsLongThinkingTime: true }
    );

    expect(result.thinkingMode).toBe('push_to_talk');
    expect(result.degradations).toContainEqual(
      expect.objectContaining({
        capability: 'endOfTurnDelayControl',
        fallback: 'push_to_talk',
      })
    );
  });

  it('uses tap-when-done when timing and push-to-talk are both unavailable', () => {
    const result = negotiateRoleplayCapabilities(
      {
        ...FULL,
        endOfTurnDelayControl: false,
        pushToTalk: false,
      },
      { wantsLongThinkingTime: true }
    );

    expect(result.thinkingMode).toBe('tap_when_done');
  });

  it('blocks consequential actions without blocking tool-call support', () => {
    const result = negotiateRoleplayCapabilities(
      { ...FULL, blockingToolCalls: false },
      { requiresBlockingToolCalls: true }
    );

    expect(result.allowConsequentialToolActions).toBe(false);
    expect(result.degradations).toContainEqual(
      expect.objectContaining({
        capability: 'blockingToolCalls',
        fallback: 'block_consequential_action',
      })
    );
  });

  it('marks slow speech best-effort when native rate control is absent', () => {
    const result = negotiateRoleplayCapabilities(
      { ...FULL, speechRateControl: false },
      { wantsSlowSpeech: true }
    );

    expect(result.useSlowSpeech).toBe(true);
    expect(result.degradations).toContainEqual(
      expect.objectContaining({
        capability: 'speechRateControl',
        fallback: 'best_effort_local_rate',
      })
    );
  });

  it('exposes fast-speech challenge only with speech-rate control', () => {
    expect(
      supportedCommunicationChallenges({
        ...FULL,
        scriptedLineInjection: false,
      })
    ).toEqual(['fast_speech']);
  });

  it('exposes scripted-mishearing challenge only with scripted-line injection', () => {
    expect(
      supportedCommunicationChallenges({
        ...FULL,
        speechRateControl: false,
      })
    ).toEqual(['scripted_mishearing']);
  });

  it('exposes no transport-dependent challenge when neither required capability exists', () => {
    const result = negotiateRoleplayCapabilities(
      {
        ...FULL,
        speechRateControl: false,
        scriptedLineInjection: false,
      },
      {}
    );

    expect(result.availableCommunicationChallenges).toEqual([]);
  });
});
