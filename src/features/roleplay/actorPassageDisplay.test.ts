import { describe, expect, it } from 'vitest';
import type { Passage } from '../../types';
import { normalizeActorPassageForDisplay } from './actorPassageDisplay';

function passage(speaker: Passage['speaker'], text: string): Passage {
  return {
    id: 'passage-1',
    sessionId: 'session-1',
    attemptId: 'attempt-1',
    speaker,
    revisionKey: 'rev-1',
    assemblyVersion: 1,
    status: 'final',
    text,
    meaning: '',
    modality: 'typed',
    startedAt: '2026-10-04T00:00:00.000Z',
    fragments: [],
  };
}

describe('stored actor passage presentation', () => {
  it('unwraps a previously saved backslash-equals JSON reply and restores its meaning', () => {
    const stored = passage(
      'assistant',
      '\\={"replyText":"Zeker, ik help u graag.","meaning":"Je vous aide volontiers.","proposedAction":"ask_specification"}'
    );

    expect(normalizeActorPassageForDisplay(stored)).toMatchObject({
      text: 'Zeker, ik help u graag.',
      meaning: 'Je vous aide volontiers.',
    });
    // Presentation repair must not mutate the durable transcript record.
    expect(stored.text).toContain('\\={');
  });

  it('leaves learner passages unchanged even if they happen to contain JSON', () => {
    const stored = passage('user', '{"replyText":"learner text"}');

    expect(normalizeActorPassageForDisplay(stored)).toBe(stored);
  });
});
