import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBObjectStore as FakeObjectStore } from 'fake-indexeddb';
import { createNodeSqliteAdapter, Db } from './db';
import { __setDatabaseForTesting, migrate } from './database';
import { archiveRepository as sqliteRepository } from './SqliteArchiveRepository';
import { IndexedDbArchiveRepository } from './IndexedDbArchiveRepository';
import { ArchiveRepository } from './ArchiveRepository.types';
import {
  LearningObservation,
  Passage,
  SessionRecord,
  SkillLapse,
  SkillObservation,
  SupportExposure,
} from '../../types';
import { buildLocalObservations, validateDrillReview } from '../learning/learningCore';

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

describe('saved-analysis consent at the persistence boundary', () => {
  it.each(['unknown', 'denied', 'withdrawn'] as const)('%s saves the transcript without new evidence', async state => {
    for (const repo of [sqliteRepository, web]) {
      if (state === 'denied') await repo.recordConsent('saved_analysis', false);
      if (state === 'withdrawn') {
        await repo.recordConsent('saved_analysis', true);
        await repo.withdrawConsent('saved_analysis');
      }
      const input = session({ summary: 'Assessed feedback', actionableFeedback: ['Assessed advice'] });
      const evidence = phraseEvidenceFor(input);
      expect(evidence.observations).toHaveLength(1);
      await repo.completeSession(input, [], undefined, evidence);
      expect(await repo.getObservations()).toEqual([]);
      const saved = await repo.getSessionById(input.id);
      expect(saved?.passages).toHaveLength(1);
      expect(saved?.actionableFeedback ?? []).toEqual([]);
      expect(saved?.summary).toBeFalsy();
    }
  });

  it('rejects a drill bundle prepared before withdrawal and preserves prior evidence', async () => {
    for (const repo of [sqliteRepository, web]) {
      await completeWithEvidence(repo, session());
      const phrase = (await repo.getPhrases()).find(p => p.id === 'phrase.es.cafe_con_leche')!;
      const evidence = validateDrillReview({
        phrase, quote: phrase.form, modality: 'spoken', selfReportedResult: 'remembered',
        learnerAttemptCaptured: true, answerRevealedBeforeAttempt: false, modelAudioPlayedBeforeAttempt: false,
      });
      expect(evidence.observations).toHaveLength(1);
      const before = await repo.getObservations();
      await repo.withdrawConsent('saved_analysis');
      await repo.recordDrillReview({ phrase, evidence });
      expect(await repo.getObservations()).toEqual(before);
      expect((await repo.getPhrases()).find(p => p.id === phrase.id)).toEqual(phrase);
    }
  });
});

const T0 = '2026-09-20T09:00:00.000Z';

describe('durable live activity on both storage backends', () => {
  it('restores turns, support, scene, attempts and program context without awarding evidence', async () => {
    for (const repo of [sqliteRepository, web]) {
      await repo.recordConsent('saved_analysis', true);
      const initial = session({ state: 'preflight', passages: [], observations: [], endedAt: undefined });
      await repo.beginSession(initial);
      const progress = session({ state: 'live', endedAt: undefined, activeAttemptId: 'attempt-2',
        supportExposures: [{ id: 'help-1', sessionId: initial.id, attemptId: 'attempt-1', source: 'coach',
          kind: 'full_form', targetItemIds: ['phrase.es.cafe_con_leche'], exposure: 'visible', recordedAt: T0 }],
        attemptHistory: [{ id: 'attempt-1', rehearsal: false, createdAt: T0 },
          { id: 'attempt-2', parentAttemptId: 'attempt-1', checkpointId: 'cp-start', sceneRevision: 1, rehearsal: true, createdAt: T0 }],
        programContext: { programId: 'test-program', programVersion: 1, finalSimulation: false },
        summary: 'Unvalidated feedback', actionableFeedback: ['Unvalidated advice'],
      });
      await repo.saveSessionProgress(progress);
      await repo.beginSession(initial);
      const restored = await repo.getSessionById(initial.id);
      expect(restored?.passages).toEqual(progress.passages);
      expect(restored?.supportExposures).toMatchObject(progress.supportExposures);
      expect(restored?.sceneState).toMatchObject(progress.sceneState);
      expect(restored?.activeAttemptId).toBe('attempt-2');
      expect(restored?.attemptHistory).toEqual(progress.attemptHistory);
      expect(restored?.programContext).toEqual(progress.programContext);
      expect(restored?.endedAt).toBeFalsy();
      expect(restored?.observations).toEqual([]);
      expect(restored?.summary).toBeFalsy();
      expect(restored?.actionableFeedback ?? []).toEqual([]);
      expect(await repo.getObservations()).toEqual([]);
    }
  });

  it('late progress and lifecycle writes cannot reopen a completed or deleted session', async () => {
    for (const repo of [sqliteRepository, web]) {
      const initial = session({ state: 'live', endedAt: undefined });
      await repo.beginSession(initial);
      await repo.completeSession(session());
      await repo.saveSessionProgress({ ...initial, passages: [] });
      await repo.saveSessionState(initial.id, 'live');
      expect((await repo.getSessionById(initial.id))?.state).toBe('recap_ready');
      await repo.deleteSession(initial.id);
      await repo.saveSessionProgress(initial);
      expect(await repo.getSessionById(initial.id)).toBeFalsy();
    }
  });
});

describe('phrase projection integrity', () => {
  const phraseId = 'phrase.es.cafe_con_leche';

  it('repairs old materialized recall caches from the ledger without creating evidence', async () => {
    for (const repo of [sqliteRepository, web]) {
      const phrase = (await repo.getPhrases()).find(p => p.id === phraseId)!;
      await repo.savePhrases([{ ...phrase, recallStatus: 'steady', stats: {
        ...phrase.stats, unassistedCount: 2, spokenCount: 2,
      }, scheduling: { ...phrase.scheduling, intervalDays: 14, modalityHistory: ['spoken'], nextReviewAt: '2099-01-01T00:00:00.000Z' } }]);
      await repo.rebuildPhraseProjections();
      const repaired = (await repo.getPhrases()).find(p => p.id === phraseId)!;
      expect(repaired.recallStatus).toBe('new');
      expect(repaired.stats.unassistedCount).toBe(0);
      expect(repaired.scheduling.due).toBe(true);
      expect(await repo.getObservations()).toEqual([]);
      await completeWithEvidence(repo, session());
      await repo.savePhrases([{ ...repaired, recallStatus: 'supported' }]);
      await repo.rebuildPhraseProjections();
      expect((await repo.getPhrases()).find(p => p.id === phraseId)?.recallStatus).toBe('growing');
      expect(await repo.getObservations()).toHaveLength(1);
    }
  });

  it.each(['hide', 'dispute', 'delete'] as const)('clears recall and scheduling after %s removes the last usable observation', async action => {
    for (const repo of [sqliteRepository, web]) {
      await completeWithEvidence(repo, session());
      const before = (await repo.getPhrases()).find(p => p.id === phraseId)!;
      expect(before.recallStatus).toBe('growing');
      const [observation] = await repo.getObservations();
      if (action === 'hide') await repo.hideObservation(observation.observationId);
      if (action === 'dispute') await repo.disputeObservation(observation.observationId);
      if (action === 'delete') await repo.deleteSession('session-1');
      const after = (await repo.getPhrases()).find(p => p.id === phraseId)!;
      expect(after.recallStatus).toBe('new');
      expect(after.stats).toEqual({ assistedCount: 0, unassistedCount: 0, spokenCount: 0, typedCount: 0 });
      expect(after.scheduling.due).toBe(true);
      expect(after.scheduling.intervalDays).toBe(1);
      expect(after.scheduling.modalityHistory).toEqual([]);
      expect(Date.parse(after.scheduling.nextReviewAt)).toBeLessThanOrEqual(Date.now());
      if (action !== 'delete') {
        const archived = await repo.getSessionById('session-1');
        expect(archived?.observations[0].hidden).toBe(true);
        if (action === 'dispute') expect(archived?.observations[0].userDisputed).toBe(true);
      }
    }
  });

  it('projects a supported drill from all prior evidence, even with a stale phrase supplied by the caller', async () => {
    for (const repo of [sqliteRepository, web]) {
      const stalePhrase = (await repo.getPhrases()).find(p => p.id === phraseId)!;
      await completeWithEvidence(repo, session());
      const evidence = validateDrillReview({
        phrase: stalePhrase, quote: stalePhrase.form, modality: 'spoken', selfReportedResult: 'supported',
        learnerAttemptCaptured: true, answerRevealedBeforeAttempt: true, modelAudioPlayedBeforeAttempt: false,
      });
      await repo.recordDrillReview({ phrase: stalePhrase, evidence });
      const after = (await repo.getPhrases()).find(p => p.id === phraseId)!;
      expect(after.recallStatus).toBe('growing');
      expect(after.stats.unassistedCount).toBe(1);
      expect(after.stats.assistedCount).toBe(1);
      expect(after.stats.spokenCount).toBe(2);
      await repo.recordDrillReview({ phrase: stalePhrase, evidence });
      expect((await repo.getPhrases()).find(p => p.id === phraseId)?.stats).toEqual(after.stats);
    }
  });

  it('does not transfer an observation into another item with the same displayed form', async () => {
    for (const repo of [sqliteRepository, web]) {
      const source = (await repo.getPhrases()).find(p => p.id === phraseId)!;
      await repo.savePhrases([{ ...source, id: 'distinct-authored-target' }]);
      await completeWithEvidence(repo, session({ passages: [passage('p-1', 'user', source.form)] }));
      const other = (await repo.getPhrases()).find(p => p.id === 'distinct-authored-target')!;
      expect(other.recallStatus).toBe('new');
      expect(other.stats.unassistedCount).toBe(0);
    }
  });

  it('rolls back a web drill ledger write when its projection cannot be written', async () => {
    const phrase = (await web.getPhrases()).find(p => p.id === phraseId)!;
    await web.recordConsent('saved_analysis', true);
    const evidence = validateDrillReview({
      phrase, quote: phrase.form, modality: 'spoken', selfReportedResult: 'remembered',
      learnerAttemptCaptured: true, answerRevealedBeforeAttempt: false, modelAudioPlayedBeforeAttempt: false,
    });
    const original = FakeObjectStore.prototype.put;
    const fault = vi.spyOn(FakeObjectStore.prototype, 'put').mockImplementation(function(
      this: InstanceType<typeof FakeObjectStore>, value: unknown, key?: Parameters<typeof original>[1]
    ) {
      if (this.name === 'phrases') throw new Error('projection write failed');
      return original.call(this, value, key);
    });
    try {
      await expect(web.recordDrillReview({ phrase, evidence })).rejects.toThrow('projection write failed');
    } finally {
      fault.mockRestore();
    }
    expect(await web.getObservations()).toEqual([]);
    expect((await web.getPhrases()).find(p => p.id === phraseId)?.recallStatus).toBe('new');
  });

  it('serializes concurrent web drills without dropping either observation from the projection', async () => {
    const phrase = (await web.getPhrases()).find(p => p.id === phraseId)!;
    await web.recordConsent('saved_analysis', true);
    const input = { phrase, quote: phrase.form, modality: 'spoken' as const,
      learnerAttemptCaptured: true, answerRevealedBeforeAttempt: false, modelAudioPlayedBeforeAttempt: false };
    const independent = validateDrillReview({ ...input, selfReportedResult: 'remembered' });
    const supported = validateDrillReview({ ...input, selfReportedResult: 'supported', answerRevealedBeforeAttempt: true });
    await Promise.all([
      web.recordDrillReview({ phrase, evidence: independent }),
      web.recordDrillReview({ phrase, evidence: supported }),
    ]);
    const projected = (await web.getPhrases()).find(p => p.id === phraseId)!;
    expect(projected.stats.unassistedCount).toBe(1);
    expect(projected.stats.assistedCount).toBe(1);
  });

  it.each([false, true])('delayed drills require distinct practice sittings for steady recall: %s', async distinctSittings => {
    for (const repo of [sqliteRepository, web]) {
      const phrase = (await repo.getPhrases()).find(p => p.id === phraseId)!;
      await repo.recordConsent('saved_analysis', true);
      const input = { phrase, quote: phrase.form, modality: 'spoken' as const, selfReportedResult: 'remembered' as const,
        learnerAttemptCaptured: true, answerRevealedBeforeAttempt: false, modelAudioPlayedBeforeAttempt: false };
      const first = validateDrillReview({ ...input, practiceSessionId: 'drill-practice-1', recordedAt: T0 });
      const later = validateDrillReview({ ...input, practiceSessionId: distinctSittings ? 'drill-practice-2' : 'drill-practice-1',
        recordedAt: '2026-09-28T09:00:00.000Z' });
      await repo.recordDrillReview({ phrase, evidence: first });
      await repo.recordDrillReview({ phrase, evidence: later });
      const projected = (await repo.getPhrases()).find(p => p.id === phraseId)!;
      expect(projected.stats.unassistedCount).toBe(2);
      expect(projected.recallStatus).toBe(distinctSittings ? 'steady' : 'growing');
    }
  });
});

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

function observation(id: string, turnId: string, rev = 'rev-1'): LearningObservation {
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
  };
}

function session(overrides: Partial<SessionRecord> = {}): SessionRecord {
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


function phraseEvidenceFor(sessionValue: SessionRecord) {
  const candidates = (sessionValue.observations ?? []).map(observationValue => {
    const source = sessionValue.passages.find(
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
    sessionId: sessionValue.id,
    attemptId: sessionValue.observations?.[0]?.attemptId ?? 'attempt-1',
    passages: sessionValue.passages,
    supportExposures: sessionValue.supportExposures,
    candidates,
    isColdAttempt: sessionValue.coldAttempt,
    isRehearsalAttempt: false,
  }).evidence;
}

async function completeWithEvidence(
  repoValue: ArchiveRepository,
  sessionValue: SessionRecord
): Promise<void> {
  await repoValue.recordConsent('saved_analysis', true);
  await repoValue.completeSession(
    { ...sessionValue, observations: [] },
    [],
    undefined,
    phraseEvidenceFor(sessionValue)
  );
}

function rawSkillObservation(): SkillObservation {
  return {
    id: 'raw-skill-obs',
    skillId: 'skill-request-substitution',
    sessionId: 'session-1',
    attemptId: 'attempt-1',
    sourcePassageId: 'p-1',
    sourceRevision: 'rev-1',
    contextKey: {
      domainId: 'cafes',
      scenarioFamilyId: 'counter-ordering',
      scenarioId: 'scene.es.cafe.breakfast',
    },
    modality: 'spoken',
    retrieval: 'unassisted',
    taskOutcome: 'achieved',
    demonstration: 'demonstrated',
    opportunityInstanceId: 'raw-opportunity',
    supportExposureIds: [],
    evidenceSource: 'validated_explicit',
    quote: 'quisiera un café con leche',
    recordedAt: T0,
  };
}

function rawSkillLapse(): SkillLapse {
  return {
    id: 'raw-skill-lapse',
    skillId: 'skill-request-substitution',
    sessionId: 'session-1',
    attemptId: 'attempt-1',
    sourcePassageId: 'p-1',
    sourceRevision: 'rev-1',
    contextKey: {
      domainId: 'cafes',
      scenarioFamilyId: 'counter-ordering',
      scenarioId: 'scene.es.cafe.breakfast',
    },
    opportunityInstanceId: 'raw-opportunity',
    demonstration: 'attempted_not_demonstrated',
    basis: 'cold_attempt_failed',
    recordedAt: T0,
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
    supportExposureIds: sessions[0]?.supportExposures.map(exposure => exposure.id).sort() ?? [],
    /*
      The exported receipt, compared as a whole.

      It was left out of this snapshot, and the two archives had drifted: SQLite emitted
      language, mode, start time, outcome and a per-phrase recall status while IndexedDB
      emitted none of them and formatted phrases differently. Same learner, different file
      depending on platform. A method-existence assertion cannot catch that, so the text
      itself is part of the observable state.
    */
    receipt: sessions[0]
      ? await repo.exportLearningReceiptText(sessions[0])
      : null,
  };
}

describe('native and web agree on the same archive', () => {
  it('produce the same observable state after the same writes', async () => {
    for (const repo of [sqliteRepository, web]) {
      await repo.savePreferences({ ...(await repo.getPreferences()), learningLanguage: 'fr' });
      await repo.recordConsent('voice', true);
      await repo.beginSession(session({ state: 'preflight' }));
      await repo.saveSessionState('session-1', 'live');
      await completeWithEvidence(repo, session());
    }

    expect(await snapshot(web)).toEqual(await snapshot(sqliteRepository));
  });


  it('both refuse raw SessionRecord skill evidence without a validator bundle', async () => {
    const poisoned = session({
      skillObservations: [rawSkillObservation()],
      skillLapses: [rawSkillLapse()],
    });

    for (const repo of [sqliteRepository, web]) {
      await repo.beginSession(poisoned);
      await completeWithEvidence(repo, poisoned);
      expect(await repo.getSkillObservations()).toEqual([]);
      expect(await repo.getSkillLapses()).toEqual([]);

      const stored = await repo.getSessionById('session-1');
      expect(stored?.skillObservations ?? []).toEqual([]);
      expect(stored?.skillLapses ?? []).toEqual([]);
    }
  });

  it('both append post-session support exposures idempotently', async () => {
    const recapExposure: SupportExposure = {
      id: 'exp-recap-session-1-phrase.es.cafe_con_leche',
      sessionId: 'session-1',
      attemptId: 'attempt-1',
      source: 'recap',
      kind: 'recap_exposure',
      targetPhraseId: 'phrase.es.cafe_con_leche',
      targetItemIds: ['phrase.es.cafe_con_leche'],
      exposure: 'visible',
      recordedAt: '2026-09-20T09:06:00.000Z',
    };

    for (const repo of [sqliteRepository, web]) {
      await completeWithEvidence(repo, session());
      await repo.appendSupportExposures('session-1', [recapExposure]);
      await repo.appendSupportExposures('session-1', [
        { ...recapExposure, recordedAt: '2026-09-20T09:20:00.000Z' },
      ]);
    }

    const native = await sqliteRepository.getSessionById('session-1');
    const webSession = await web.getSessionById('session-1');

    expect(native?.supportExposures).toHaveLength(1);
    expect(native?.supportExposures[0].recordedAt).toBe('2026-09-20T09:06:00.000Z');
    expect(webSession?.supportExposures).toEqual(native?.supportExposures);
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
      await completeWithEvidence(repo, session());
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
      await completeWithEvidence(repo, session());
      await completeWithEvidence(repo, {
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
      await completeWithEvidence(repo, session());
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
      await completeWithEvidence(repo, session());

      const result = await repo.importArchiveJson(
        JSON.stringify({ schemaVersion: 1, sessions: [{ id: 'x' }], phrases: 'not-an-array' })
      );

      expect(result.success).toBe(false);
    }

    // The pre-existing archive survived both rejections.
    expect((await web.getSessions()).length).toBe(1);
    expect((await sqliteRepository.getSessions()).length).toBe(1);
  });

  it('does not promote imported phrase observations into evidence stores or recap caches', async () => {
    const poisoned = session();
    const payload = JSON.stringify({
      version: 1,
      schemaVersion: 1,
      sessions: [poisoned],
      phrases: [],
      observations: poisoned.observations,
    });

    for (const repo of [sqliteRepository, web]) {
      const result = await repo.importArchiveJson(payload);
      expect(result.success).toBe(true);
      expect(result.counts?.observations).toBe(0);
      expect(await repo.getObservations()).toEqual([]);
      const stored = await repo.getSessionById('session-1');
      expect(stored?.observations ?? []).toEqual([]);
    }
  });

  it('does not promote imported embedded skill arrays into evidence stores', async () => {
    const poisoned = session({
      skillObservations: [rawSkillObservation()],
      skillLapses: [rawSkillLapse()],
    });
    const payload = JSON.stringify({
      version: 1,
      schemaVersion: 1,
      sessions: [poisoned],
      phrases: [],
      observations: [],
    });

    for (const repo of [sqliteRepository, web]) {
      expect((await repo.importArchiveJson(payload)).success).toBe(true);
      await completeWithEvidence(repo, poisoned);
      expect(await repo.getSkillObservations()).toEqual([]);
      expect(await repo.getSkillLapses()).toEqual([]);
    }
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
      await completeWithEvidence(repo, session());
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

  it('both reject late completion after a learner deletes the session', async () => {
    for (const repo of [sqliteRepository, web]) {
      const original = session({ startedAt: '2026-10-01T10:00:00.000Z' });
      await completeWithEvidence(repo, original);
      await repo.deleteSession(original.id);
      await completeWithEvidence(repo, original);

      expect(await repo.getSessionById(original.id)).toBeNull();
      expect(await repo.getObservations()).toEqual([]);
    }
  });

  it('both allow fresh sessions created after a delete-all generation', async () => {
    for (const repo of [sqliteRepository, web]) {
      await repo.clearAllLearningData();
      const fresh = session({
        id: 'session-after-erase',
        startedAt: '2099-01-01T00:00:00.000Z',
      });
      await repo.beginSession(fresh);
      expect(await repo.getSessionById(fresh.id)).not.toBeNull();
      expect(await repo.isDeleted(fresh.id, fresh.startedAt)).toBe(false);
    }
  });

  it('both export a versioned archive', async () => {
    for (const repo of [sqliteRepository, web]) {
      await completeWithEvidence(repo, session());
      const parsed = JSON.parse(await repo.exportArchiveJson());
      expect(parsed.version).toBe(1);
      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.storageSchemaVersion).toBeGreaterThan(0);
      expect(parsed.sessions).toHaveLength(1);
      expect(parsed.skillObservations).toBeInstanceOf(Array);
      expect(parsed.skillLapses).toBeInstanceOf(Array);
      expect(parsed.consentRecords).toBeInstanceOf(Array);
      expect(parsed.pendingJobs).toBeInstanceOf(Array);
      expect(parsed.deletionMarkers).toBeInstanceOf(Array);
      expect(parsed.contentProvenance).toHaveLength(1);
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
      'appendSupportExposures',
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
      'rebuildPhraseProjections',
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

    expect('saveSkillObservations' in native).toBe(false);
    expect('saveSkillObservations' in webRepo).toBe(false);
  });
});
