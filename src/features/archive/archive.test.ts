import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createNodeSqliteAdapter, Db } from './db';
import { __setDatabaseForTesting, getSchemaVersion, migrate, withTransaction } from './database';
import { archiveRepository } from './SqliteArchiveRepository';
import { MIGRATIONS } from './schema';
import { LearningObservation, Passage, SessionRecord, SupportExposure } from '../../types';
import { buildLocalObservations } from '../learning/learningCore';

/**
 * The archive exercised against a real SQLite engine.
 *
 * These run the actual migrations and the actual repository queries, so the
 * schema, the transaction boundaries and the uniqueness constraints are verified
 * rather than assumed. `expo-sqlite` is a different driver with the same SQL
 * surface; what is proven here is the SQL and the query logic, not the RN module.
 */

let driver: { db: Db; close: () => void };

beforeEach(async () => {
  driver = createNodeSqliteAdapter();
  await migrate(driver.db);
  __setDatabaseForTesting(driver.db);
});

afterEach(() => {
  __setDatabaseForTesting(null);
  driver.close();
});

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
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
    passages: [],
    supportExposures: [],
    observations: [],
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
    ...overrides,
  };
}

function makePassage(id: string, text: string, revisionKey = 'rev-1'): Passage {
  return {
    id,
    sessionId: 'session-1',
    attemptId: 'attempt-1',
    speaker: 'user',
    revisionKey,
    assemblyVersion: 1,
    status: 'final',
    text,
    modality: 'spoken',
    startedAt: new Date().toISOString(),
    fragments: [],
  };
}

function makeObservation(overrides: Partial<LearningObservation> = {}): LearningObservation {
  return {
    observationId: `obs-${Math.random().toString(36).slice(2, 9)}`,
    sessionId: 'session-1',
    attemptId: 'attempt-1',
    sourceTurnId: 'p-1',
    sourceRevision: 'rev-1',
    itemId: 'phrase.es.cafe_con_leche',
    candidateForm: 'Un café con leche, por favor.',
    meaning: 'A coffee with milk',
    quote: 'quisiera un café con leche',
    modality: 'spoken',
    retrieval: 'unassisted',
    taskOutcome: 'achieved',
    rehearsal: false,
    supportExposureIds: [],
    recordedAt: new Date().toISOString(),
    ...overrides,
  };
}


function phraseEvidenceFor(session: SessionRecord) {
  const candidates = (session.observations ?? []).map(observation => {
    const source = session.passages.find(
      passage =>
        passage.id === observation.sourceTurnId &&
        passage.revisionKey === observation.sourceRevision
    );
    const groundedForm = source?.text ?? observation.quote;
    return {
      id: observation.itemId,
      form: groundedForm,
      meaning: observation.meaning ?? groundedForm,
    };
  });

  return buildLocalObservations({
    sessionId: session.id,
    attemptId: session.observations?.[0]?.attemptId ?? 'attempt-1',
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

describe('migrations', () => {
  it('brings a fresh database to the latest version', async () => {
    expect(await getSchemaVersion()).toBe(MIGRATIONS[MIGRATIONS.length - 1].version);
  });

  it('is idempotent, so re-running is safe', async () => {
    await migrate(driver.db);
    await migrate(driver.db);
    expect(await getSchemaVersion()).toBe(MIGRATIONS[MIGRATIONS.length - 1].version);
  });

  it('creates every table the repository writes to', async () => {
    const expected = [
      'preferences',
      'sessions',
      'attempts',
      'passages',
      'fragments',
      'support_exposures',
      'assessment_proposals',
      'observations',
      'phrases',
      'scene_state',
      'scene_events',
      'consent_records',
      'deletion_markers',
      'pending_jobs',
    ];

    const rows = await driver.db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table'"
    );
    const names = new Set(rows.map(r => r.name));

    for (const table of expected) {
      expect(names.has(table)).toBe(true);
    }
  });
});

describe('transactions', () => {
  it('commits on success', async () => {
    await withTransaction(async txn => {
      await txn.runAsync(
        'INSERT INTO preferences (id, payload, updated_at) VALUES (?, ?, ?)',
        'current',
        '{}',
        new Date().toISOString()
      );
    });

    const row = await driver.db.getFirstAsync<{ id: string }>(
      'SELECT id FROM preferences'
    );
    expect(row?.id).toBe('current');
  });

  it('rolls back every write when the work throws', async () => {
    await expect(
      withTransaction(async txn => {
        await txn.runAsync(
          'INSERT INTO preferences (id, payload, updated_at) VALUES (?, ?, ?)',
          'current',
          '{"a":1}',
          new Date().toISOString()
        );
        await txn.runAsync(
          'INSERT INTO preferences (id, payload, updated_at) VALUES (?, ?, ?)',
          'other',
          '{}',
          new Date().toISOString()
        );
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');

    const rows = await driver.db.getAllAsync('SELECT * FROM preferences');
    expect(rows).toHaveLength(0);
  });
});

describe('preferences and consent', () => {
  it('seeds safe consent defaults rather than assuming agreement', async () => {
    const prefs = await archiveRepository.getPreferences();
    expect(prefs.voiceProcessingConsent).toBe(false);
    expect(prefs.savedAnalysisConsent).toBe(false);
  });

  it('round-trips preferences', async () => {
    await archiveRepository.savePreferences({
      learningLanguage: 'fr',
      explanationLanguage: 'es',
      comfortLevel: 'elementary',
      primaryGoal: 'work',
      modeDefault: 'immersion',
      voiceProcessingConsent: true,
      savedAnalysisConsent: false,
      audioPlaybackEnabled: true,
      autoPlaySpeech: true,
      speechRate: 0.8,
    });

    const loaded = await archiveRepository.getPreferences();
    expect(loaded.learningLanguage).toBe('fr');
    expect(loaded.speechRate).toBe(0.8);
  });

  it('records consent per scope and independently', async () => {
    await archiveRepository.recordConsent('voice', true);
    expect((await archiveRepository.getConsent('voice'))?.granted).toBe(true);
    expect(await archiveRepository.getConsent('saved_analysis')).toBeNull();
  });

  it('stamps a withdrawal with a time', async () => {
    await archiveRepository.recordConsent('saved_analysis', true);
    await archiveRepository.withdrawConsent('saved_analysis');

    const record = await archiveRepository.getConsent('saved_analysis');
    expect(record?.granted).toBe(false);
    expect(record?.withdrawnAt).toBeTruthy();
  });
});

describe('session lifecycle persistence', () => {
  it('persists a session before streaming begins', async () => {
    await archiveRepository.beginSession(makeSession({ state: 'preflight' }));

    const summaries = await archiveRepository.getSessionSummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].state).toBe('preflight');
  });

  it('records the consent and policy versions alongside the session', async () => {
    await archiveRepository.beginSession(makeSession());
    const row = await driver.db.getFirstAsync<{ consent_version: string; policy_version: number }>(
      'SELECT consent_version, policy_version FROM sessions WHERE id = ?',
      'session-1'
    );

    expect(row?.consent_version).toBeTruthy();
    expect(row?.policy_version).toBeGreaterThan(0);
  });

  it('updates state in place as the session progresses', async () => {
    await archiveRepository.beginSession(makeSession({ state: 'preflight' }));
    await archiveRepository.saveSessionState('session-1', 'live');

    const summaries = await archiveRepository.getSessionSummaries();
    expect(summaries[0].state).toBe('live');
  });
});

describe('observation uniqueness (test #8)', () => {
  it('ignores a replayed turn instead of double-counting it', async () => {
    const session = makeSession({
      passages: [makePassage('p-1', 'quisiera un café con leche')],
      observations: [makeObservation()],
    });

    await completeSessionWithEvidence(session);

    // The same turn, same revision, same phrase, replayed after a reconnect.
    await completeSessionWithEvidence({
      ...session,
      observations: [makeObservation({ observationId: 'obs-different-id' })],
    });

    const observations = await archiveRepository.getObservations();
    expect(observations).toHaveLength(1);
  });

  it('does not ignore a genuinely new observation', async () => {
    const session = makeSession({
      passages: [makePassage('p-1', 'quisiera un café con leche')],
      observations: [makeObservation()],
    });
    await completeSessionWithEvidence(session);

    await completeSessionWithEvidence({
      ...session,
      passages: [
        makePassage('p-1', 'quisiera un café con leche'),
        makePassage('p-2', 'para llevar, por favor'),
      ],
      observations: [makeObservation({ sourceTurnId: 'p-2', observationId: 'obs-2' })],
    });

    const observations = await archiveRepository.getObservations();
    expect(observations).toHaveLength(2);
  });

  it('allows a new revision of the same turn to supersede the old one', async () => {
    const session = makeSession({
      passages: [makePassage('p-1', 'quisiera un café con leche')],
      observations: [makeObservation({ sourceRevision: 'rev-1' })],
    });
    await completeSessionWithEvidence(session);

    await completeSessionWithEvidence({
      ...session,
      passages: [makePassage('p-1', 'quisiera un te verde', 'rev-2')],
      observations: [
        makeObservation({ sourceRevision: 'rev-2', observationId: 'obs-rev2' }),
      ],
    });

    const observations = await archiveRepository.getObservations();
    expect(observations).toHaveLength(2);
    expect(observations.map(o => o.sourceRevision).sort()).toEqual(['rev-1', 'rev-2']);
  });
});

describe('deletion markers (test #10)', () => {
  it('marks a session deleted before the rows are removed', async () => {
    await completeSessionWithEvidence(
      makeSession({
        passages: [makePassage('p-1', 'hola')],
        observations: [makeObservation()],
      })
    );

    await archiveRepository.deleteSession('session-1');

    expect(await archiveRepository.isDeleted('session-1')).toBe(true);
  });

  it('reports a live session as not deleted', async () => {
    await completeSessionWithEvidence(makeSession());
    expect(await archiveRepository.isDeleted('session-1')).toBe(false);
  });

  it('queues a pending job so a late assessment is discarded, not applied', async () => {
    await completeSessionWithEvidence(makeSession());
    await archiveRepository.deleteSession('session-1');

    const jobs = await archiveRepository.getPendingJobs();
    expect(jobs.some(j => j.kind === 'assessment' && j.targetId === 'session-1')).toBe(true);
  });

  it('removes the evidence, not just the row', async () => {
    await completeSessionWithEvidence(
      makeSession({
        passages: [makePassage('p-1', 'hola')],
        supportExposures: [
          {
            id: 'exp-1',
            sessionId: 'session-1',
            attemptId: 'attempt-1',
            source: 'coach',
            kind: 'intent_hint',
            targetItemIds: ['phrase.es.cafe_leche'],
            exposure: 'visible',
            recordedAt: new Date().toISOString(),
          } as SupportExposure,
        ],
        observations: [makeObservation()],
      })
    );

    await archiveRepository.deleteSession('session-1');

    expect(await archiveRepository.getObservations()).toHaveLength(0);
    expect(await archiveRepository.getSessions()).toHaveLength(0);

    const passages = await driver.db.getAllAsync('SELECT * FROM passages');
    expect(passages).toHaveLength(0);
  });

  it('treats a scope of all as covering every session', async () => {
    await archiveRepository.clearAllLearningData();
    expect(await archiveRepository.isDeleted('any-session-at-all')).toBe(true);
  });

  it('blocks a late validated completion from resurrecting a deleted session', async () => {
    const deleted = makeSession({
      startedAt: '2026-10-01T10:00:00.000Z',
      passages: [makePassage('p-1', 'quisiera un café con leche')],
      observations: [makeObservation()],
    });
    await completeSessionWithEvidence(deleted);
    await archiveRepository.deleteSession(deleted.id);

    await completeSessionWithEvidence(deleted);

    expect(await archiveRepository.getSessionById(deleted.id)).toBeNull();
    expect(await archiveRepository.getObservations()).toEqual([]);
  });

  it('allows a new generation of sessions after delete-all', async () => {
    await archiveRepository.clearAllLearningData();
    const fresh = makeSession({
      id: 'session-after-erase',
      startedAt: '2099-01-01T00:00:00.000Z',
    });

    await archiveRepository.beginSession(fresh);

    expect(await archiveRepository.getSessionById(fresh.id)).not.toBeNull();
    expect(await archiveRepository.isDeleted(fresh.id, fresh.startedAt)).toBe(false);
  });
});

describe('projection is rebuilt inside the same transaction', () => {
  it('recomputes recall status from the ledger on write', async () => {
    await completeSessionWithEvidence(
      makeSession({
        passages: [makePassage('p-1', 'un café con leche')],
        observations: [makeObservation()],
      })
    );

    const phrases = await archiveRepository.getPhrases();
    const target = phrases.find(p => p.id === 'phrase.es.cafe_con_leche');
    expect(target).toBeDefined();
    expect(target!.recallStatus).not.toBe('new');
  });

  it('excludes a hidden observation from the projection', async () => {
    await completeSessionWithEvidence(
      makeSession({
        passages: [makePassage('p-1', 'un café con leche')],
        observations: [makeObservation()],
      })
    );

    const before = await archiveRepository.getObservations();
    expect(before).toHaveLength(1);

    await archiveRepository.hideObservation(before[0].observationId);

    const after = await archiveRepository.getObservations();
    expect(after[0].hidden).toBe(true);
  });

  it('marks a disputed observation as both hidden and disputed', async () => {
    await completeSessionWithEvidence(
      makeSession({
        passages: [makePassage('p-1', 'un café con leche')],
        observations: [makeObservation()],
      })
    );

    const [obs] = await archiveRepository.getObservations();
    await archiveRepository.disputeObservation(obs.observationId);

    const [after] = await archiveRepository.getObservations();
    expect(after.hidden).toBe(true);
    expect(after.userDisputed).toBe(true);
  });
});

describe('interrupted session recovery (§7.11)', () => {
  it('reports a session left live by a process kill', async () => {
    await archiveRepository.beginSession(makeSession({ state: 'live' }));

    const interrupted = await archiveRepository.getInterruptedSessions();
    expect(interrupted).toHaveLength(1);
    expect(interrupted[0].id).toBe('session-1');
  });

  it('does not report a finished session', async () => {
    await archiveRepository.beginSession(makeSession({ state: 'preflight' }));
    await archiveRepository.saveSessionState('session-1', 'ended');

    expect(await archiveRepository.getInterruptedSessions()).toHaveLength(0);
  });

  it('reports every in-flight state', async () => {
    for (const state of ['preflight', 'connecting', 'live', 'paused', 'reconnecting', 'ending'] as const) {
      await archiveRepository.beginSession(
        makeSession({ id: `s-${state}`, state })
      );
    }

    const interrupted = await archiveRepository.getInterruptedSessions();
    expect(interrupted).toHaveLength(6);
  });
});

describe('export and import', () => {
  it('produces a bounded JSON archive with the versions stamped', async () => {
    await completeSessionWithEvidence(
      makeSession({
        passages: [makePassage('p-1', 'un café con leche')],
        observations: [makeObservation()],
      })
    );

    const json = await archiveRepository.exportArchiveJson();
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe(1);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.storageSchemaVersion).toBeGreaterThan(0);
    expect(parsed.policyVersion).toBeGreaterThan(0);
    expect(parsed.consentVersion).toBeTruthy();
    expect(parsed.sessions).toHaveLength(1);
    expect(parsed.skillObservations).toBeInstanceOf(Array);
    expect(parsed.skillLapses).toBeInstanceOf(Array);
    expect(parsed.consentRecords).toBeInstanceOf(Array);
    expect(parsed.pendingJobs).toBeInstanceOf(Array);
    expect(parsed.deletionMarkers).toBeInstanceOf(Array);
    expect(parsed.contentProvenance).toEqual([
      expect.objectContaining({
        sessionId: expect.any(String),
        missionId: expect.any(String),
        missionVersion: expect.any(Number),
      }),
    ]);
  });

  it('rejects malformed JSON without throwing', async () => {
    const result = await archiveRepository.importArchiveJson('{not json');
    expect(result.success).toBe(false);
  });

  it('rejects a non-object payload', async () => {
    const result = await archiveRepository.importArchiveJson('"a string"');
    expect(result.success).toBe(false);
  });

  it('does not activate imported observations or imported recall projections', async () => {
    const poisonedSession = makeSession({
      passages: [makePassage('p-1', 'un café con leche')],
      observations: [makeObservation()],
    });
    const [phrase] = await archiveRepository.getPhrases();
    const payload = JSON.stringify({
      version: 1,
      schemaVersion: 1,
      sessions: [poisonedSession],
      phrases: [
        {
          ...phrase,
          recallStatus: 'steady',
          scheduling: {
            ...phrase.scheduling,
            nextReviewAt: '2099-01-01T00:00:00.000Z',
            due: false,
          },
          stats: {
            ...phrase.stats,
            unassistedCount: 999,
            spokenCount: 999,
          },
        },
      ],
      observations: poisonedSession.observations,
    });

    const result = await archiveRepository.importArchiveJson(payload);

    expect(result.success).toBe(true);
    expect(result.counts?.observations).toBe(0);
    expect(await archiveRepository.getObservations()).toEqual([]);
    const stored = await archiveRepository.getSessionById(poisonedSession.id);
    expect(stored?.observations ?? []).toEqual([]);
    const importedPhrase = (await archiveRepository.getPhrases()).find(p => p.id === phrase.id);
    expect(importedPhrase?.recallStatus).toBe('new');
    expect(importedPhrase?.stats.unassistedCount).toBe(0);
    expect(importedPhrase?.scheduling.due).toBe(true);
  });
});

describe('phrase catalog merging', () => {
  it('seeds the catalog on first read', async () => {
    const phrases = await archiveRepository.getPhrases();
    expect(phrases.length).toBeGreaterThan(0);
    expect(phrases.every(p => p.difficulty)).toBe(true);
  });

  it('derives due from the schedule rather than storing it', async () => {
    const phrases = await archiveRepository.getPhrases();
    for (const phrase of phrases) {
      const derived = new Date(phrase.scheduling.nextReviewAt).getTime() <= Date.now();
      expect(phrase.scheduling.due).toBe(derived);
    }
  });
});
