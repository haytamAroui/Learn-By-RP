/**
 * Deterministic text-equivalence matching for phrase evidence.
 *
 * Purpose: decide whether a learner's utterance counts as using a target phrase,
 * without trusting the model's judgement and without requiring an exact string
 * match. A clear paraphrase is real production; a coincidence is not.
 *
 * The result is a verdict the caller can act on, including `ambiguous`, which the
 * learning core records as `unknown` rather than crediting or penalising.
 */

export type MatchVerdict = 'exact' | 'paraphrase' | 'ambiguous' | 'none';

export interface MatchResult {
  verdict: MatchVerdict;
  /** 0..1, overlap strength. Only meaningful for exact/paraphrase/ambiguous. */
  score: number;
  /** Best passage text considered, useful for quoting evidence back. */
  matchedText: string | null;
}

/** Content words below this length carry little signal for equivalence. */
const MIN_CONTENT_TOKEN_LENGTH = 4;

/**
 * Very common function words across the supported languages. Stripping these
 * stops "quisiera un café, por favor" from matching on filler alone.
 */
const STOPWORDS = new Set([
  // Spanish
  'de', 'del', 'la', 'las', 'los', 'un', 'una', 'uno', 'unos', 'unas', 'el', 'y', 'o',
  'a', 'al', 'en', 'con', 'por', 'para', 'que', 'qué', 'me', 'mi', 'se', 'su', 'sus', 'lo',
  'es', 'son', 'ser', 'muy', 'mas', 'más', 'pero', 'como', 'cómo', 'donde', 'dónde', 'si', 'sí',
  'quisiera', 'quiere', 'quiero', 'puede', 'puedo', 'tiene', 'tengo', 'hay', 'favor', 'gracias',
  // French
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'le', 'les', 'des', 'du', 'une',
  'un', 'et', 'ou', 'est', 'sont', 'etre', 'être', 'avec', 'sans', 'pour', 'par', 'dans',
  'sur', 'merci', 'bonjour', 'salut', 'voudrais', 'je voudrais', 'puis', 'je peux',
  // German
  'ich', 'du', 'er', 'sie', 'es', 'der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen',
  'und', 'oder', 'ist', 'sind', 'bin', 'hat', 'habe', 'haben', 'mit', 'ohne', 'fuer', 'für',
  'auf', 'moechte', 'möchte', 'ich möchte', 'gern', 'bitte', 'danke', 'hallo',
  // Italian
  'che', 'chi', 'per', 'con', 'del', 'della', 'dei', 'gli', 'una', 'uno', 'e', 'o', 'sono',
  'essere', 'vorrei', 'posso', 'per favore', 'grazie', 'buongiorno',
  // English (explanations fall back to English)
  'the', 'a', 'an', 'and', 'or', 'is', 'are', 'to', 'of', 'in', 'on', 'for', 'with', 'i',
  'you', 'we', 'can', 'do', 'does', 'have', 'has', 'would', 'like', 'please', 'thank',
]);

/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(input: string): string[] {
  const normalized = normalizeText(input);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

/**
 * Content tokens: stopwords removed, short words dropped, and duplicates kept
 * (repetition is a real signal, e.g. "¿Tiene leche de avena? ¿Tiene leche de avena?").
 */
export function contentTokens(input: string): string[] {
  return tokenize(input).filter(
    token => !STOPWORDS.has(token) && token.length >= MIN_CONTENT_TOKEN_LENGTH
  );
}

/**
 * Inflection-tolerant token comparison. Romance and Germanic languages encode
 * tense/gender/number in suffixes, so "cena" and "ceno" are the same lemma for
 * our purposes. Compares on a shared prefix rather than a full stemmer, which
 * keeps this dependency-free and predictable.
 */
function tokensEquivalent(a: string, b: string): boolean {
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length < MIN_CONTENT_TOKEN_LENGTH) return a === b;
  if (shorter.length === longer.length) return false;
  // A shared prefix of at least 5 characters (shorter minus one inflection
  // suffix) treats the two as the same lemma.
  const prefixLength = shorter.length - 1;
  return prefixLength >= 5 && longer.slice(0, prefixLength) === shorter.slice(0, prefixLength);
}

function bestTokenCoverage(formTokens: string[], passageTokens: string[]): number {
  if (formTokens.length === 0) return 0;
  return bestTokenOverlap(formTokens, passageTokens) / formTokens.length;
}

/** Count of distinct target content words also present in the passage. */
function bestTokenOverlap(formTokens: string[], passageTokens: string[]): number {
  const remaining = [...passageTokens];
  let matched = 0;

  for (const formToken of formTokens) {
    const index = remaining.findIndex(candidate => tokensEquivalent(candidate, formToken));
    if (index >= 0) {
      remaining.splice(index, 1);
      matched += 1;
    }
  }

  return matched;
}

/** Fraction of the passage's content words that the target phrase accounts for. */
function passageShare(formTokens: string[], passageTokens: string[]): number {
  if (passageTokens.length === 0 || formTokens.length === 0) return 0;
  const remaining = [...passageTokens];
  let matched = 0;

  for (const formToken of formTokens) {
    const index = remaining.findIndex(candidate => tokensEquivalent(candidate, formToken));
    if (index >= 0) {
      remaining.splice(index, 1);
      matched += 1;
    }
  }

  return matched / passageTokens.length;
}

/**
 * Judges whether `passageText` demonstrates use of `targetForm`.
 *
 * - `exact`      the normalised target form appears verbatim in the passage.
 * - `paraphrase` most of the target's content words appear, or the passage is
 *                mostly the target phrase. Equivalent wording counts.
 * - `ambiguous`  partial overlap. Recorded as `unknown`; neither credited nor
 *                treated as a lapse.
 * - `none`       no meaningful overlap.
 */
export function matchPhraseInText(targetForm: string, passageText: string): MatchResult {
  const normalizedForm = normalizeText(targetForm);
  const normalizedPassage = normalizeText(passageText);

  if (!normalizedForm || !normalizedPassage) {
    return { verdict: 'none', score: 0, matchedText: null };
  }

  if (normalizedPassage.includes(normalizedForm)) {
    return { verdict: 'exact', score: 1, matchedText: passageText.trim() };
  }

  const formTokens = contentTokens(targetForm);
  const passageTokens = contentTokens(passageText);

  if (formTokens.length === 0) {
    return { verdict: 'none', score: 0, matchedText: null };
  }

  const coverage = bestTokenCoverage(formTokens, passageTokens);
  const share = passageShare(formTokens, passageTokens);
  const absoluteOverlap = bestTokenOverlap(formTokens, passageTokens);

  // The `share` rule catches a long utterance that is mostly the target phrase
  // ("un café con leche, por favor" against a one-word phrase). On its own it
  // is too weak: a two-word phrase and a one-word passage that happens to share
  // a single content word scores 1.0. Require at least two content words in
  // common before either rule can call something a paraphrase.
  const sufficientOverlap = absoluteOverlap >= 2;

  if (coverage >= 0.75 || (share >= 0.6 && sufficientOverlap)) {
    return {
      verdict: 'paraphrase',
      score: Math.min(1, Math.max(coverage, share)),
      matchedText: passageText.trim(),
    };
  }

  if (coverage >= 0.5 || share >= 0.34) {
    return {
      verdict: 'ambiguous',
      score: Math.max(coverage, share),
      matchedText: passageText.trim(),
    };
  }

  return { verdict: 'none', score: 0, matchedText: null };
}

/**
 * Scores every candidate phrase against one passage and returns only the
 * credible matches. Used as the deterministic fallback when assessment is
 * unavailable, and as a cross-check on model proposals.
 */
export function findPhraseMatches<P extends { id: string; form: string; meaning: string }>(
  candidates: P[],
  passageText: string
): Array<{ phrase: P; result: MatchResult }> {
  return candidates
    .map(phrase => ({ phrase, result: matchPhraseInText(phrase.form, passageText) }))
    .filter(entry => entry.result.verdict === 'exact' || entry.result.verdict === 'paraphrase');
}
