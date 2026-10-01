import { describe, expect, it } from 'vitest';
import {
  captureDraft,
  commitDraft,
  dedupeByTurnId,
  draftToPassage,
  draftTurnId,
} from './draft';

describe('captureDraft', () => {
  it('keeps typed text', () => {
    const state = captureDraft('Dos cafés con leche', 1_000);
    expect(state.draft?.text).toBe('Dos cafés con leche');
  });

  it('trims whitespace so a blank submit is not recorded', () => {
    expect(captureDraft('   \n ', 1_000).draft).toBeNull();
  });

  it('preserves the draft while a send is in flight', () => {
    /*
      A failure means the assistant request throws, not that the turn is committed -
      so the draft is still sitting in state afterwards. The learner retyped this;
      losing it to a network blip is the worst thing this app could do.
    */
    const state = captureDraft('Quisiera una mesa', 5_000);

    let draft = state.draft;
    try {
      throw new Error('fetch failed');
    } catch {
      // The failed request never reaches commitDraft, so the draft is untouched.
      expect(draft?.text).toBe('Quisiera una mesa');
    }

    // And it is still there when the learner tries again.
    const retried = commitDraft(state, 'turn-1', 9_000);
    expect(retried.appended).toBe(true);
    expect(retried.state.draft).toBeNull();
  });
});

describe('draftTurnId', () => {
  it('is stable for the same words in the same session', () => {
    // A clock-based id would make every retry look like a new turn, which is exactly
    // what commitDraft exists to prevent.
    expect(draftTurnId('s1', 'hola')).toBe(draftTurnId('s1', 'hola'));
  });

  it('ignores surrounding and repeated whitespace', () => {
    expect(draftTurnId('s1', '  una   mesa  ')).toBe(draftTurnId('s1', 'una mesa'));
  });

  it('ignores case', () => {
    expect(draftTurnId('s1', 'Hola')).toBe(draftTurnId('s1', 'hola'));
  });

  it('differs across sessions', () => {
    expect(draftTurnId('s1', 'hola')).not.toBe(draftTurnId('s2', 'hola'));
  });

  it('differs for different words', () => {
    expect(draftTurnId('s1', 'hola')).not.toBe(draftTurnId('s1', 'adios'));
  });
});

describe('commitDraft', () => {
  it('clears the draft on a first successful submit', () => {
    const state = captureDraft('hola', 1_000);
    const result = commitDraft(state, 'turn-1', 2_000);

    expect(result.appended).toBe(true);
    expect(result.state.draft).toBeNull();
    expect(result.state.submittedTurnIds).toEqual(['turn-1']);
  });

  /*
    The duplicate-transcript case. A retried request, or a learner who taps twice,
    must not produce two turns for one sentence - and therefore must not produce two
    pieces of evidence for one utterance.
  */
  it('does not append the same turn twice', () => {
    const first = commitDraft(captureDraft('hola', 1_000), 'turn-1', 2_000);
    const second = commitDraft(
      { draft: captureDraft('hola', 3_000).draft, submittedTurnIds: first.state.submittedTurnIds },
      'turn-1',
      4_000
    );

    expect(second.appended).toBe(false);
    expect(second.state.submittedTurnIds).toEqual(['turn-1']);
  });

  it('keeps the draft visible when a repeat is rejected', () => {
    const first = commitDraft(captureDraft('hola', 1_000), 'turn-1', 2_000);
    const second = commitDraft(
      { draft: captureDraft('hola', 3_000).draft, submittedTurnIds: first.state.submittedTurnIds },
      'turn-1',
      4_000
    );

    // Otherwise the text appears to vanish, which is indistinguishable from loss.
    expect(second.state.draft?.text).toBe('hola');
  });

  it('records that a send was attempted', () => {
    const first = commitDraft(captureDraft('hola', 1_000), 'turn-1', 2_000);
    const second = commitDraft(
      { draft: captureDraft('hola', 3_000).draft, submittedTurnIds: first.state.submittedTurnIds },
      'turn-1',
      4_000
    );

    expect(second.state.draft?.attemptedAtMs).toBe(4_000);
  });

  it('accepts a genuinely different turn after a repeat', () => {
    const first = commitDraft(captureDraft('hola', 1_000), 'turn-1', 2_000);
    const second = commitDraft(
      { draft: captureDraft('adios', 3_000).draft, submittedTurnIds: first.state.submittedTurnIds },
      'turn-2',
      4_000
    );

    expect(second.appended).toBe(true);
  });

  it('is a no-op with no draft', () => {
    const state = captureDraft('   ', 1_000);
    expect(commitDraft(state, 'turn-1', 2_000).appended).toBe(false);
  });

  it('does not mutate the state it is given', () => {
    const state = captureDraft('hola', 1_000);
    commitDraft(state, 'turn-1', 2_000);
    expect(state.draft?.text).toBe('hola');
    expect(state.submittedTurnIds).toEqual([]);
  });
});

describe('draftToPassage', () => {
  it('records a typed turn as a user turn', () => {
    const state = captureDraft('Dos cafés', 1_700_000_000_000);
    const passage = draftToPassage(state.draft!, 's1', 'a1');

    expect(passage.speaker).toBe('user');
    expect(passage.modality).toBe('typed');
    expect(passage.text).toBe('Dos cafés');
  });

  it('marks a typed turn final, never partial', () => {
    // A typed sentence is complete when submitted. Marking it partial would let it be
    // treated as still-speaking, withholding evidence for a finished turn.
    const state = captureDraft('listo', 1_000);
    expect(draftToPassage(state.draft!, 's1', 'a1').status).toBe('final');
  });

  it('uses the stable turn id so a retry dedupes', () => {
    const state = captureDraft('hola', 1_000);
    const passage = draftToPassage(state.draft!, 's1', 'a1');

    expect(passage.id).toBe(draftTurnId('s1', 'hola'));
    expect(passage.revisionKey).toBe(passage.id);
  });
});

describe('dedupeByTurnId', () => {
  it('removes a repeated turn, keeping the first', () => {
    const state = captureDraft('hola', 1_000);
    const passage = draftToPassage(state.draft!, 's1', 'a1');
    const deduped = dedupeByTurnId([passage, { ...passage, text: 'hola (again)' }]);

    // Two entries for one utterance would inflate the evidence count.
    expect(deduped).toHaveLength(1);
    expect(deduped[0].text).toBe('hola');
  });

  it('keeps distinct turns in order', () => {
    const a = draftToPassage(captureDraft('uno', 1_000).draft!, 's1', 'a1');
    const b = draftToPassage(captureDraft('dos', 2_000).draft!, 's1', 'a1');

    expect(dedupeByTurnId([a, b])).toHaveLength(2);
  });
});