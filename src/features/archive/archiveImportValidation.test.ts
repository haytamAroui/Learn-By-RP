import { describe, expect, it } from 'vitest';
import { prepareArchiveImport } from './archiveImportValidation';

const PHRASE = {
  id: 'phrase.es.1',
  language: 'es',
  form: 'leche de avena',
  meaning: 'oat milk',
  usageNote: '',
  difficulty: 'beginner',
  recallStatus: 'new',
  scheduling: {
    nextReviewAt: '2026-10-03T00:00:00.000Z',
    due: true,
    intervalDays: 1,
    modalityHistory: [],
    contexts: [],
  },
  stats: {
    assistedCount: 0,
    unassistedCount: 0,
    spokenCount: 0,
    typedCount: 0,
  },
};

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    missionId: 'mission-es-cafe-sol',
    missionVersion: 1,
    language: 'es',
    mode: 'guided',
    coldAttempt: true,
    state: 'recap_ready',
    startedAt: '2026-10-02T08:00:00.000Z',
    endedAt: '2026-10-02T08:05:00.000Z',
    passages: [
      {
        id: 'p-1',
        sessionId: 'session-1',
        attemptId: 'attempt-1',
        speaker: 'user',
        revisionKey: 'rev-1',
        assemblyVersion: 3,
        status: 'final',
        text: 'Quiero leche de avena, por favor.',
        modality: 'spoken',
        startedAt: '2026-10-02T08:01:00.000Z',
        endedAt: '2026-10-02T08:01:03.000Z',
        fragments: [],
      },
    ],
    supportExposures: [],
    opportunityInstances: [
      {
        id: 'opp-1',
        attemptId: 'attempt-1',
        opportunityId: 'opp.es.cafe.request-substitution.after-alternative',
        skillId: 'skill-request-substitution',
        status: 'taken',
        detection: 'validated',
        demonstration: 'demonstrated',
        learnerAttemptPassageId: 'p-1',
        learnerAttemptRevision: 'rev-1',
        recordedAt: '2026-10-02T08:01:03.000Z',
      },
    ],
    observations: [
      {
        observationId: 'obs-1',
        sessionId: 'session-1',
        attemptId: 'attempt-1',
        sourceTurnId: 'p-1',
        sourceRevision: 'rev-1',
        itemId: 'phrase.es.1',
        candidateForm: 'leche de avena',
        meaning: 'oat milk',
        quote: 'leche de avena',
        modality: 'spoken',
        retrieval: 'unassisted',
        taskOutcome: 'achieved',
        rehearsal: false,
        supportExposureIds: [],
        recordedAt: '2026-10-02T08:01:03.000Z',
      },
    ],
    skillObservations: [
      {
        id: 'skill-obs-1',
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
        opportunityInstanceId: 'opp-1',
        supportExposureIds: [],
        evidenceSource: 'validated_explicit',
        quote: 'leche de avena',
        recordedAt: '2026-10-02T08:01:03.000Z',
      },
    ],
    skillLapses: [],
    taskOutcome: 'completed',
    sceneState: {
      sceneId: 'scene.es.cafe.breakfast',
      revision: 2,
      facts: {},
      learnerKnows: [],
      characterKnows: [],
      checkpoints: [],
      isFinished: true,
      outcome: 'achieved',
    },
    ...overrides,
  };
}

function archive(rawSession = session()) {
  return {
    schemaVersion: 1,
    preferences: {},
    sessions: [rawSession],
    phrases: [PHRASE],
  };
}

describe('prepareArchiveImport', () => {
  it('accepts an app backup whose phrase and skill evidence is grounded', () => {
    const result = prepareArchiveImport(archive());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.sessions).toHaveLength(1);
    expect(result.value.sessions[0].observations).toHaveLength(1);
    expect(result.value.sessions[0].skillObservations).toHaveLength(1);
  });

  it('rejects a phrase quote that does not exist in the learner passage', () => {
    const raw = session();
    (raw.observations[0] as any).quote = 'invented words';

    const result = prepareArchiveImport(archive(raw));

    expect(result).toMatchObject({
      ok: false,
      message: expect.stringMatching(/unverified phrase evidence/i),
    });
  });

  it('rejects evidence cited to an assistant passage', () => {
    const raw = session();
    (raw.passages[0] as any).speaker = 'assistant';

    expect(prepareArchiveImport(archive(raw))).toMatchObject({
      ok: false,
      message: expect.stringMatching(/unverified phrase evidence/i),
    });
  });

  it('rejects evidence produced under a stale transcript revision', () => {
    const raw = session();
    (raw.observations[0] as any).sourceRevision = 'rev-old';

    expect(prepareArchiveImport(archive(raw))).toMatchObject({
      ok: false,
      message: expect.stringMatching(/unverified phrase evidence/i),
    });
  });

  it('rejects validated-explicit skill evidence without its validated taken opportunity', () => {
    const raw = session({ opportunityInstances: [] });

    expect(prepareArchiveImport(archive(raw))).toMatchObject({
      ok: false,
      message: expect.stringMatching(/unverified skill evidence/i),
    });
  });

  it('rejects a strict lapse whose opportunity ended in a technical failure', () => {
    const raw = session({
      skillObservations: [],
      opportunityInstances: [
        {
          id: 'opp-lapse',
          attemptId: 'attempt-1',
          opportunityId: 'opp.es.cafe.request-substitution.after-alternative',
          skillId: 'skill-request-substitution',
          status: 'taken',
          detection: 'validated',
          demonstration: 'attempted_not_demonstrated',
          learnerAttemptPassageId: 'p-1',
          learnerAttemptRevision: 'rev-1',
          failureReason: 'disconnect',
          recordedAt: '2026-10-02T08:01:03.000Z',
        },
      ],
      skillLapses: [
        {
          id: 'lapse-1',
          skillId: 'skill-request-substitution',
          sessionId: 'session-1',
          attemptId: 'attempt-1',
          sourcePassageId: 'p-1',
          sourceRevision: 'rev-1',
          contextKey: {
            domainId: 'cafes',
            scenarioFamilyId: 'counter-ordering',
          },
          opportunityInstanceId: 'opp-lapse',
          demonstration: 'attempted_not_demonstrated',
          basis: 'cold_attempt_failed',
          recordedAt: '2026-10-02T08:01:03.000Z',
        },
      ],
    });

    expect(prepareArchiveImport(archive(raw))).toMatchObject({
      ok: false,
      message: expect.stringMatching(/unverified skill lapse/i),
    });
  });
});
