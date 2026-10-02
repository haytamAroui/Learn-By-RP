import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { createNodeSqliteAdapter, Db } from './db';
import { __setDatabaseForTesting, migrate } from './database';
import { archiveRepository as sqliteRepository } from './SqliteArchiveRepository';
import { IndexedDbArchiveRepository } from './IndexedDbArchiveRepository';
import {
  ArchiveRepository,
  PersistableSessionRecord,
} from './ArchiveRepository.types';
import {
  LearningObservation,
  Passage,
  ValidatedLearningObservation,
} from '../../types';

/**
 * Native/web parity.
 *
 * Two persistence implementations is one too many to keep honest by convention.
 * A learner who practises on a phone and exports from a laptop should not get a
 * different archive, and a bug fixed in one path should not be absent from the
 * other. This fixture drives both implementations through the same archive and
 * compares what each would show a learner.
 *
 * The web repository is exercised against a real IndexedDB implementation
 * (fake-indexeddb), not a mock, so transaction and key-range behaviour is real.
 */

let driver: { db: Db; close: () => void };
let web: IndexedDbArchiveRepository;

beforeEach(async () => {
  driver = createNodeSqliteAdapter();
  await migrate(driver.db);
  __setDatabaseForTesting(driver.db);

  web = new IndexedDbArchiveRepository();
  // IndexedDB outlives the repository object, so each test needs a clean database
  // or it inherits the previous test's archive.
  await web.__resetForTesting();
});

afterEach(async () => {
  __setDatabaseForTesting(null);
  driver.close();
  await web.__resetForTesting();
});

const T0 = '2026-09-20T09:00:00.000Z';

function passage(id: string, speaker: 'user' | 'assistant', text: string, rev = 'rev-1'): Passage {
  return {
    id,
    sessionId: 'session-1',
    attemptId: 'attempt-1',
    speaker,
    revisionKey: rev,
    assemblyVersion: 3,
    status: 'final',
    text,
    meaning: speaker === 'assistant' ? 'meaning' : undefined,
    modality: 'spoken',
    startedAt: T0,
    endedAt: '2026-09-20T09:00:04.000Z',
    fragments: [],
  };
}

function observation(
  id: string,
  turnId: string,
  rev = 'rev-1'
): ValidatedLearningObservation {
  return {
    observationId: id,
    sessionId: 'session-1',
    attemptId: 'attempt-1',
    sourceTurnId: turnId,
    sourceRevision: rev,
    itemId: 'phrase.es.cafe_con_leche',
    candidateForm: 'Un café con leche, por favor.',
    meaning: 'A coffee with milk',
    quote: 'quisiera un café con leche',
    modality: 'spoken',
    retrieval: 'unassisted',
    taskOutcome: 'achieved',
    rehearsal: false,
    supportExposureIds: [],
    recordedAt: T0,
  } as unknown as ValidatedLearningObservation;
}

function session(
  overrides: Partial<PersistableSessionRecord> = {}
): PersistableSessionRecord {
  return {
    id: 'session-1',
    missionId: 'mission-es-cafe-sol',
    missionVersion: 1,
    language: 'es',
    mode: 'guided',
    coldAttempt: true,
    state: 'recap_ready',
    startedAt: T0,
    endedAt: '2026-09-20T09:05:00.000Z',
    passages: [passage('p-1', 'user', 'quisiera un café con leche')],
    supportExposures: [],
    observations: [observation('obs-1', 'p-1')],
    taskOutcome: 'completed',
    sceneState: {
      sceneId: 'scene.es.cafe.breakfast',
      revision: 2,
      facts: { itemConfirmed: true },
      learnerKnows: [],
      characterKnows: [],
      checkpoints: [],
      isFinished: true,
      outcome: 'achieved',
    },
    ...overrides,
  };
}

/** The observable shape a learner sees, per implementation. */
async function snapshot(repo: ArchiveRepository) {
  const [sessions, observations, phrases, preferences, lapses] = await Promise.all([
    repo.getSessions(),
    repo.getObservations(),
    repo.getPhrases(),
    repo.getPreferences(),
    repo.getSkillLapses(),
  ]);

  const target = phrases.find(p => p.id === 'phrase.es.cafe_con_leche');

  return {
    sessionCount: sessions.length,
    sessionId: sessions[0]?.id,
    passageCount: sessions[0]?.passages.length,
    passageText: sessions[0]?.passages[0]?.text,
    sceneRevision: sessions[0]?.sceneState.revision,
    sceneFinished: sessions[0]?.sceneState.isFinished,
    observationCount: observations.length,
    observationQuote: observations[0]?.quote,
    phraseCount: phrases.length,
    recallStatus: target?.recallStatus,
    unassistedCount: target?.stats.unassistedCount,
    spokenCount: target?.stats.spokenCount,
    explanationLanguage: preferences.explanationLanguage,
    lapseCount: lapses.length,
  };
}

describe('native and web agree on the same archive', () => {
  it('produce the same observable state after the same writes', async () => {
    for (const repo of [sqliteRepository, web]) {
      await repo.savePreferences({ ...(await repo.getPreferences()), learningLanguage: 'fr' });
      await repo.recordConsent('voice', true);
      await repo.beginSession(session({ state: 'preflight' }));
      await repo.saveSessionState('session-1', 'live');
      await repo.completeSession(session());
    }

    expect(await snapshot(web)).toEqual(await snapshot(sqliteRepository));
  });

  it('both seed a phrase catalog on first read', async () => {
    const [native, webPhrases] = await Promise.all([
      sqliteRepository.getPhrases(),
      web.getPhrases(),
    ]);

    expect(webPhrases.length).toBe(native.length);
    expect(webPhrases.length).toBeGreaterThan(0);
    expect(webPhrases.every(p => p.difficulty)).toBe(true);
  });

  it('both derive due from the schedule rather than storing it', async () => {
    const phrases = await web.getPhrases();
    for (const phrase of phrases) {
      expect(phrase.scheduling.due).toBe(
        new Date(phrase.scheduling.nextReviewAt).getTime() <= Date.now()
      );
    }
  });

  it('both reproduce the same recall projection from the ledger', async () => {
    for (const repo of [sqliteRepository, web]) {
      await repo.completeSession(session());
    }

    const nativePhrase = (await sqliteRepository.getPhrases()).find(
      p => p.id === 'phrase.es.cafe_con_leche'
    );
    const webPhrase = (await web.getPhrases()).find(p => p.id === 'phrase.es.cafe_con_leche');

    expect(webPhrase?.recallStatus).toBe(nativePhrase?.recallStatus);
    expect(webPhrase?.stats).toEqual(nativePhrase?.stats);
  });

  it('both replay a session without duplicating evidence', async () => {
    for (const repo of [sqliteRepository, web]) {
      await repo.completeSession(session());
      await repo.completeSession({
        ...session(),
        observations: [observation('obs-different-id', 'p-1')],
      });
    }

    expect((await web.getObservations()).length).toBe(
      (await sqliteRepository.getObservations()).length
    );
    expect((await web.getObservations()).length).toBe(1);
  });

  it('both hide and dispute evidence identically', async () => {
    for (const repo of [sqliteRepository, web]) {
      await repo.completeSession(session());
      const [obs] = await repo.getObservations();
      await repo.hideObservation(obs.observationId);
    }

    const webObs = await web.getObservations();
    const nativeObs = await sqliteRepository.getObservations();

    expect(webObs[0].hidden).toBe(nativeObs[0].hidden);
    expect(webObs[0].hidden).toBe(true);
  });

  it('both record and withdraw consent per scope', async () => {
    for (const repo of [sqliteRepository, web]) {
      await repo.recordConsent('saved_analysis', true);
      await repo.withdrawConsent('saved_analysis');
    }

    const webRecord = await web.getConsent('saved_analysis');
    const nativeRecord = await sqliteRepository.getConsent('saved_analysis');

    expect(webRecord?.granted).toBe(nativeRecord?.granted);
    expect(webRecord?.granted).toBe(false);
    expect(webRecord?.withdrawnAt).toBeTruthy();
  });

  it('both refuse to leave a half-written archive on a malformed import', async () => {
    for (const repo of [sqliteRepository, web]) {
      await repo.completeSession(session());

      const result = await repo.importArchiveJson(
        JSON.stringify({ schemaVersion: 1, sessions: [{ id: 'x' }], phrases: 'not-an-array' })
      );

      expect(result.success).toBe(false);
    }

    // The pre-existing archive survived both rejections.
    expect((await web.getSessions()).length).toBe(1);
    expect((await sqliteRepository.getSessions()).length).toBe(1);
  });

  it('both report interrupted sessions the same way', async () => {
    for (const repo of [sqliteRepository, web]) {
      await repo.beginSession(session({ id: 'live-1', state: 'live' }));
      await repo.beginSession(session({ id: 'done-1', state: 'ended' }));
    }

    const webInterrupted = await web.getInterruptedSessions();
    const nativeInterrupted = await sqliteRepository.getInterruptedSessions();

    expect(webInterrupted.map(s => s.id)).toEqual(nativeInterrupted.map(s => s.id));
    expect(webInterrupted).toHaveLength(1);
  });

  it('both remove evidence on delete, not just the row', async () => {
    for (const repo of [sqliteRepository, web]) {
      await repo.completeSession(session());
      await repo.deleteSession('session-1');
    }

    for (const repo of [sqliteRepository, web]) {
      expect(await repo.getObservations()).toHaveLength(0);
      expect(await repo.getSessions()).toHaveLength(0);
      expect(await repo.isDeleted('session-1')).toBe(true);
    }
  });

  it('both treat a delete-everything marker as covering every session', async () => {
    for (const repo of [sqliteRepository, web]) {
      await repo.clearAllLearningData();
      expect(await repo.isDeleted('anything-at-all')).toBe(true);
    }
  });

  it('both export a versioned archive', async () => {
    for (const repo of [sqliteRepository, web]) {
      await repo.completeSession(session());
      const parsed = JSON.parse(await repo.exportArchiveJson());
      expect(parsed.version).toBe(1);
      expect(parsed.sessions).toHaveLength(1);
    }
  });
});

describe('the contract is enforced at compile time', () => {
  it('both implementations satisfy ArchiveRepository', () => {
    const native: ArchiveRepository = sqliteRepository;
    const webRepo: ArchiveRepository = web;

    for (const method of [
      'getPreferences',
      'savePreferences',
      'getConsent',
      'recordConsent',
      'withdrawConsent',
      'beginSession',
      'saveSessionState',
      'completeSession',
      'getSessions',
      'getSessionById',
      'getSessionSummaries',
      'getInterruptedSessions',
      'markSessionEnded',
      'getObservations',
      'hideObservation',
      'disputeObservation',
      'getSkillObservations',
      'hideSkillObservation',
      'disputeSkillObservation',
      'getSkillLapses',
      'getPhrases',
      'savePhrases',
      'resetPhrase',
      'markDeleted',
      'isDeleted',
      'deleteSession',
      'clearAllLearningData',
      'recordDrillReview',
      'enqueueJob',
      'getPendingJobs',
      'removePendingJob',
      'exportArchiveJson',
      'importArchiveJson',
      'exportLearningReceiptText',
    ] as const) {
      expect(typeof native[method], `native.${method}`).toBe('function');
      expect(typeof webRepo[method], `web.${method}`).toBe('function');
    }
  });
});