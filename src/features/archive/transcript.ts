import { Db } from './db';
import { withTransaction } from './database';
import { matchPhraseInText } from '../learning/matching';
import { COMMUNICATIVE_SKILLS_CATALOG } from '../../data/missions';
import { LearningObservation, LexicalItem, SkillItem } from '../../types';

/**
 * Transcript assembly (§10.7, step 5).
 *
 * The assembly version records the rules used to normalise and join transcript
 * fragments. If those rules ever change, historical evidence is still
 * interpreted as it originally was. A passage revised after assessment
 * invalidates the observations that cited the superseded revision.
 */

/** Bumped when transcript normalisation or joining changes. */
export const ASSEMBLY_VERSION = 1;

/** Extracts the key that binds a passage revision to its content. */
export function revisionKeyFor(text: string): string {
  let hash = 0;
  const normalized = text.trim();
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `rev-${(hash >>> 0).toString(36)}`;
}

export interface StaleObservation {
  observationId: string;
  reason: string;
}

/**
 * Finds observations whose cited revision no longer matches the transcript.
 *
 * A learner correcting what they said must not leave stale progress behind: the
 * observation either matches the current revision or is discarded.
 */
export function findStaleObservations(
  observations: LearningObservation[],
  currentPassages: Array<{ id: string; revisionKey: string; text: string }>
): StaleObservation[] {
  const byId = new Map(currentPassages.map(p => [p.id, p]));
  const stale: StaleObservation[] = [];

  for (const observation of observations) {
    const passage = byId.get(observation.sourceTurnId);
    if (!passage) {
      stale.push({
        observationId: observation.observationId,
        reason: 'Cited passage no longer exists in the transcript',
      });
      continue;
    }
    if (passage.revisionKey !== observation.sourceRevision) {
      stale.push({
        observationId: observation.observationId,
        reason: `Superseded revision: observation cites ${observation.sourceRevision}, transcript has ${passage.revisionKey}`,
      });
    }
  }

  return stale;
}

/**
 * Removes stale observations and re-derives the projection in one transaction,
 * so a corrected transcript never leaves progress that the transcript no longer
 * supports.
 */
export async function invalidateStaleObservations(
  db: Db,
  sessionId: string,
  currentPassages: Array<{ id: string; revisionKey: string; text: string }>
): Promise<StaleObservation[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM observations WHERE session_id = ?',
    sessionId
  );

  const observations: LearningObservation[] = rows.map(row => ({
    observationId: String(row.id),
    sessionId: String(row.session_id),
    attemptId: String(row.attempt_id),
    sourceTurnId: String(row.source_turn_id),
    sourceRevision: String(row.source_revision),
    itemId: String(row.item_id),
    candidateForm: String(row.candidate_form),
    meaning: String(row.meaning ?? ''),
    quote: String(row.quote ?? ''),
    modality: String(row.modality) as LearningObservation['modality'],
    retrieval: String(row.retrieval) as LearningObservation['retrieval'],
    taskOutcome: String(row.task_outcome) as LearningObservation['taskOutcome'],
    rehearsal: Boolean(row.rehearsal),
    supportExposureIds: [],
    recordedAt: String(row.created_at),
  }));

  const stale = findStaleObservations(observations, currentPassages);

  await withTransaction(async txn => {
    for (const entry of stale) {
      await txn.runAsync('DELETE FROM observations WHERE id = ?', entry.observationId);
    }

    /**
     * Skill evidence and lapses citing the superseded revision go too.
     *
     * Invalidating only the phrase row leaves a skill claim standing on words the
     * transcript no longer contains. That is the exact failure the evidence
     * contract exists to prevent: the learner would keep credit for something they
     * demonstrably did not say, and it would count toward Steady. A lapse is
     * removed for the same reason — it was a claim about a specific revision.
     *
     * This runs even when no phrase observation was stale. Skill evidence is
     * validated on its own terms and can outlive or precede any phrase row, so
     * gating it on the phrase result would leave exactly the claims that have no
     * phrase twin behind.
     */
    for (const passage of currentPassages) {
      await txn.runAsync(
        'DELETE FROM skill_observations WHERE source_passage_id = ? AND source_revision != ?',
        passage.id,
        passage.revisionKey
      );
      await txn.runAsync(
        'DELETE FROM skill_lapses WHERE source_passage_id = ? AND source_revision != ?',
        passage.id,
        passage.revisionKey
      );
    }

    // A passage that is no longer in the transcript at all cannot support
    // evidence either, whatever revision it was last seen at.
    const liveIds = new Set(currentPassages.map(p => p.id));
    for (const passageId of await orphanedSkillPassageIds(txn)) {
      if (liveIds.has(passageId)) continue;
      await txn.runAsync(
        'DELETE FROM skill_observations WHERE source_passage_id = ?',
        passageId
      );
      await txn.runAsync('DELETE FROM skill_lapses WHERE source_passage_id = ?', passageId);
    }

    // Store the diagnosis so it is auditable rather than silent.
    if (stale.length > 0) {
      await txn.runAsync(
        `INSERT OR REPLACE INTO assessment_proposals
          (id, session_id, attempt_id, schema_version, raw_json, parse_status, validation_errors, received_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        `stale-${sessionId}`,
        sessionId,
        'attempt-1',
        ASSEMBLY_VERSION,
        JSON.stringify(stale),
        'superseded',
        JSON.stringify(stale),
        new Date().toISOString()
      );
    }
  });

  return stale;
}

/** Passage ids that still carry skill evidence or a lapse. */
async function orphanedSkillPassageIds(txn: Db): Promise<string[]> {
  const rows = await txn.getAllAsync<Record<string, unknown>>(
    'SELECT DISTINCT source_passage_id FROM skill_observations'
  );
  const lapseRows = await txn.getAllAsync<Record<string, unknown>>(
    'SELECT DISTINCT source_passage_id FROM skill_lapses'
  );

  return [...new Set([...rows, ...lapseRows].map(r => String(r.source_passage_id)))];
}

/**
 * Curated lexical items (§10.1).
 *
 * A lemma cannot identify every request that uses a given verb, so lexical
 * coverage is tracked separately from phrases and never drives scheduling.
 */
export function buildLexicalCatalog(
  phrases: Array<{ id: string; language: string; form: string; meaning: string }>
): LexicalItem[] {
  const byLemma = new Map<string, LexicalItem>();

  for (const phrase of phrases) {
    const lemma = deriveLemma(phrase.form);
    if (!lemma) continue;

    const key = `${phrase.language}:${lemma}`;
    const existing = byLemma.get(key);

    if (existing) {
      if (!existing.phraseIds.includes(phrase.id)) {
        existing.phraseIds.push(phrase.id);
      }
      continue;
    }

    byLemma.set(key, {
      id: `lex.${phrase.language}.${lemma}`,
      language: phrase.language as LexicalItem['language'],
      lemma,
      meaning: phrase.meaning,
      phraseIds: [phrase.id],
    });
  }

  return [...byLemma.values()];
}

/**
 * The lemma for a phrase: the dictionary form of its verb where one is
 * recognised, otherwise its first content word.
 *
 * Conjugations are folded through an explicit map rather than by chopping
 * suffixes off. Suffix stripping is not safe here: "tengo" and "tiene" are the
 * same lemma but share no ending, and a stripper that guessed would either miss
 * the grouping or invent groupings that are not real. An unknown form is left
 * alone, because under-grouping only under-reports coverage while over-grouping
 * would claim knowledge the learner never showed.
 */
export function deriveLemma(form: string): string | null {
  const tokens = form
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .map(token => token.replace(/[^\p{L}]/gu, ''))
    .filter(Boolean);

  if (tokens.length === 0) return null;

  for (const token of tokens) {
    const known = VERB_TO_INFINITIVE.get(token);
    if (known) return known;
  }

  // An infinitive already in the table is its own lemma.
  for (const token of tokens) {
    if (VERB_INFINITIVES.has(token)) return token;
  }

  // Fall back to the first content word. A determiner or article is not a
  // lexical item, so "un café" must not become the lemma "un" and collapse
  // every phrase that opens with an article into one item.
  const content = tokens.find(token => !FUNCTION_WORDS.has(token));
  return content ?? tokens[0];
}

/** Words that carry no meaning of their own and cannot head a lemma. */
const FUNCTION_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo', 'al',
  'y', 'e', 'o', 'u', 'que', 'qué', 'con', 'sin', 'para', 'por', 'de', 'del',
  'a', 'en', 'es', 'soy', 'está', 'esta', 'esto', 'ese', 'esa', 'aqui', 'allá',
  'le', 'me', 'te', 'se', 'nos', 'os', 'mi', 'tu', 'su', 'muy', 'más', 'mas',
  'the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'to', 'is', 'are', 'i',
]);

/** Verb conjugations worth grouping, as used in service roleplay. */
const VERB_TO_INFINITIVE = new Map<string, string>([
  // tener
  ['tengo', 'tener'], ['tenemos', 'tener'], ['tiene', 'tener'], ['tienen', 'tener'],
  ['tenga', 'tener'], ['tengas', 'tener'],
  // querer
  ['quiero', 'querer'], ['queremos', 'querer'], ['quiere', 'querer'], ['quieren', 'querer'],
  ['quisiera', 'querer'], ['quisieras', 'querer'], ['quisieron', 'querer'],
  // poder
  ['puedo', 'poder'], ['podemos', 'poder'], ['puede', 'poder'], ['pueden', 'poder'],
  // hacer
  ['hago', 'hacer'], ['hacemos', 'hacer'], ['hace', 'hacer'], ['hacen', 'hacer'],
  ['hacia', 'hacer'],
  // decir
  ['digo', 'decir'], ['decimos', 'decir'], ['dice', 'decir'], ['dicen', 'decir'],
  // ver / dar / saber / ir / salir / pedir / costar / valer / traer
  ['veo', 'ver'], ['vemos', 'ver'], ['ve', 'ver'], ['ven', 'ver'],
  ['dio', 'dar'], ['damos', 'dar'], ['da', 'dar'], ['dan', 'dar'],
  ['sé', 'saber'], ['sabe', 'saber'], ['saben', 'saber'],
  ['voy', 'ir'], ['vas', 'ir'], ['va', 'ir'], ['vamos', 'ir'], ['van', 'ir'],
  ['salgo', 'salir'], ['sales', 'salir'], ['sale', 'salir'],
  ['pido', 'pedir'], ['pedimos', 'pedir'], ['pide', 'pedir'],
  ['cuesta', 'costar'], ['cuestan', 'costar'],
  ['vale', 'valer'], ['válen', 'valer'],
  ['traigo', 'traer'],
  // estar
  ['estoy', 'estar'], ['está', 'estar'], ['están', 'estar'], ['estamos', 'estar'],
]);

const VERB_INFINITIVES = new Set([
  'tener', 'querer', 'poder', 'hacer', 'decir', 'ver', 'dar', 'saber', 'ir',
  'salir', 'pedir', 'costar', 'valer', 'traer', 'estar',
]);

/** The curated skill catalog, typed as SkillItem. */
export function buildSkillCatalog(): SkillItem[] {
  return COMMUNICATIVE_SKILLS_CATALOG.map(skill => ({
    id: skill.id,
    name: skill.name,
    category: skill.category,
    description: skill.description,
    evidencePhraseIds: [],
    samplePhrases: skill.samplePhrases,
    associatedMissions: skill.associatedMissions,
  }));
}

/** Whether a lexical item covers a phrase the learner actually produced. */
export function lexicalCoversObservation(
  item: LexicalItem,
  observation: LearningObservation
): boolean {
  return matchPhraseInText(item.lemma, observation.quote || observation.candidateForm)
    .verdict !== 'none';
}