/**
 * SQLite schema and migrations for the local archive.
 *
 * This archive is the source of truth for learning. The backend never receives
 * it. Writes that touch transcript revisions, support, assessment results and
 * projections happen inside a single transaction so a kill mid-write cannot
 * leave evidence without its provenance.
 */

export interface Migration {
  version: number;
  name: string;
  statements: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_archive',
    statements: [
      `CREATE TABLE IF NOT EXISTS preferences (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        mission_version INTEGER NOT NULL,
        language TEXT NOT NULL,
        mode TEXT NOT NULL,
        provider TEXT,
        consent_version TEXT,
        policy_version INTEGER,
        state TEXT NOT NULL,
        end_reason TEXT,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        usage_json TEXT
      );`,

      `CREATE TABLE IF NOT EXISTS attempts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        parent_attempt_id TEXT,
        checkpoint_id TEXT,
        rehearsal INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS passages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        attempt_id TEXT NOT NULL,
        speaker TEXT NOT NULL,
        revision_key TEXT NOT NULL,
        assembly_version INTEGER NOT NULL,
        status TEXT NOT NULL,
        text TEXT,
        meaning TEXT,
        modality TEXT NOT NULL,
        provider_item_id TEXT,
        connection_generation INTEGER,
        started_at TEXT,
        ended_at TEXT
      );`,

      `CREATE TABLE IF NOT EXISTS fragments (
        id TEXT PRIMARY KEY,
        passage_id TEXT NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
        origin TEXT NOT NULL,
        text TEXT,
        meaning_visible INTEGER NOT NULL DEFAULT 0
      );`,

      `CREATE TABLE IF NOT EXISTS support_exposures (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        attempt_id TEXT NOT NULL,
        turn_id TEXT,
        source TEXT NOT NULL,
        kind TEXT NOT NULL,
        target_item_ids TEXT,
        exposure TEXT NOT NULL,
        recorded_at TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS assessment_proposals (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        attempt_id TEXT NOT NULL,
        schema_version INTEGER,
        raw_json TEXT NOT NULL,
        parse_status TEXT NOT NULL,
        validation_errors TEXT,
        received_at TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS observations (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        attempt_id TEXT NOT NULL,
        source_turn_id TEXT NOT NULL,
        source_revision TEXT NOT NULL,
        item_id TEXT NOT NULL,
        candidate_form TEXT NOT NULL,
        meaning TEXT,
        quote TEXT NOT NULL,
        modality TEXT NOT NULL,
        retrieval TEXT NOT NULL,
        task_outcome TEXT NOT NULL,
        rehearsal INTEGER NOT NULL DEFAULT 0,
        support_exposure_ids TEXT,
        policy_version INTEGER NOT NULL,
        hidden INTEGER NOT NULL DEFAULT 0,
        user_disputed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS skill_observations (
        id TEXT PRIMARY KEY,
        skill_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        attempt_id TEXT NOT NULL,
        source_passage_id TEXT NOT NULL,
        source_revision TEXT NOT NULL,
        domain_id TEXT,
        scenario_id TEXT,
        exam_program_id TEXT,
        exam_task_id TEXT,
        modality TEXT NOT NULL,
        retrieval TEXT NOT NULL,
        task_outcome TEXT NOT NULL,
        support_exposure_ids TEXT,
        evidence_source TEXT NOT NULL,
        quote TEXT NOT NULL,
        policy_version INTEGER NOT NULL,
        hidden INTEGER NOT NULL DEFAULT 0,
        user_disputed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );`,

      // One validated observation per skill per passage per revision, so a replayed
      // action cannot inflate a skill's evidence.
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_skill_observation
        ON skill_observations (skill_id, source_passage_id, source_revision);`,

      `CREATE INDEX IF NOT EXISTS idx_skill_observation_session
        ON skill_observations (session_id);`,

      `CREATE TABLE IF NOT EXISTS skill_lapses (
        id TEXT PRIMARY KEY,
        skill_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        attempt_id TEXT NOT NULL,
        source_passage_id TEXT NOT NULL,
        source_revision TEXT NOT NULL,
        domain_id TEXT,
        scenario_id TEXT,
        basis TEXT NOT NULL,
        policy_version INTEGER NOT NULL,
        hidden INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );`,

      `CREATE INDEX IF NOT EXISTS idx_skill_lapse_skill
        ON skill_lapses (skill_id, created_at);`,

      // The uniqueness key that makes duplicate evidence on reconnect impossible.
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_observation
         ON observations(source_turn_id, source_revision, item_id);`,

      `CREATE UNIQUE INDEX IF NOT EXISTS uq_passage_revision
         ON passages(id, revision_key);`,

      `CREATE TABLE IF NOT EXISTS phrases (
        id TEXT PRIMARY KEY,
        language TEXT NOT NULL,
        form TEXT NOT NULL,
        meaning TEXT NOT NULL,
        usage_note TEXT,
        difficulty TEXT NOT NULL,
        recall_status TEXT NOT NULL,
        next_review_at TEXT,
        interval_days INTEGER NOT NULL DEFAULT 1,
        modality_history TEXT,
        contexts TEXT,
        assisted_count INTEGER NOT NULL DEFAULT 0,
        unassisted_count INTEGER NOT NULL DEFAULT 0,
        spoken_count INTEGER NOT NULL DEFAULT 0,
        typed_count INTEGER NOT NULL DEFAULT 0,
        last_practiced_at TEXT,
        updated_at TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS scene_state (
        session_id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        revision INTEGER NOT NULL,
        facts TEXT NOT NULL,
        checkpoints TEXT,
        is_finished INTEGER NOT NULL DEFAULT 0,
        outcome TEXT
      );`,

      `CREATE TABLE IF NOT EXISTS scene_events (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        attempt_id TEXT NOT NULL,
        action_id TEXT NOT NULL,
        action_name TEXT NOT NULL,
        payload TEXT,
        result TEXT,
        expected_revision INTEGER,
        applied_at TEXT NOT NULL
      );`,

      // A second tool request with the same action_id returns the stored result
      // instead of applying the transition twice.
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_scene_action ON scene_events(action_id);`,

      `CREATE TABLE IF NOT EXISTS consent_records (
        id TEXT PRIMARY KEY,
        scope TEXT NOT NULL,
        granted INTEGER NOT NULL,
        version TEXT NOT NULL,
        decided_at TEXT NOT NULL,
        withdrawn_at TEXT
      );`,

      `CREATE TABLE IF NOT EXISTS deletion_markers (
        id TEXT PRIMARY KEY,
        scope TEXT NOT NULL,
        target_id TEXT,
        created_at TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS pending_jobs (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        target_id TEXT,
        payload TEXT,
        created_at TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS lexical_items (
        id TEXT PRIMARY KEY,
        language TEXT NOT NULL,
        lemma TEXT NOT NULL,
        meaning TEXT NOT NULL,
        phrase_ids TEXT NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS skill_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        evidence_phrase_ids TEXT NOT NULL,
        sample_phrases TEXT NOT NULL,
        associated_missions TEXT NOT NULL
      );`,
    ],
  },
  {
    version: 2,
    name: 'persist_session_attempt_metadata',
    statements: [
      `ALTER TABLE sessions ADD COLUMN cold_attempt INTEGER NOT NULL DEFAULT 1;`,
    ],
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/** Bumped whenever consent copy or scope changes meaningfully. */
export const CONSENT_VERSION = '2026-09-30.1';
