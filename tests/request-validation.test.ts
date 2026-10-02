import { describe, expect, it } from 'vitest';
import {
  validateActorRequest,
  validateAssessmentRequest,
  validateCoachRequest,
  validateRealtimeSessionRequest,
  validateSpeechRequest,
} from '../server/security/requestValidation';

describe('AI request schemas', () => {
  it('accepts a bounded actor request and rejects missing or oversized input', () => {
    expect(
      validateActorRequest({
        missionId: 'mission-fr-boulangerie',
        userMessage: 'Bonjour',
        recentPassages: [],
        allowedActions: [],
      }).ok
    ).toBe(true);

    expect(validateActorRequest({}).ok).toBe(false);
    expect(
      validateActorRequest({
        missionId: 'mission-fr-boulangerie',
        userMessage: 'x',
        recentPassages: [
          {
            id: 'p1',
            revisionKey: 'r1',
            speaker: 'user',
            text: 'x'.repeat(8001),
          },
        ],
      }).ok
    ).toBe(false);
  });

  it('requires assessment provenance fields and bounds transcript size', () => {
    expect(
      validateAssessmentRequest({
        sessionId: 's1',
        attemptId: 'a1',
        passages: [],
        usefulPhrases: [],
      }).ok
    ).toBe(true);

    expect(
      validateAssessmentRequest({
        passages: [],
      }).ok
    ).toBe(false);

    expect(
      validateAssessmentRequest({
        sessionId: 's1',
        attemptId: 'a1',
        passages: new Array(201).fill({
          id: 'p',
          revisionKey: 'r',
          speaker: 'user',
          text: 'hello',
        }),
      }).ok
    ).toBe(false);
  });

  it('bounds speech text and speed', () => {
    expect(
      validateSpeechRequest({
        text: 'Goedemorgen',
        language: 'nl',
        speed: 1,
      }).ok
    ).toBe(true);

    expect(
      validateSpeechRequest({
        text: 'x'.repeat(4001),
        speed: 2,
      }).ok
    ).toBe(false);
  });

  it('bounds realtime instructions and coach steps', () => {
    expect(
      validateRealtimeSessionRequest({
        targetLanguage: 'fr',
        instructions: 'roleplay',
      }).ok
    ).toBe(true);
    expect(
      validateRealtimeSessionRequest({
        instructions: 'x'.repeat(6001),
      }).ok
    ).toBe(false);

    expect(
      validateCoachRequest({
        missionId: 'm1',
        targetSkillId: 'skill-1',
        step: 'intent_hint',
      }).ok
    ).toBe(true);
    expect(
      validateCoachRequest({
        missionId: 'm1',
        targetSkillId: 'skill-1',
        step: 'invent_answers',
      }).ok
    ).toBe(false);
  });
});
