import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createNodeSqliteAdapter, Db } from './db';
import { __setDatabaseForTesting, migrate } from './database';
import { archiveRepository } from './SqliteArchiveRepository';
import { MIGRATIONS } from './schema';
import { LEARNING_POLICY_VERSION } from '../learning/policy';
import { EvidenceSource, SkillObservation } from '../../types';

/**
 * Skill evidence persistence.
 *
 * A skill claim that does not survive a restart is not a claim. These run against
 * real SQLite, so the schema, the uniqueness constraint and the round-trip are
 * verified rather than assumed.
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

function observation(overrides: Partial<SkillObservation> = {}): SkillObservation {
  const base: SkillObservation = {
    id: 'so-1',
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
    domainId: 'cafes',
    scenarioId: 'scene.es.cafe.breakfast',
    modality: 'spoken',
    retrieval: 'unassisted',
    taskOutcome: 'achieved',
    supportExposureIds: [],
    evidenceSource: 'validated_explicit',
    quote: '¿Tiene leche de avena?',
    recordedAt: '2026-09-20T09:00:00.000Z',
  };
  return {
    ...base,
    ...overrides,
    contextKey: overrides.contextKey ?? base.contextKey,
  };
}

describe('skill observation schema', () => {
  it('has a migration for the table', () => {
    const ddl = MIGRATIONS.flatMap(m => m.statements).join('\n');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS skill_observations');
  });
});

describe('saveSkillObservations / getSkillObservations', () => {
  it('round-trips a validated observation', async () => {
    await archiveRepository.saveSkillObservations([observation()]);
    const loaded = await archiveRepository.getSkillObservations();

    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject({
      id: 'so-1',
      skillId: 'skill-request-substitution',
      sourcePassageId: 'p-1',
      sourceRevision: 'rev-1',
      domainId: 'cafes',
      scenarioId: 'scene.es.cafe.breakfast',
      contextKey: {
        domainId: 'cafes',
        scenarioFamilyId: 'counter-ordering',
        scenarioId: 'scene.es.cafe.breakfast',
      },
      modality: 'spoken',
      retrieval: 'unassisted',
      taskOutcome: 'achieved',
      evidenceSource: 'validated_explicit',
      quote: '¿Tiene leche de avena?',
    });
  });

  // The provenance distinction is the whole reason this table exists.
  it('preserves the legacy inferred marker', async () => {
    await archiveRepository.saveSkillObservations([
      observation({ id: 'so-old', evidenceSource: 'legacy_inferred' }),
    ]);

    const loaded = await archiveRepository.getSkillObservations();
    expect(loaded[0].evidenceSource).toBe('legacy_inferred');
  });

  it('round-trips support exposure references', async () => {
    await archiveRepository.saveSkillObservations([
      observation({ supportExposureIds: ['exp-1', 'exp-2'] }),
    ]);

    const loaded = await archiveRepository.getSkillObservations();
    expect(loaded[0].supportExposureIds).toEqual(['exp-1', 'exp-2']);
  });

  it('round-trips the exam context when present', async () => {
    await archiveRepository.saveSkillObservations([
      observation({ examProgramId: 'delf-b1', examTaskId: 'interaction-1' }),
    ]);

    const loaded = await archiveRepository.getSkillObservations();
    expect(loaded[0].examProgramId).toBe('delf-b1');
    expect(loaded[0].examTaskId).toBe('interaction-1');
  });

  it('leaves absent optional context undefined rather than empty strings', async () => {
    await archiveRepository.saveSkillObservations([
      observation({ domainId: undefined, scenarioId: undefined }),
    ]);

    const loaded = await archiveRepository.getSkillObservations();
    expect(loaded[0].domainId).toBeUndefined();
    expect(loaded[0].scenarioId).toBeUndefined();
  });

  it('stamps the current policy version', async () => {
    await archiveRepository.saveSkillObservations([observation()]);

    const row = await driver.db.getFirstAsync<{ policy_version: number }>(
      'SELECT policy_version FROM skill_observations WHERE id = ?',
      'so-1'
    );

    expect(row?.policy_version).toBe(LEARNING_POLICY_VERSION);
  });

  // A replayed action must not be able to manufacture a second observation and
  // therefore a second independent context.
  it('deduplicates the same skill in the same passage revision', async () => {
    await archiveRepository.saveSkillObservations([observation()]);
    await archiveRepository.saveSkillObservations([observation()]);

    expect(await archiveRepository.getSkillObservations()).toHaveLength(1);
  });

  it('keeps a different revision of the same passage as distinct', async () => {
    await archiveRepository.saveSkillObservations([observation()]);
    await archiveRepository.saveSkillObservations([
      observation({ id: 'so-2', sourceRevision: 'rev-2' }),
    ]);

    expect(await archiveRepository.getSkillObservations()).toHaveLength(2);
  });

  it('stores several skills from one passage', async () => {
    await archiveRepository.saveSkillObservations([
      observation({ id: 'so-a', skillId: 'skill-request-substitution' }),
      observation({ id: 'so-b', skillId: 'skill-communicative-repair' }),
    ]);

    const skills = (await archiveRepository.getSkillObservations()).map(o => o.skillId).sort();
    expect(skills).toEqual(['skill-communicative-repair', 'skill-request-substitution']);
  });

  it('writes nothing for an empty list', async () => {
    await archiveRepository.saveSkillObservations([]);
    expect(await archiveRepository.getSkillObservations()).toEqual([]);
  });
});

describe('hiding and disputing skill evidence', () => {
  it('removes a hidden observation from the projection input', async () => {
    await archiveRepository.saveSkillObservations([
      observation({ id: 'so-1' }),
      observation({ id: 'so-2', skillId: 'skill-communicative-repair' }),
    ]);

    await archiveRepository.hideSkillObservation('so-1');

    const visible = await archiveRepository.getSkillObservations();
    expect(visible.map(o => o.id)).toEqual(['so-2']);
  });

  it('marks a disputed observation as both hidden and disputed', async () => {
    await archiveRepository.saveSkillObservations([observation()]);
    await archiveRepository.disputeSkillObservation('so-1');

    const row = await driver.db.getFirstAsync<{
      hidden: number;
      user_disputed: number;
    }>('SELECT hidden, user_disputed FROM skill_observations WHERE id = ?', 'so-1');

    expect(row?.hidden).toBe(1);
    expect(row?.user_disputed).toBe(1);
    expect(await archiveRepository.getSkillObservations()).toHaveLength(0);
  });

  it('does not touch phrase observations', async () => {
    await archiveRepository.saveSkillObservations([observation()]);
    await archiveRepository.disputeSkillObservation('so-1');

    const phrases = await driver.db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM observations'
    );
    expect(phrases).toHaveLength(0);
  });
});

describe('skill and phrase evidence stay separate', () => {
  it('a phrase observation is not returned as skill evidence', async () => {
    await archiveRepository.completeSession({
      id: 'session-1',
      missionId: 'mission-es-cafe-sol',
      missionVersion: 1,
      language: 'es',
      mode: 'guided',
      coldAttempt: true,
      state: 'recap_ready',
      startedAt: '2026-09-20T09:00:00.000Z',
      endedAt: '2026-09-20T09:05:00.000Z',
      passages: [],
      supportExposures: [],
      observations: [
        {
          observationId: 'obs-1',
          sessionId: 'session-1',
          attemptId: 'attempt-1',
          sourceTurnId: 'p-1',
          sourceRevision: 'rev-1',
          itemId: 'phrase.es.1',
          candidateForm: '¿Tiene leche de avena?',
          meaning: 'oat milk',
          quote: '¿Tiene leche de avena?',
          modality: 'spoken',
          retrieval: 'unassisted',
          taskOutcome: 'achieved',
          rehearsal: false,
          supportExposureIds: [],
          recordedAt: '2026-09-20T09:00:00.000Z',
        },
      ],
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
    });

    expect((await archiveRepository.getObservations()).length).toBeGreaterThan(0);
    expect(await archiveRepository.getSkillObservations()).toHaveLength(0);
  });
});