import {
  LearningObservation,
  LanguageCode,
  Mode,
  OpportunityInstance,
  Passage,
  PhraseItem,
  RetrievalType,
  SessionRecord,
  SessionState,
  SkillLapse,
  SkillObservation,
  EvidenceSource,
  SupportExposure,
  TaskOutcome,
  UserPreferences,
  Fragment,
} from '../../types';
import { INITIAL_PHRASE_ITEMS } from '../../data/missions';
import { projectPhraseState } from '../learning/learningCore';
import { LEARNING_POLICY_VERSION } from '../learning/policy';
import { CONSENT_VERSION } from './schema';
import {
  ArchiveRepository as ArchiveRepositoryContract,
  ConsentRecord,
} from './ArchiveRepository.types';
import { getDatabase, withTransaction } from './database';
import { Db } from './db';

export type { ConsentRecord } from './ArchiveRepository.types';

const PREFERENCES_ID = 'current';

/**
 * Safe defaults.
 *
 * Consent starts ungranted: nothing about voice or saved analysis may be assumed
 * before the learner has been asked.
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  learningLanguage: 'es',
  explanationLanguage: 'en',
  comfortLevel: 'beginner',
  primaryGoal: 'travel',
  modeDefault: 'guided',
  voiceProcessingConsent: false,
  savedAnalysisConsent: false,
  audioPlaybackEnabled: true,
  autoPlaySpeech: true,
  speechRate: 1.0,
  accommodations: { enabled: [] },
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

const bool = (value: unknown) => value === 1 || value === true;

/**
 * The native archive, on SQLite.
 *
 * The source of truth for learning: observations, scheduling and the
 * support-exposure ledger live here and are never uploaded.
 *
 * Every write that produces learner-visible evidence happens in one transaction
 * together with the passage it references, so an interrupted write cannot leave a
 * claim without provenance.
 */
export class SqliteArchiveRepository implements ArchiveRepositoryContract {
  // ---------------------------------------------------------------- preferences

  async getPreferences(): Promise<UserPreferences> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ payload: string }>(
      'SELECT payload FROM preferences WHERE id = ?',
      PREFERENCES_ID
    );
    if (!row) return { ...DEFAULT_PREFERENCES };

    const parsed = parseJson<Partial<UserPreferences>>(row.payload, {});
    let lang = (parsed.explanationLanguage || 'en').toLowerCase();
    if (lang.startsWith('fr')) lang = 'fr';
    else if (lang.startsWith('es') || lang.startsWith('sp')) lang = 'es';
    else if (lang.startsWith('nl')) lang = 'nl';
    else lang = 'en';

    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      explanationLanguage: lang as UserPreferences['explanationLanguage'],
    };
  }

  async savePreferences(preferences: UserPreferences): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO preferences (id, payload, updated_at) VALUES (?, ?, ?)`,
      PREFERENCES_ID,
      JSON.stringify(preferences),
      new Date().toISOString()
    );
  }

  // -------------------------------------------------------------------- consent

  async getConsent(scope: 'voice' | 'saved_analysis'): Promise<ConsentRecord | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM consent_records WHERE scope = ?',
      scope
    );
    return row ? mapConsentRow(row) : null;
  }

  async recordConsent(
    scope: 'voice' | 'saved_analysis',
    granted: boolean
  ): Promise<ConsentRecord> {
    const db = await getDatabase();
    const record: ConsentRecord = {
      id: scope,
      scope,
      granted,
      version: CONSENT_VERSION,
      decidedAt: new Date().toISOString(),
      withdrawnAt: granted ? undefined : new Date().toISOString(),
    };

    await db.runAsync(
      `INSERT OR REPLACE INTO consent_records
        (id, scope, granted, version, decided_at, withdrawn_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      record.id,
      record.scope,
      record.granted ? 1 : 0,
      record.version,
      record.decidedAt,
      record.withdrawnAt ?? null
    );

    return record;
  }

  async withdrawConsent(scope: 'voice' | 'saved_analysis'): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE consent_records SET granted = 0, withdrawn_at = ? WHERE scope = ?',
      new Date().toISOString(),
      scope
    );
  }

  // ------------------------------------------------------------------- sessions

  async beginSession(session: SessionRecord): Promise<void> {
    const db = await getDatabase();

    await withTransaction(async txn => {
      await txn.runAsync(
        `INSERT OR REPLACE INTO sessions
          (id, mission_id, mission_version, language, mode, provider, consent_version,
           policy_version, state, end_reason, started_at, ended_at, usage_json, cold_attempt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        session.id,
        session.missionId,
        session.missionVersion,
        session.language,
        session.mode,
        'turn-based-http',
        CONSENT_VERSION,
        LEARNING_POLICY_VERSION,
        session.state,
        session.endReason ?? null,
        session.startedAt,
        session.endedAt ?? null,
        null,
        session.coldAttempt ? 1 : 0
      );

      await txn.runAsync(
        `INSERT OR IGNORE INTO attempts
          (id, session_id, parent_attempt_id, checkpoint_id, rehearsal, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        'attempt-1',
        session.id,
        null,
        'cp-start',
        0,
        session.startedAt
      );

      for (const exposure of session.supportExposures ?? []) {
        await txn.runAsync(
          `INSERT OR REPLACE INTO support_exposures
            (id, session_id, attempt_id, turn_id, source, kind, target_item_ids,
             target_skill_id, target_opportunity_id, target_phrase_id, policy_version, exposure, recorded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          exposure.id,
          exposure.sessionId,
          exposure.attemptId,
          exposure.turnId ?? null,
          exposure.source,
          exposure.kind,
          JSON.stringify(exposure.targetItemIds ?? []),
          exposure.targetSkillId ?? null,
          exposure.targetOpportunityId ?? null,
          exposure.targetPhraseId ?? null,
          exposure.policyVersion ?? LEARNING_POLICY_VERSION,
          exposure.exposure,
          exposure.recordedAt
        );
      }

      await this.writeOpportunityInstances(txn, session.id, session.opportunityInstances ?? []);

      await txn.runAsync(
        `INSERT OR REPLACE INTO scene_state
          (session_id, mission_id, revision, facts, checkpoints, is_finished, outcome)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        session.id,
        session.missionId,
        session.sceneState?.revision ?? 1,
        JSON.stringify(session.sceneState?.facts ?? {}),
        JSON.stringify(session.sceneState?.checkpoints ?? []),
        session.sceneState?.isFinished ? 1 : 0,
        session.sceneState?.outcome ?? 'unknown'
      );
    });
  }

  async saveSessionState(sessionId: string, state: SessionState): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE sessions SET state = ? WHERE id = ?', state, sessionId);
  }

  async completeSession(
    session: SessionRecord,
    rejectedProposals: { reason: string }[] = []
  ): Promise<void> {
    const db = await getDatabase();

    await withTransaction(async txn => {
      // Upsert, not update. `beginSession` runs before streaming, but if that write
      // was lost — an interrupted boot, a restored backup without the session row —
      // an UPDATE alone would silently discard the transcript and its evidence,
      // with no error anywhere.
      await txn.runAsync(
        `INSERT OR REPLACE INTO sessions
          (id, mission_id, mission_version, language, mode, provider, consent_version,
           policy_version, state, end_reason, started_at, ended_at, usage_json, cold_attempt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        session.id,
        session.missionId,
        session.missionVersion,
        session.language,
        session.mode,
        'turn-based-http',
        CONSENT_VERSION,
        LEARNING_POLICY_VERSION,
        session.state,
        session.endReason ?? null,
        session.startedAt,
        session.endedAt ?? new Date().toISOString(),
        null,
        session.coldAttempt ? 1 : 0
      );

      await txn.runAsync(
        `INSERT OR IGNORE INTO attempts
          (id, session_id, parent_attempt_id, checkpoint_id, rehearsal, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        'attempt-1',
        session.id,
        null,
        'cp-start',
        0,
        session.startedAt
      );

      for (const passage of session.passages) {
        await txn.runAsync(
          `INSERT OR REPLACE INTO passages
            (id, session_id, attempt_id, speaker, revision_key, assembly_version,
             status, text, meaning, modality, provider_item_id, connection_generation,
             started_at, ended_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          passage.id,
          passage.sessionId,
          passage.attemptId,
          passage.speaker,
          passage.revisionKey,
          passage.assemblyVersion,
          passage.status,
          passage.text,
          passage.meaning ?? null,
          passage.modality,
          null,
          null,
          passage.startedAt ?? null,
          passage.endedAt ?? null
        );

        await txn.runAsync('DELETE FROM fragments WHERE passage_id = ?', passage.id);
        for (const fragment of passage.fragments ?? []) {
          await txn.runAsync(
            `INSERT OR REPLACE INTO fragments (id, passage_id, origin, text, meaning_visible)
             VALUES (?, ?, ?, ?, ?)`,
            fragment.id,
            passage.id,
            fragment.origin,
            fragment.text,
            fragment.meaningVisible ? 1 : 0
          );
        }
      }

      for (const exposure of session.supportExposures ?? []) {
        await txn.runAsync(
          `INSERT OR REPLACE INTO support_exposures
            (id, session_id, attempt_id, turn_id, source, kind, target_item_ids,
             target_skill_id, target_opportunity_id, target_phrase_id, policy_version, exposure, recorded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          exposure.id,
          exposure.sessionId,
          exposure.attemptId,
          exposure.turnId ?? null,
          exposure.source,
          exposure.kind,
          JSON.stringify(exposure.targetItemIds ?? []),
          exposure.targetSkillId ?? null,
          exposure.targetOpportunityId ?? null,
          exposure.targetPhraseId ?? null,
          exposure.policyVersion ?? LEARNING_POLICY_VERSION,
          exposure.exposure,
          exposure.recordedAt
        );
      }

      await this.writeOpportunityInstances(txn, session.id, session.opportunityInstances ?? []);

      for (const rejection of rejectedProposals) {
        await txn.runAsync(
          `INSERT OR REPLACE INTO assessment_proposals
            (id, session_id, attempt_id, schema_version, raw_json, parse_status,
             validation_errors, received_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          `rejected-${session.id}-${rejection.reason.slice(0, 40)}`,
          session.id,
          'attempt-1',
          LEARNING_POLICY_VERSION,
          JSON.stringify(rejection),
          'rejected',
          JSON.stringify(rejection),
          new Date().toISOString()
        );
      }

      await txn.runAsync(
        `INSERT OR REPLACE INTO scene_state
          (session_id, mission_id, revision, facts, checkpoints, is_finished, outcome)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        session.id,
        session.missionId,
        session.sceneState?.revision ?? 1,
        JSON.stringify(session.sceneState?.facts ?? {}),
        JSON.stringify(session.sceneState?.checkpoints ?? []),
        session.sceneState?.isFinished ? 1 : 0,
        session.sceneState?.outcome ?? 'unknown'
      );

      // The uniqueness index on (source_turn_id, source_revision, item_id) makes a
      // replayed turn a replace rather than a second row, so a reconnect cannot
      // manufacture a second independent use of the same phrase.
      for (const obs of session.observations) {
        await txn.runAsync(
          `INSERT OR REPLACE INTO observations
            (id, session_id, attempt_id, source_turn_id, source_revision, item_id,
             candidate_form, meaning, quote, modality, retrieval, task_outcome, rehearsal,
             support_exposure_ids, policy_version, hidden, user_disputed, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
          obs.observationId,
          obs.sessionId,
          obs.attemptId,
          obs.sourceTurnId,
          obs.sourceRevision,
          obs.itemId,
          obs.candidateForm,
          obs.meaning ?? null,
          obs.quote,
          obs.modality,
          obs.retrieval,
          obs.taskOutcome,
          obs.rehearsal ? 1 : 0,
          JSON.stringify(obs.supportExposureIds ?? []),
          LEARNING_POLICY_VERSION,
          obs.recordedAt
        );
      }

      await this.writeSkillEvidence(txn, session);

      await this.reprojectPhrases(txn);
    });
  }

  /**
   * Writes validated skill evidence alongside the session that produced it.
   *
   * Same transaction as the transcript and phrase observations on purpose: a recap
   * screen that renders a skill claim must never be able to render one the archive
   * does not hold, and an interrupted write must not leave evidence without the
   * passage it cites.
   */
  private async writeSkillEvidence(txn: Db, session: SessionRecord): Promise<void> {
    for (const observation of session.skillObservations ?? []) {
      await txn.runAsync(
        `INSERT OR REPLACE INTO skill_observations
          (id, skill_id, session_id, attempt_id, source_passage_id, source_revision,
           domain_id, scenario_family_id, scenario_id, exam_program_id, exam_task_id, modality, retrieval,
           task_outcome, demonstration, opportunity_instance_id, support_exposure_ids,
           evidence_source, quote, policy_version, hidden, user_disputed, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
        observation.id,
        observation.skillId,
        observation.sessionId,
        observation.attemptId,
        observation.sourcePassageId,
        observation.sourceRevision,
        observation.contextKey.domainId,
        observation.contextKey.scenarioFamilyId,
        observation.contextKey.scenarioId ?? observation.scenarioId ?? null,
        observation.examProgramId ?? null,
        observation.examTaskId ?? null,
        observation.modality,
        observation.retrieval,
        observation.taskOutcome,
        observation.demonstration,
        observation.opportunityInstanceId ?? null,
        JSON.stringify(observation.supportExposureIds),
        observation.evidenceSource,
        observation.quote,
        LEARNING_POLICY_VERSION,
        observation.recordedAt
      );
    }

    for (const lapse of session.skillLapses ?? []) {
      await txn.runAsync(
        `INSERT OR REPLACE INTO skill_lapses
          (id, skill_id, session_id, attempt_id, source_passage_id, source_revision,
           domain_id, scenario_family_id, scenario_id, opportunity_instance_id,
           demonstration, basis, policy_version, hidden, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        lapse.id,
        lapse.skillId,
        lapse.sessionId,
        lapse.attemptId,
        lapse.sourcePassageId,
        lapse.sourceRevision,
        lapse.contextKey.domainId,
        lapse.contextKey.scenarioFamilyId,
        lapse.contextKey.scenarioId ?? lapse.scenarioId ?? null,
        lapse.opportunityInstanceId,
        lapse.demonstration,
        lapse.basis,
        LEARNING_POLICY_VERSION,
        lapse.recordedAt
      );
    }
  }

  private async writeOpportunityInstances(
    txn: Db,
    sessionId: string,
    opportunities: OpportunityInstance[]
  ): Promise<void> {
    for (const opportunity of opportunities) {
      await txn.runAsync(
        `INSERT OR REPLACE INTO opportunity_instances
          (id, session_id, attempt_id, opportunity_id, skill_id, status, detection,
           demonstration, presented_at_passage_id, learner_attempt_passage_id,
           learner_attempt_revision, failure_reason, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        opportunity.id,
        sessionId,
        opportunity.attemptId,
        opportunity.opportunityId,
        opportunity.skillId,
        opportunity.status,
        opportunity.detection,
        opportunity.demonstration,
        opportunity.presentedAtPassageId ?? null,
        opportunity.learnerAttemptPassageId ?? null,
        opportunity.learnerAttemptRevision ?? null,
        opportunity.failureReason ?? null,
        opportunity.recordedAt
      );
    }
  }

  async getSessions(): Promise<SessionRecord[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM sessions ORDER BY started_at DESC'
    );

    const sessions: SessionRecord[] = [];

    for (const row of rows) {
      const sessionId = String(row.id);

      const passageRows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM passages WHERE session_id = ? ORDER BY started_at ASC',
        sessionId
      );
      const exposureRows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM support_exposures WHERE session_id = ?',
        sessionId
      );
      const opportunityRows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM opportunity_instances WHERE session_id = ? ORDER BY recorded_at ASC',
        sessionId
      );
      const observationRows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM observations WHERE session_id = ? ORDER BY created_at ASC',
        sessionId
      );
      const sceneRow = await db.getFirstAsync<Record<string, unknown>>(
        'SELECT * FROM scene_state WHERE session_id = ?',
        sessionId
      );

      const passages: Passage[] = [];
      for (const passageRow of passageRows) {
        passages.push(await this.hydratePassage(db, passageRow));
      }

      sessions.push({
        id: sessionId,
        missionId: String(row.mission_id),
        missionVersion: Number(row.mission_version),
        language: String(row.language) as LanguageCode,
        mode: String(row.mode) as Mode,
        coldAttempt: bool(row.cold_attempt),
        state: String(row.state) as SessionState,
        startedAt: String(row.started_at),
        endedAt: row.ended_at ? String(row.ended_at) : undefined,
        endReason: (row.end_reason as SessionRecord['endReason']) ?? undefined,
        passages,
        supportExposures: exposureRows.map(mapExposureRow),
        opportunityInstances: opportunityRows.map(mapOpportunityInstanceRow),
        observations: observationRows.map(mapObservationRow),
        taskOutcome: 'unknown',
        sceneState: {
          sceneId: String(row.mission_id),
          revision: Number(sceneRow?.revision ?? 1),
          facts: parseJson(sceneRow?.facts as string, {}),
          learnerKnows: [],
          characterKnows: [],
          checkpoints: parseJson(sceneRow?.checkpoints as string, []),
          isFinished: bool(sceneRow?.is_finished),
          outcome: (sceneRow?.outcome as TaskOutcome) ?? 'unknown',
        },
      });
    }

    return sessions;
  }

  private async hydratePassage(
    db: Db,
    row: Record<string, unknown>
  ): Promise<Passage> {
    const passage = mapPassageRow(row);
    const fragmentRows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM fragments WHERE passage_id = ?',
      passage.id
    );

    const fragments: Fragment[] = fragmentRows.map(fragment => ({
      id: String(fragment.id),
      passageId: String(fragment.passage_id),
      origin: String(fragment.origin) as Fragment['origin'],
      text: String(fragment.text ?? ''),
      meaningVisible: bool(fragment.meaning_visible),
    }));

    return { ...passage, fragments };
  }

  async getSessionById(id: string): Promise<SessionRecord | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM sessions WHERE id = ?',
      id
    );
    if (!row) return null;

    const all = await this.getSessions();
    return all.find(s => s.id === id) ?? null;
  }

  async getSessionSummaries(): Promise<
    Array<{
      id: string;
      missionId: string;
      language: string;
      mode: string;
      state: string;
      startedAt: string;
      endedAt?: string;
      coldAttempt: boolean;
      turnCount: number;
      observationCount: number;
    }>
  > {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM sessions ORDER BY started_at DESC'
    );

    const summaries = [];
    for (const row of rows) {
      const sessionId = String(row.id);
      const turns = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM passages WHERE session_id = ?',
        sessionId
      );
      const observations = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM observations WHERE session_id = ? AND hidden = 0',
        sessionId
      );

      summaries.push({
        id: sessionId,
        missionId: String(row.mission_id),
        language: String(row.language),
        mode: String(row.mode),
        state: String(row.state),
        startedAt: String(row.started_at),
        endedAt: row.ended_at ? String(row.ended_at) : undefined,
        coldAttempt: bool(row.cold_attempt),
        turnCount: turns?.count ?? 0,
        observationCount: observations?.count ?? 0,
      });
    }

    return summaries;
  }

  // ------------------------------------------------------------------- evidence

  /**
   * Every observation, including hidden and disputed ones.
   *
   * Hidden evidence stays readable on the device so the learner can see what was
   * removed and why; filtering it out of the ledger would make "hide" indistinguishable
   * from "never happened".
   */
  async getObservations(): Promise<LearningObservation[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM observations ORDER BY created_at DESC'
    );
    return rows.map(mapObservationRow);
  }

  async saveSkillObservations(observations: SkillObservation[]): Promise<void> {
    if (observations.length === 0) return;
    const db = await getDatabase();

    await withTransaction(async txn => {
      for (const observation of observations) {
        await txn.runAsync(
          `INSERT OR REPLACE INTO skill_observations
            (id, skill_id, session_id, attempt_id, source_passage_id, source_revision,
             domain_id, scenario_family_id, scenario_id, exam_program_id, exam_task_id, modality, retrieval,
             task_outcome, demonstration, opportunity_instance_id, support_exposure_ids,
             evidence_source, quote, policy_version, hidden, user_disputed, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
          observation.id,
          observation.skillId,
          observation.sessionId,
          observation.attemptId,
          observation.sourcePassageId,
          observation.sourceRevision,
          observation.contextKey.domainId,
          observation.contextKey.scenarioFamilyId,
          observation.contextKey.scenarioId ?? observation.scenarioId ?? null,
          observation.examProgramId ?? null,
          observation.examTaskId ?? null,
          observation.modality,
          observation.retrieval,
          observation.taskOutcome,
          observation.demonstration,
          observation.opportunityInstanceId ?? null,
          JSON.stringify(observation.supportExposureIds),
          observation.evidenceSource,
          observation.quote,
          LEARNING_POLICY_VERSION,
          observation.recordedAt
        );
      }
    });
  }

  async getSkillObservations(): Promise<SkillObservation[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM skill_observations WHERE hidden = 0 ORDER BY created_at DESC'
    );

    return rows.map(row => ({
      id: String(row.id),
      skillId: String(row.skill_id),
      sessionId: String(row.session_id),
      attemptId: String(row.attempt_id),
      sourcePassageId: String(row.source_passage_id),
      sourceRevision: String(row.source_revision),
      contextKey: {
        domainId: row.domain_id ? String(row.domain_id) : 'legacy',
        scenarioFamilyId: row.scenario_family_id
          ? String(row.scenario_family_id)
          : 'legacy-unknown',
        scenarioId: row.scenario_id ? String(row.scenario_id) : undefined,
        examTaskId: row.exam_task_id ? String(row.exam_task_id) : undefined,
      },
      domainId: row.domain_id ? String(row.domain_id) : undefined,
      scenarioId: row.scenario_id ? String(row.scenario_id) : undefined,
      examProgramId: row.exam_program_id ? String(row.exam_program_id) : undefined,
      examTaskId: row.exam_task_id ? String(row.exam_task_id) : undefined,
      modality: String(row.modality) as SkillObservation['modality'],
      retrieval: String(row.retrieval) as RetrievalType,
      taskOutcome: String(row.task_outcome) as TaskOutcome,
      demonstration: (row.demonstration
        ? String(row.demonstration)
        : 'demonstrated') as SkillObservation['demonstration'],
      opportunityInstanceId: row.opportunity_instance_id
        ? String(row.opportunity_instance_id)
        : undefined,
      supportExposureIds: parseJson<string[]>(String(row.support_exposure_ids ?? '[]'), []),
      evidenceSource: String(row.evidence_source) as EvidenceSource,
      quote: String(row.quote),
      recordedAt: String(row.created_at),
    }));
  }

  async getSkillLapses(): Promise<SkillLapse[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM skill_lapses WHERE hidden = 0 ORDER BY created_at DESC'
    );

    return rows.map(row => ({
      id: String(row.id),
      skillId: String(row.skill_id),
      sessionId: String(row.session_id),
      attemptId: String(row.attempt_id),
      sourcePassageId: String(row.source_passage_id),
      sourceRevision: String(row.source_revision),
      contextKey: {
        domainId: row.domain_id ? String(row.domain_id) : 'legacy',
        scenarioFamilyId: row.scenario_family_id
          ? String(row.scenario_family_id)
          : 'legacy-unknown',
        scenarioId: row.scenario_id ? String(row.scenario_id) : undefined,
      },
      domainId: row.domain_id ? String(row.domain_id) : undefined,
      scenarioId: row.scenario_id ? String(row.scenario_id) : undefined,
      opportunityInstanceId: row.opportunity_instance_id
        ? String(row.opportunity_instance_id)
        : 'legacy-opportunity-unknown',
      demonstration: 'attempted_not_demonstrated',
      basis: String(row.basis) as SkillLapse['basis'],
      recordedAt: String(row.created_at),
    }));
  }

  async hideSkillObservation(observationId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE skill_observations SET hidden = 1 WHERE id = ?',
      observationId
    );
  }

  async disputeSkillObservation(observationId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE skill_observations SET hidden = 1, user_disputed = 1 WHERE id = ?',
      observationId
    );
  }

  async hideObservation(observationId: string): Promise<void> {
    const db = await getDatabase();
    await withTransaction(async txn => {
      await txn.runAsync('UPDATE observations SET hidden = 1 WHERE id = ?', observationId);
      await this.reprojectPhrases(txn);
    });
  }

  async disputeObservation(observationId: string): Promise<void> {
    const db = await getDatabase();
    await withTransaction(async txn => {
      await txn.runAsync(
        'UPDATE observations SET hidden = 1, user_disputed = 1 WHERE id = ?',
        observationId
      );
      await this.reprojectPhrases(txn);
    });
  }

  // -------------------------------------------------------------------- phrases

  async getPhrases(): Promise<PhraseItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM phrases');
    const now = Date.now();

    if (rows.length === 0) {
      const seeded = INITIAL_PHRASE_ITEMS.map(p => ({ ...p }));
      await this.savePhrases(seeded);
      return seeded.map(p => ({ ...p }));
    }

    const phrases = rows.map(mapPhraseRow);

    // Merge any phrases added to the catalog since this archive was written.
    const existingIds = new Set(phrases.map(p => p.id));
    const missing = INITIAL_PHRASE_ITEMS.filter(p => !existingIds.has(p.id));
    if (missing.length > 0) {
      await this.savePhrases([...phrases, ...missing]);
    }

    // "Due" is derived from the schedule at read time, never stored as a status.
    return [...phrases, ...missing].map(p => ({
      ...p,
      scheduling: {
        ...p.scheduling,
        due: new Date(p.scheduling.nextReviewAt).getTime() <= now,
      },
    }));
  }

  async savePhrases(phrases: PhraseItem[]): Promise<void> {
    const db = await getDatabase();
    await withTransaction(async txn => {
      for (const phrase of phrases) {
        await this.writePhraseRow(txn, phrase);
      }
    });
  }

  /** Writes one catalog row on the given handle, for use inside a transaction. */
  private async writePhraseRow(txn: Db, phrase: PhraseItem): Promise<void> {
    await txn.runAsync(
      `INSERT OR REPLACE INTO phrases
        (id, language, form, meaning, usage_note, difficulty, recall_status,
         next_review_at, interval_days, modality_history, contexts,
         assisted_count, unassisted_count, spoken_count, typed_count,
         last_practiced_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      phrase.id,
      phrase.language,
      phrase.form,
      phrase.meaning,
      phrase.usageNote ?? null,
      phrase.difficulty,
      phrase.recallStatus,
      phrase.scheduling.nextReviewAt,
      phrase.scheduling.intervalDays,
      JSON.stringify(phrase.scheduling.modalityHistory ?? {}),
      JSON.stringify(phrase.scheduling.contexts ?? []),
      phrase.stats.assistedCount,
      phrase.stats.unassistedCount,
      phrase.stats.spokenCount,
      phrase.stats.typedCount,
      phrase.stats.lastPracticedAt ?? null,
      new Date().toISOString()
    );
  }

  /**
   * Seeds the curated catalog when the phrases table is empty. Runs on the
   * caller's handle so it can join an in-flight transaction.
   */
  private async seedPhrasesIfEmpty(txn: Db): Promise<void> {
    const row = await txn.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM phrases'
    );
    if ((row?.count ?? 0) > 0) return;

    for (const phrase of INITIAL_PHRASE_ITEMS) {
      await this.writePhraseRow(txn, { ...phrase });
    }
  }

  async resetPhrase(phraseId: string): Promise<void> {
    const phrases = await this.getPhrases();
    const updated = phrases.map(p =>
      p.id === phraseId
        ? {
            ...p,
            recallStatus: 'new' as const,
            scheduling: {
              ...p.scheduling,
              nextReviewAt: new Date(Date.now() - 3_600_000).toISOString(),
              due: true,
              intervalDays: 1,
            },
            stats: { assistedCount: 0, unassistedCount: 0, spokenCount: 0, typedCount: 0 },
          }
        : p
    );
    await this.savePhrases(updated);
  }

  /**
   * Rebuilds every phrase projection from the validated ledger.
   *
   * Seeds the catalog first when the table is empty, otherwise a session completed
   * before the learner ever opened the Progress tab would reproject nothing and its
   * evidence would sit unapplied until the next write.
   */
  private async reprojectPhrases(txn: Db): Promise<void> {
    await this.seedPhrasesIfEmpty(txn);

    const phraseRows = await txn.getAllAsync<Record<string, unknown>>('SELECT * FROM phrases');
    const obsRows = await txn.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM observations WHERE hidden = 0 AND user_disputed = 0'
    );

    const observations = obsRows.map(mapObservationRow);

    for (const row of phraseRows) {
      const current = mapPhraseRow(row);
      const form = current.form.toLowerCase();

      const relevant = observations.filter(
        obs => obs.itemId === current.id || obs.candidateForm.toLowerCase() === form
      );

      if (relevant.length === 0) continue;

      const projected = projectPhraseState(current, relevant);
      await this.writePhraseRow(txn, projected);
    }
  }

  // ------------------------------------------------------- recovery and deletion

  async getInterruptedSessions(): Promise<
    Array<{ id: string; missionId: string; startedAt: string; state: string }>
  > {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT id, mission_id, started_at, state FROM sessions
       WHERE state IN ('preflight', 'connecting', 'live', 'paused', 'reconnecting', 'ending')
       ORDER BY started_at DESC`
    );

    return rows.map(row => ({
      id: String(row.id),
      missionId: String(row.mission_id),
      startedAt: String(row.started_at),
      state: String(row.state),
    }));
  }

  async markSessionEnded(
    sessionId: string,
    reason: SessionRecord['endReason']
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE sessions SET end_reason = ?, ended_at = ? WHERE id = ?',
      reason ?? null,
      new Date().toISOString(),
      sessionId
    );
  }

  async markDeleted(scope: 'session' | 'all', targetId?: string): Promise<string> {
    const db = await getDatabase();
    const id = `del-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.runAsync(
      'INSERT OR REPLACE INTO deletion_markers (id, scope, target_id, created_at) VALUES (?, ?, ?, ?)',
      id,
      scope,
      targetId ?? null,
      new Date().toISOString()
    );
    return id;
  }

  /** Checked before any assessment or helper write. */
  async isDeleted(sessionId: string): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM deletion_markers WHERE scope = ? OR target_id = ?',
      'all',
      sessionId
    );
    return (row?.count ?? 0) > 0;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const db = await getDatabase();

    // The marker goes in first. If the process dies between the marker and the
    // deletes, a late assessment for this session is discarded rather than
    // resurrecting evidence the learner asked to remove.
    await this.markDeleted('session', sessionId);
    await this.enqueueJob('assessment', sessionId);

    await withTransaction(async txn => {
      await txn.runAsync('DELETE FROM skill_lapses WHERE session_id = ?', sessionId);
      await txn.runAsync('DELETE FROM skill_observations WHERE session_id = ?', sessionId);
      await txn.runAsync('DELETE FROM opportunity_instances WHERE session_id = ?', sessionId);
      await txn.runAsync('DELETE FROM observations WHERE session_id = ?', sessionId);
      await txn.runAsync(
        'DELETE FROM support_exposures WHERE session_id = ?',
        sessionId
      );
      await txn.runAsync('DELETE FROM fragments WHERE passage_id IN (SELECT id FROM passages WHERE session_id = ?)', sessionId);
      await txn.runAsync('DELETE FROM passages WHERE session_id = ?', sessionId);
      await txn.runAsync('DELETE FROM assessment_proposals WHERE session_id = ?', sessionId);
      await txn.runAsync('DELETE FROM scene_events WHERE session_id = ?', sessionId);
      await txn.runAsync('DELETE FROM scene_state WHERE session_id = ?', sessionId);
      await txn.runAsync('DELETE FROM attempts WHERE session_id = ?', sessionId);
      await txn.runAsync('DELETE FROM sessions WHERE id = ?', sessionId);

      await this.reprojectPhrases(txn);
    });
  }

  async clearAllLearningData(): Promise<void> {
    const db = await getDatabase();

    await this.markDeleted('all');

    await withTransaction(async txn => {
      await txn.runAsync('DELETE FROM skill_lapses');
      await txn.runAsync('DELETE FROM skill_observations');
      await txn.runAsync('DELETE FROM opportunity_instances');
      await txn.runAsync('DELETE FROM observations');
      await txn.runAsync('DELETE FROM fragments');
      await txn.runAsync('DELETE FROM passages');
      await txn.runAsync('DELETE FROM support_exposures');
      await txn.runAsync('DELETE FROM assessment_proposals');
      await txn.runAsync('DELETE FROM scene_events');
      await txn.runAsync('DELETE FROM scene_state');
      await txn.runAsync('DELETE FROM attempts');
      await txn.runAsync('DELETE FROM sessions');
      await txn.runAsync('DELETE FROM phrases');

      // The catalog is seeded again on the next read, so a cleared archive still
      // has a working Progress screen rather than an empty one.
      await this.seedPhrasesIfEmpty(txn);
    });
  }

  // --------------------------------------------------------------------- review

  async recordDrillReview(input: {
    phrase: PhraseItem;
    quote: string;
    modality: 'spoken' | 'typed';
    unassisted: boolean;
  }): Promise<void> {
    const db = await getDatabase();
    const { phrase, quote, modality, unassisted } = input;
    const now = new Date().toISOString();

    const observation: LearningObservation = {
      observationId: `drill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: 'drill',
      attemptId: 'drill',
      sourceTurnId: `drill-${Date.now()}`,
      sourceRevision: 'rev-drill',
      itemId: phrase.id,
      candidateForm: phrase.form,
      meaning: phrase.meaning,
      quote,
      modality,
      retrieval: unassisted ? 'unassisted' : 'assisted',
      taskOutcome: 'achieved',
      rehearsal: false,
      supportExposureIds: [],
      recordedAt: now,
    };

    await withTransaction(async txn => {
      await txn.runAsync(
        `INSERT OR REPLACE INTO observations
          (id, session_id, attempt_id, source_turn_id, source_revision, item_id,
           candidate_form, meaning, quote, modality, retrieval, task_outcome, rehearsal,
           support_exposure_ids, policy_version, hidden, user_disputed, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
        observation.observationId,
        observation.sessionId,
        observation.attemptId,
        observation.sourceTurnId,
        observation.sourceRevision,
        observation.itemId,
        observation.candidateForm,
        observation.meaning ?? null,
        observation.quote,
        observation.modality,
        observation.retrieval,
        observation.taskOutcome,
        0,
        JSON.stringify([]),
        LEARNING_POLICY_VERSION,
        observation.recordedAt
      );

      await this.writePhraseRow(
        txn,
        projectPhraseState(phrase, [observation, ...[]])
      );
    });
  }

  // ----------------------------------------------------------------------- jobs

  async enqueueJob(kind: string, targetId?: string, payload?: unknown): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO pending_jobs (id, kind, target_id, payload, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      targetId ?? null,
      payload === undefined ? null : JSON.stringify(payload),
      new Date().toISOString()
    );
  }

  async getPendingJobs(): Promise<Array<{ id: string; kind: string; targetId?: string }>> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT id, kind, target_id FROM pending_jobs ORDER BY created_at ASC'
    );

    return rows.map(row => ({
      id: String(row.id),
      kind: String(row.kind),
      targetId: row.target_id ? String(row.target_id) : undefined,
    }));
  }

  async removePendingJob(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM pending_jobs WHERE id = ?', id);
  }

  // --------------------------------------------------------------------- export

  async exportArchiveJson(): Promise<string> {
    const [preferences, sessions, observations, phrases] = await Promise.all([
      this.getPreferences(),
      this.getSessions(),
      this.getObservations(),
      this.getPhrases(),
    ]);

    return JSON.stringify(
      {
        version: 1,
        schemaVersion: 1,
        policyVersion: LEARNING_POLICY_VERSION,
        consentVersion: CONSENT_VERSION,
        exportedAt: new Date().toISOString(),
        preferences,
        sessions,
        observations,
        phrases,
      },
      null,
      2
    );
  }

  async importArchiveJson(json: string): Promise<{
    success: boolean;
    message: string;
    counts?: { sessions: number; phrases: number; observations: number };
  }> {
    let parsed: any;
    try {
      parsed = JSON.parse(json);
    } catch (err) {
      return { success: false, message: `Failed to import archive: ${(err as Error).message}` };
    }

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'Invalid JSON payload format' };
    }

    // Validate everything before mutating anything, so a malformed archive cannot
    // leave the learner with half an archive and no undo.
    if (parsed.schemaVersion !== undefined && parsed.schemaVersion !== 1) {
      return {
        success: false,
        message: `Unsupported archive schema version: ${parsed.schemaVersion}`,
      };
    }

    if (!Array.isArray(parsed.sessions) || !Array.isArray(parsed.phrases)) {
      return { success: false, message: 'Archive is missing sessions or phrases' };
    }

    for (const phrase of parsed.phrases) {
      if (typeof phrase?.id !== 'string' || typeof phrase?.form !== 'string') {
        return { success: false, message: 'Archive contains a malformed phrase' };
      }
    }

    for (const session of parsed.sessions) {
      if (typeof session?.id !== 'string' || typeof session?.missionId !== 'string') {
        return { success: false, message: 'Archive contains a malformed session' };
      }
      if (Array.isArray(session.observations)) {
        for (const observation of session.observations) {
          if (typeof observation?.quote !== 'string') {
            return { success: false, message: 'Archive contains an observation without a quote' };
          }
        }
      }
    }

    const preferences = parsed.preferences
      ? { ...DEFAULT_PREFERENCES, ...parsed.preferences }
      : null;

    await withTransaction(async txn => {
      if (preferences) {
        await txn.runAsync(
          `INSERT OR REPLACE INTO preferences (id, payload, updated_at) VALUES (?, ?, ?)`,
          PREFERENCES_ID,
          JSON.stringify(preferences),
          new Date().toISOString()
        );
      }

      for (const phrase of parsed.phrases) {
        await this.writePhraseRow(txn, phrase as PhraseItem);
      }

      for (const session of parsed.sessions) {
        await txn.runAsync(
          `INSERT OR REPLACE INTO sessions
            (id, mission_id, mission_version, language, mode, provider, consent_version,
             policy_version, state, end_reason, started_at, ended_at, usage_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          session.id,
          session.missionId,
          session.missionVersion ?? 1,
          session.language ?? 'es',
          session.mode ?? 'guided',
          'turn-based-http',
          CONSENT_VERSION,
          LEARNING_POLICY_VERSION,
          session.state ?? 'ended',
          session.endReason ?? null,
          session.startedAt,
          session.endedAt ?? null,
          null
        );

        for (const observation of session.observations ?? []) {
          await txn.runAsync(
            `INSERT OR REPLACE INTO observations
              (id, session_id, attempt_id, source_turn_id, source_revision, item_id,
               candidate_form, meaning, quote, modality, retrieval, task_outcome, rehearsal,
               support_exposure_ids, policy_version, hidden, user_disputed, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            observation.observationId,
            observation.sessionId ?? session.id,
            observation.attemptId ?? 'attempt-1',
            observation.sourceTurnId,
            observation.sourceRevision,
            observation.itemId,
            observation.candidateForm,
            observation.meaning ?? null,
            observation.quote,
            observation.modality,
            observation.retrieval,
            observation.taskOutcome,
            observation.rehearsal ? 1 : 0,
            JSON.stringify(observation.supportExposureIds ?? []),
            LEARNING_POLICY_VERSION,
            observation.hidden ? 1 : 0,
            observation.userDisputed ? 1 : 0,
            observation.recordedAt
          );
        }
      }
    });

    return {
      success: true,
      message: `Successfully restored ${parsed.sessions.length} sessions, ${parsed.phrases.length} phrases, and ${parsed.observations?.length ?? 0} observations.`,
      counts: {
        sessions: parsed.sessions.length,
        phrases: parsed.phrases.length,
        observations: parsed.observations?.length ?? 0,
      },
    };
  }

  async exportLearningReceiptText(session: SessionRecord): Promise<string> {
    const phrases = await this.getPhrases();
    const used = new Set(session.observations.map(o => o.itemId));

    let out = '========================================================\n';
    out += 'MISSION COACH — LEARNING RECEIPT\n';
    out += '========================================================\n\n';
    out += `Session: ${session.id}\n`;
    out += `Mission: ${session.missionId}\n`;
    out += `Language: ${session.language}\n`;
    out += `Mode: ${session.mode}\n`;
    out += `Started: ${session.startedAt}\n`;
    out += `Ended: ${session.endedAt ?? 'unknown'}\n`;
    out += `Outcome: ${session.taskOutcome}\n\n`;
    out += 'WHAT YOU ACTUALLY USED\n';

    for (const phrase of phrases.filter(p => used.has(p.id))) {
      out += `\n${phrase.form}\n`;
      out += `  ${phrase.meaning}\n`;
      out += `  status: ${phrase.recallStatus}\n`;
    }

    if (used.size === 0) {
      out += '\nNo phrases were recorded as used in this session.\n';
    }

    out += '\n========================================================\n';
    return out;
  }
}

// ------------------------------------------------------------------ row mappers

function mapPassageRow(row: Record<string, unknown>): Passage {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    attemptId: String(row.attempt_id),
    speaker: String(row.speaker) as Passage['speaker'],
    revisionKey: String(row.revision_key),
    assemblyVersion: Number(row.assembly_version ?? 1),
    status: String(row.status) as Passage['status'],
    text: row.text ? String(row.text) : '',
    meaning: row.meaning ? String(row.meaning) : undefined,
    modality: String(row.modality) as Passage['modality'],
    startedAt: row.started_at ? String(row.started_at) : new Date(0).toISOString(),
    endedAt: row.ended_at ? String(row.ended_at) : undefined,
    fragments: [],
  };
}

function mapExposureRow(row: Record<string, unknown>): SupportExposure {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    attemptId: String(row.attempt_id),
    turnId: row.turn_id ? String(row.turn_id) : undefined,
    source: String(row.source) as SupportExposure['source'],
    kind: String(row.kind) as SupportExposure['kind'],
    targetItemIds: parseJson<string[]>(String(row.target_item_ids ?? '[]'), []),
    targetSkillId: row.target_skill_id ? String(row.target_skill_id) : undefined,
    targetOpportunityId: row.target_opportunity_id
      ? String(row.target_opportunity_id)
      : undefined,
    targetPhraseId: row.target_phrase_id ? String(row.target_phrase_id) : undefined,
    policyVersion: row.policy_version ? Number(row.policy_version) : undefined,
    exposure: String(row.exposure) as SupportExposure['exposure'],
    recordedAt: String(row.recorded_at),
  };
}

function mapOpportunityInstanceRow(row: Record<string, unknown>): OpportunityInstance {
  return {
    id: String(row.id),
    attemptId: String(row.attempt_id),
    opportunityId: String(row.opportunity_id),
    skillId: String(row.skill_id),
    status: String(row.status) as OpportunityInstance['status'],
    detection: String(row.detection) as OpportunityInstance['detection'],
    demonstration: String(row.demonstration) as OpportunityInstance['demonstration'],
    presentedAtPassageId: row.presented_at_passage_id
      ? String(row.presented_at_passage_id)
      : undefined,
    learnerAttemptPassageId: row.learner_attempt_passage_id
      ? String(row.learner_attempt_passage_id)
      : undefined,
    learnerAttemptRevision: row.learner_attempt_revision
      ? String(row.learner_attempt_revision)
      : undefined,
    failureReason: row.failure_reason
      ? (String(row.failure_reason) as OpportunityInstance['failureReason'])
      : undefined,
    recordedAt: String(row.recorded_at),
  };
}

function mapObservationRow(row: Record<string, unknown>): LearningObservation {
  return {
    observationId: String(row.id),
    sessionId: String(row.session_id),
    attemptId: String(row.attempt_id),
    sourceTurnId: String(row.source_turn_id),
    sourceRevision: String(row.source_revision),
    itemId: String(row.item_id),
    candidateForm: String(row.candidate_form),
    meaning: row.meaning ? String(row.meaning) : undefined,
    quote: String(row.quote),
    modality: String(row.modality) as LearningObservation['modality'],
    retrieval: String(row.retrieval) as RetrievalType,
    taskOutcome: String(row.task_outcome) as TaskOutcome,
    rehearsal: bool(row.rehearsal),
    supportExposureIds: parseJson<string[]>(String(row.support_exposure_ids ?? '[]'), []),
    hidden: bool(row.hidden),
    userDisputed: bool(row.user_disputed),
    recordedAt: String(row.created_at),
  } as LearningObservation;
}

function mapPhraseRow(row: Record<string, unknown>): PhraseItem {
  return {
    id: String(row.id),
    language: String(row.language) as LanguageCode,
    form: String(row.form),
    meaning: String(row.meaning),
    usageNote: row.usage_note ? String(row.usage_note) : '',
    difficulty: String(row.difficulty) as PhraseItem['difficulty'],
    recallStatus: String(row.recall_status) as PhraseItem['recallStatus'],
    scheduling: {
      nextReviewAt: String(row.next_review_at ?? new Date().toISOString()),
      due: false,
      intervalDays: Number(row.interval_days ?? 1),
      lastLapseAt: row.last_lapse_at ? String(row.last_lapse_at) : undefined,
      modalityHistory: parseJson<PhraseItem['scheduling']['modalityHistory']>(
        row.modality_history as string,
        []
      ),
      contexts: parseJson<string[]>(row.contexts as string, []),
    },
    stats: {
      assistedCount: Number(row.assisted_count ?? 0),
      unassistedCount: Number(row.unassisted_count ?? 0),
      spokenCount: Number(row.spoken_count ?? 0),
      typedCount: Number(row.typed_count ?? 0),
      lastPracticedAt: row.last_practiced_at ? String(row.last_practiced_at) : undefined,
    },
  };
}

function mapConsentRow(row: Record<string, unknown>): ConsentRecord {
  return {
    id: String(row.id),
    scope: String(row.scope) as ConsentRecord['scope'],
    granted: bool(row.granted),
    version: String(row.version),
    decidedAt: String(row.decided_at),
    withdrawnAt: row.withdrawn_at ? String(row.withdrawn_at) : undefined,
  };
}

export const archiveRepository: ArchiveRepositoryContract = new SqliteArchiveRepository();