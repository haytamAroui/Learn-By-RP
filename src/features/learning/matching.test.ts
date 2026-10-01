import { describe, expect, it } from 'vitest';
import { matchPhraseInText, normalizeText } from './matching';

describe('normalizeText', () => {
  it('strips punctuation and diacritics', () => {
    // Function words survive normalization; they are dropped later by
    // contentTokens, which is where the stopword list applies.
    expect(normalizeText('¿Tiene leche de avena?')).toBe('tiene leche de avena');
    // Apostrophes split into separate tokens rather than being deleted, so
    // "s'il" becomes "s il". That is intentional: dropping the character
    // entirely would turn "l'homme" into "lhomme".
    expect(normalizeText('Crème brûlée, s’il vous plaît.')).toBe('creme brulee s il vous plait');
  });

  it('collapses whitespace and lowercases', () => {
    expect(normalizeText('  Hola   MUNDO  ')).toBe('hola mundo');
  });

  it('handles non-latin scripts', () => {
    expect(normalizeText('お弁当')).toBe('お弁当');
  });
});

describe('matchPhraseInText', () => {
  describe('exact', () => {
    it('matches the target wording verbatim', () => {
      const result = matchPhraseInText('Un café con leche', 'quiero un café con leche por favor');
      expect(result.verdict).toBe('exact');
      expect(result.score).toBe(1);
    });

    it('matches despite punctuation differences', () => {
      const result = matchPhraseInText('¿Tiene leche de avena?', '¿tiene leche de avena?');
      expect(result.verdict).toBe('exact');
    });
  });

  describe('paraphrase: equivalent wording counts', () => {
    it('accepts a different determiner and inflection', () => {
      const result = matchPhraseInText('Un café con leche', 'quisiera café con leche');
      expect(result.verdict).toBe('paraphrase');
    });

    it('accepts a contraction in French', () => {
      const result = matchPhraseInText('Je voudrais un café', "je voudrais bien un café s'il vous plaît");
      expect(result.verdict).toBe('paraphrase');
    });

    it('accepts a longer utterance that contains the request', () => {
      const result = matchPhraseInText(
        'Quisiera leche de avena',
        'Hola, buenos días. Quesiera preguntarle si tienen leche de avena en el café.'
      );
      expect(result.verdict).toBe('paraphrase');
    });

    it('abstains on a synonym substitution it cannot confirm', () => {
      // "ein Brötchen hätte ich gern" is a legitimate German order for the
      // target, but proving "hätte ich gern" ≡ "möchte" needs semantics this
      // matcher deliberately does not have. Spec §10.4: ambiguous equivalence
      // resolves to unknown for human review, not to a match.
      const result = matchPhraseInText('Ich möchte ein Brötchen', 'ein Brötchen hätte ich gern bitte');
      expect(result.verdict).toBe('ambiguous');
    });
  });

  describe('ambiguous: recorded as unknown, never credited or penalised', () => {
    it('returns ambiguous on partial overlap', () => {
      const result = matchPhraseInText('leche de avena', 'quiero leche, por favor');
      expect(result.verdict).toBe('ambiguous');
    });

    it('does not let a short passage satisfy a longer phrase', () => {
      // "un café" alone is not "un café con leche". The `share` heuristic would
      // otherwise score this 1.0 because the passage is entirely inside the
      // phrase; requiring two overlapping content words prevents that.
      const result = matchPhraseInText('Un café con leche', 'un café por favor');
      expect(result.verdict).not.toBe('paraphrase');
      expect(result.verdict).toBe('ambiguous');
    });
  });

  describe('none', () => {
    it('rejects an unrelated utterance', () => {
      const result = matchPhraseInText('Quisiera un café', '¿A qué hora sale el tren?');
      expect(result.verdict).toBe('none');
      expect(result.score).toBe(0);
    });

    it('rejects a wrong item, even with a perfect sentence', () => {
      // The spec's worked example: a perfect sentence asking for the wrong item
      // must not count as having ordered anything.
      const result = matchPhraseInText('Quisiera un café con leche', 'quisiera un té verde');
      expect(result.verdict).toBe('none');
    });

    it('rejects empty input', () => {
      expect(matchPhraseInText('', 'hola').verdict).toBe('none');
      expect(matchPhraseInText('hola', '').verdict).toBe('none');
    });
  });

  it('does not match on function words alone', () => {
    const result = matchPhraseInText('Un café con leche', 'un café por favor');
    expect(result.verdict).not.toBe('exact');
    expect(result.verdict).not.toBe('paraphrase');
  });
});
