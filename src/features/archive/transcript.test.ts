import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ASSEMBLY_VERSION,
  revisionKeyFor,
  findStaleObservations,
  invalidateStaleObservations,
  buildLexicalCatalog,
  buildSkillCatalog,
  deriveLemma,
  lexicalCoversObservation,
} from './transcript';
import { archiveRepository } from './SqliteArchiveRepository';
import { createNodeSqliteAdapter, Db } from './db';
import { __setDatabaseForTesting, migrate } from './database';
import { LearningObservation, Passage, SessionRecord } from '../../types';
import { buildLocalObservations } from '../learning/learningCore';

/**
 * Transcript assembly and revision handling (§10.7).
 *
 * These run against real SQLite, so "stale evidence is dropped" is verified by
 * checking the archive afterwards rather than by asserting a boolean.
 */

let driver: { db: Db; close: () => void };

beforeEach(async () => {
  driver = createNodeSqliteAdapter();
  await migrate(driver.db);
  __setDatabaseForTesting(driver.db);
  await archiveRepository.recordConsent('saved_analysis', true);
});

afterEach(() => {
  __setDatabaseForTesting(null);
  driver.close();
});

function observation(overrides: Partial<LearningObservation> = {}): LearningObservation {
  return {
    observationId: 'obs-1',
    sessionId: 'session-1',
    attemptId: 'attempt-1',
    sourceTurnId: 'p-1',
    sourceRevision: 'rev-1',
    itemId: 'phrase.es.1',
    candidateForm: '¿Tiene leche de avena?',
    meaning: 'Do you have oat milk?',
    quote: '¿Tiene leche de avena?',
    modality: 'spoken',
    retrieval: 'unassisted',
    taskOutcome: 'achieved',
    rehearsal: false,
    supportExposureIds: [],
    recordedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makePassage(id: string, text: string, revisionKey: string): Passage {
  return {
    id,
    sessionId: 'session-1',
    attemptId: 'attempt-1',
    speaker: 'user',
    revisionKey,
    assemblyVersion: ASSEMBLY_VERSION,
    status: 'final',
    text,
    modality: 'spoken',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    fragments: [],
  };
}

function makeSession(passages: Passage[], observations: LearningObservation[]): SessionRecord {
  return {
    id: 'session-1',
    missionId: 'mission-es-cafe-sol',
    missionVersion: 1,
    language: 'es',
    mode: 'guided',
    coldAttempt: true,
    state: 'recap_ready',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    passages,
    supportExposures: [],
    observations,
    taskOutcome: 'completed',
    sceneState: {
      sceneId: 'scene.es.cafe.breakfast',
      revision: 1,
      facts: {},
      learnerKnows: [],
      characterKnows: [],
      checkpoints: [],
      isFinished: false,
      outcome: 'unknown',
    },
  };
}


function phraseEvidenceFor(session: SessionRecord) {
  const candidates = session.observations.map(observationValue => {
    const source = session.passages.find(
      passageValue =>
        passageValue.id === observationValue.sourceTurnId &&
        passageValue.revisionKey === observationValue.sourceRevision
    );
    const groundedForm = source?.text ?? observationValue.quote;
    return {
      id: observationValue.itemId,
      form: groundedForm,
      meaning: observationValue.meaning ?? groundedForm,
    };
  });

  return buildLocalObservations({
    sessionId: session.id,
    attemptId: session.observations[0]?.attemptId ?? 'attempt-1',
    passages: session.passages,
    supportExposures: session.supportExposures,
    candidates,
    isColdAttempt: session.coldAttempt,
    isRehearsalAttempt: false,
  }).evidence;
}

async function completeSessionWithEvidence(session: SessionRecord): Promise<void> {
  await archiveRepository.completeSession(
    { ...session, observations: [] },
    [],
    undefined,
    phraseEvidenceFor(session)
  );
}

describe('revisionKeyFor', () => {
  it('is stable for identical text', () => {
    expect(revisionKeyFor('hola')).toBe(revisionKeyFor('hola'));
  });

  it('changes when the text changes', () => {
    expect(revisionKeyFor('hola')).not.toBe(revisionKeyFor('hola!'));
  });

  it('names the revision it derived', () => {
    expect(revisionKeyFor('hola').startsWith('rev-')).toBe(true);
  });
});

describe('findStaleObservations', () => {
  const passages = [
    { id: 'p-1', revisionKey: 'rev-1', text: '¿Tiene leche de avena?' },
  ];

  it('accepts an observation whose revision still matches', () => {
    expect(findStaleObservations([observation()], passages)).toEqual([]);
  });

  it('flags an observation citing a superseded revision', () => {
    const stale = findStaleObservations([observation({ sourceRevision: 'rev-old' })], passages);

    expect(stale).toHaveLength(1);
    expect(stale[0].reason).toContain('Superseded revision');
  });

  it('flags an observation whose passage was removed', () => {
    const stale = findStaleObservations([observation({ sourceTurnId: 'p-gone' })], passages);

    expect(stale).toHaveLength(1);
    expect(stale[0].reason).toContain('no longer exists');
  });

  it('flags an observation produced under an older assembly version', () => {
    const stale = findStaleObservations(
      [observation({ sourceRevision: `v${ASSEMBLY_VERSION - 1}:rev-1` })],
      passages
    );

    expect(stale).toHaveLength(1);
  });
});

describe('invalidateStaleObservations', () => {
  it('drops evidence the current transcript no longer supports', async () => {
    await completeSessionWithEvidence(
      makeSession(
        [makePassage('p-1', '¿Tiene leche de avena?', 'rev-1')],
        [observation({ sourceRevision: 'rev-1' })]
      )
    );

    const before = await archiveRepository.getObservations();
    expect(before.length).toBeGreaterThan(0);

    const stale = await invalidateStaleObservations(driver.db, 'session-1', [
      { id: 'p-1', revisionKey: 'rev-2', text: '¿Tiene leche de avena?' },
    ]);

    expect(stale.length).toBeGreaterThan(0);
    expect(await archiveRepository.getObservations()).toHaveLength(0);
  });

  it('leaves evidence whose revision still matches', async () => {
    await completeSessionWithEvidence(
      makeSession(
        [makePassage('p-1', '¿Tiene leche de avena?', 'rev-1')],
        [observation({ sourceRevision: 'rev-1' })]
      )
    );

    const stale = await invalidateStaleObservations(driver.db, 'session-1', [
      { id: 'p-1', revisionKey: 'rev-1', text: '¿Tiene leche de avena?' },
    ]);

    expect(stale).toEqual([]);
    expect(await archiveRepository.getObservations()).toHaveLength(1);
  });

  it('keeps the deletion auditable instead of silent', async () => {
    await completeSessionWithEvidence(
      makeSession(
        [makePassage('p-1', '¿Tiene leche de avena?', 'rev-1')],
        [observation({ sourceRevision: 'rev-1' })]
      )
    );

    await invalidateStaleObservations(driver.db, 'session-1', [
      { id: 'p-1', revisionKey: 'rev-2', text: '¿Tiene leche de avena?' },
    ]);

    const record = await driver.db.getFirstAsync<{ parse_status: string; raw_json: string }>(
      'SELECT parse_status, raw_json FROM assessment_proposals WHERE id = ?',
      'stale-session-1'
    );

    expect(record?.parse_status).toBe('superseded');
    expect(JSON.parse(record?.raw_json ?? '[]')).toHaveLength(1);
  });

  it('does not touch other sessions', async () => {
    await completeSessionWithEvidence(
      makeSession(
        [makePassage('p-1', '¿Tiene leche de avena?', 'rev-1')],
        [observation({ sourceRevision: 'rev-1' })]
      )
    );

    await invalidateStaleObservations(driver.db, 'session-1', [
      { id: 'p-1', revisionKey: 'rev-2', text: '¿Tiene leche de avena?' },
    ]);

    const remaining = await driver.db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM observations WHERE session_id != ?',
      'session-1'
    );

    expect(remaining).toHaveLength(0);
  });
});

describe('a corrected passage invalidates the skill evidence that cited it', () => {
  const SKILL = 'skill-request-substitution';

  async function seedSkillEvidence(sourceRevision: string): Promise<void> {
    const now = new Date().toISOString();

    // This transcript test seeds persistence below the public archive API so it
    // can exercise stale-row invalidation directly. Production callers cannot
    // write raw skill evidence.
    await driver.db.runAsync(
      `INSERT OR REPLACE INTO skill_observations
        (id, skill_id, session_id, attempt_id, source_passage_id, source_revision,
         domain_id, scenario_family_id, scenario_id, modality, retrieval,
         task_outcome, demonstration, support_exposure_ids, evidence_source, quote,
         day_key, reason_code, reason_codes, policy_version, hidden, user_disputed, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
      `so-${sourceRevision}`,
      SKILL,
      'session-1',
      'attempt-1',
      'p-1',
      sourceRevision,
      'cafes',
      'counter-ordering',
      'scene.es.cafe.breakfast',
      'spoken',
      'unassisted',
      'achieved',
      'demonstrated',
      '[]',
      'validated_explicit',
      'la leche de avena',
      now.slice(0, 10),
      'validated_demonstration',
      '[]',
      5,
      now
    );

    await driver.db.runAsync(
      `INSERT OR REPLACE INTO skill_lapses
        (id, skill_id, session_id, attempt_id, source_passage_id, source_revision,
         domain_id, scenario_family_id, scenario_id, opportunity_instance_id,
         demonstration, basis, day_key, reason_code, policy_version, hidden, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      `lapse-${sourceRevision}`,
      SKILL,
      'session-1',
      'attempt-1',
      'p-1',
      sourceRevision,
      'cafes',
      'counter-ordering',
      'scene.es.cafe.breakfast',
      `opp-${sourceRevision}`,
      'attempted_not_demonstrated',
      'cold_attempt_failed',
      now.slice(0, 10),
      'cold_taken_opportunity_not_demonstrated',
      5,
      now
    );
  }


  it('removes the skill observation when the passage is superseded', async () => {
    await seedSkillEvidence('rev-1');
    expect(await archiveRepository.getSkillObservations()).toHaveLength(1);

    await invalidateStaleObservations(driver.db, 'session-1', [
      { id: 'p-1', revisionKey: 'rev-2', text: 'correction' },
    ]);

    expect(await archiveRepository.getSkillObservations()).toHaveLength(0);
  });

  // Otherwise the learner keeps credit for words they demonstrably did not say,
  // and that credit counts toward Steady.
  it('removes the lapse that cited the superseded revision', async () => {
    await seedSkillEvidence('rev-1');
    expect(await archiveRepository.getSkillLapses()).toHaveLength(1);

    await invalidateStaleObservations(driver.db, 'session-1', [
      { id: 'p-1', revisionKey: 'rev-2', text: 'correction' },
    ]);

    expect(await archiveRepository.getSkillLapses()).toHaveLength(0);
  });

  it('keeps evidence citing the current revision', async () => {
    await seedSkillEvidence('rev-2');

    await invalidateStaleObservations(driver.db, 'session-1', [
      { id: 'p-1', revisionKey: 'rev-2', text: 'unchanged' },
    ]);

    expect(await archiveRepository.getSkillObservations()).toHaveLength(1);
    expect(await archiveRepository.getSkillLapses()).toHaveLength(1);
  });

  it('removes evidence for a passage that left the transcript entirely', async () => {
    await seedSkillEvidence('rev-1');

    await invalidateStaleObservations(driver.db, 'session-1', []);

    expect(await archiveRepository.getSkillObservations()).toHaveLength(0);
    expect(await archiveRepository.getSkillLapses()).toHaveLength(0);
  });
});

describe('buildLexicalCatalog', () => {
  const phrases = [
    { id: 'p-1', language: 'es', form: '¿Tiene leche de avena?', meaning: 'Oat milk?' },
    { id: 'p-2', language: 'es', form: '¿Tiene leche de soja?', meaning: 'Soy milk?' },
    { id: 'p-3', language: 'es', form: 'Quiero un café', meaning: 'I want a coffee' },
  ];

  it('groups phrases that share a lemma', () => {
    const items = buildLexicalCatalog(phrases);
    const item = items.find(candidate => candidate.phraseIds.includes('p-1'));

    expect(item?.phraseIds).toEqual(expect.arrayContaining(['p-1', 'p-2']));
    expect(item?.lemma).toBe(deriveLemma('¿Tiene leche de avena?'));
  });

  it('keeps a different verb in its own lexical item', () => {
    const items = buildLexicalCatalog(phrases);
    expect(items.some(item => item.lemma === deriveLemma('Quiero un café'))).toBe(true);
  });

  it('keeps the same word in different languages separate', () => {
    const items = buildLexicalCatalog([
      { id: 'p-1', language: 'es', form: 'un café', meaning: 'a coffee' },
      { id: 'p-4', language: 'fr', form: 'un café', meaning: 'a coffee' },
    ]);

    const lemma = deriveLemma('un café');
    expect(items.filter(item => item.lemma === lemma)).toHaveLength(2);
  });

  it('does not claim coverage for a word the learner never produced', () => {
    const items = buildLexicalCatalog(phrases);
    const item = items.find(candidate => candidate.phraseIds.includes('p-1'))!;

    expect(
      lexicalCoversObservation(item, observation({ quote: 'zzz qqq', candidateForm: 'zzz qqq' }))
    ).toBe(false);
  });
});

describe('deriveLemma', () => {
  it('prefers the verb over a determiner', () => {
    expect(deriveLemma('tengo')).toBe(deriveLemma('¿Tiene?'));
    expect(deriveLemma('un café')).toBe(deriveLemma('café'));
  });

  it('leaves short words intact rather than mangling them', () => {
    expect(deriveLemma('y')).toBe('y');
  });

  it('returns null for text with no usable tokens', () => {
    expect(deriveLemma('   ')).toBeNull();
  });

  it('is stable across accents and punctuation', () => {
    expect(deriveLemma('¿Tiene leche?')).toBe(deriveLemma('¿Tiene!')); 
  });
});

describe('buildSkillCatalog', () => {
  it('carries the curated samples onto every skill', () => {
    const skills = buildSkillCatalog();

    expect(skills.length).toBeGreaterThan(0);
    expect(skills.every(skill => skill.samplePhrases.length > 0)).toBe(true);
  });

  it('does not expose a derived family as a learner-status skill', () => {
    expect(buildSkillCatalog().map(skill => skill.id))
      .not.toContain('skill-communicative-repair');
  });
});
