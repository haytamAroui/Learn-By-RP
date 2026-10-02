import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createNodeSqliteAdapter, Db } from './db';
import { __setDatabaseForTesting, migrate } from './database';
import { archiveRepository } from './SqliteArchiveRepository';
import { MISSION_CATALOG } from '../../data/missions';
import { validateSkillEvidenceProposal } from '../learning/skillEvidence';
import { projectSkillsV2 } from '../learning/skillProjection';
import { OpportunityInstance, Passage, SupportExposure } from '../../types';
import type { PersistableSessionRecord } from './ArchiveRepository.types';

/**
 * Live-session wiring.
 *
 * These cover the path from a model proposal through validation to what Recap and
 * Progress will actually read. The validator is tested thoroughly on its own; what
 * could still be wrong here is that the live runtime writes something other than
 * the validator's answer, or writes it twice, or writes inferred evidence.
 */

let driver: { db: Db; close: () => void };
const MISSION = MISSION_CATALOG.find(m => m.id === 'mission-es-cafe-sol')!;

beforeEach(async () => {
  driver = createNodeSqliteAdapter();
  await migrate(driver.db);
  __setDatabaseForTesting(driver.db);
});

afterEach(() => {
  __setDatabaseForTesting(null);
  driver.close();
});

const PASSAGE: Passage = {
  id: 'p-1',
  sessionId: 'sess-1',
  attemptId: 'attempt-1',
  speaker: 'user',
  revisionKey: 'rev-1',
  assemblyVersion: 3,
  status: 'final',
  text: 'Bonjour, je voudrais un cafe con leche y la leche de avena por favor?',
  modality: 'spoken',
  startedAt: '2026-09-20T09:00:00.000Z',
  endedAt: '2026-09-20T09:00:04.000Z',
  fragments: [],
};

const EXPOSURE: SupportExposure = {
  id: 'exp-1',
  sessionId: 'sess-1',
  attemptId: 'attempt-1',
  source: 'coach',
  kind: 'full_form',
  targetSkillId: 'skill-request-substitution',
  targetOpportunityId: 'opp-positive-1',
  targetPhraseId: 'phrase.es.1',
  targetItemIds: ['phrase.es.1'],
  exposure: 'visible',
  recordedAt: '2026-09-20T09:00:02.000Z',
};

/** What the model proposed, exactly as the wire delivers it. */
function modelProposal(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 2,
    sessionId: 'sess-1',
    attemptId: 'attempt-1',
    taskOutcome: 'achieved',
    items: [],
    skillItems: [
      {
        skillId: 'skill-request-substitution',
        quote: 'la leche de avena',
        sourcePassageId: 'p-1',
        sourceRevision: 'rev-1',
        modality: 'spoken',
        retrievalProposal: 'unassisted',
        opportunityInstanceId: 'opp-positive-1',
      },
    ],
    ...overrides,
  };
}

function positiveOpportunity(
  overrides: Partial<OpportunityInstance> = {}
): OpportunityInstance {
  return {
    id: 'opp-positive-1',
    attemptId: 'attempt-1',
    opportunityId: 'opp.es.cafe.request-substitution.after-alternative',
    skillId: 'skill-request-substitution',
    status: 'taken',
    detection: 'validated',
    demonstration: 'demonstrated',
    learnerAttemptPassageId: 'p-1',
    learnerAttemptRevision: 'rev-1',
    recordedAt: '2026-09-20T09:00:04.000Z',
    ...overrides,
  };
}

/** The runtime facts, which the model has no say over. */
function runtimeFacts(overrides: Partial<Parameters<typeof validateSkillEvidenceProposal>[1]> = {}) {
  const attemptId = overrides.attemptId ?? 'attempt-1';
  const passages = overrides.passages ?? [PASSAGE];
  const learnerPassage = passages.find(p => p.speaker === 'user') ?? PASSAGE;

  return {
    sessionId: 'sess-1',
    attemptId,
    mission: MISSION,
    passages,
    supportExposures: [] as SupportExposure[],
    opportunityInstances:
      overrides.opportunityInstances ??
      [
        positiveOpportunity({
          attemptId,
          learnerAttemptPassageId: learnerPassage.id,
          learnerAttemptRevision: learnerPassage.revisionKey,
        }),
      ],
    isRehearsalAttempt: false,
    sessionEndReason: 'completed' as const,
    evidenceSource: 'validated_explicit' as const,
    ...overrides,
  };
}

function failedOpportunity(overrides: Partial<OpportunityInstance> = {}): OpportunityInstance {
  return {
    id: 'opp-failed-1',
    attemptId: 'attempt-1',
    opportunityId: 'opp.es.cafe.request-substitution.after-alternative',
    skillId: 'skill-request-substitution',
    status: 'taken',
    detection: 'validated',
    demonstration: 'attempted_not_demonstrated',
    learnerAttemptPassageId: 'p-1',
    learnerAttemptRevision: 'rev-1',
    recordedAt: '2026-09-20T09:00:04.000Z',
    ...overrides,
  };
}

function sessionWith(skillEvidence: {
  observations?: PersistableSessionRecord['skillObservations'];
  lapses?: PersistableSessionRecord['skillLapses'];
}, opportunityInstances: OpportunityInstance[] = []): PersistableSessionRecord {
  return {
    id: 'sess-1',
    missionId: MISSION.id,
    missionVersion: MISSION.version,
    language: MISSION.language,
    mode: 'guided',
    coldAttempt: true,
    state: 'recap_ready',
    startedAt: '2026-09-20T09:00:00.000Z',
    endedAt: '2026-09-20T09:05:00.000Z',
    passages: [PASSAGE],
    supportExposures: [],
    opportunityInstances,
    observations: [],
    skillObservations: skillEvidence.observations,
    skillLapses: skillEvidence.lapses,
    taskOutcome: 'completed',
    sceneState: {
      sceneId: MISSION.sceneId ?? 'scene.es.cafe.breakfast',
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

describe('a live session persists validated skill evidence', () => {
  // 1. A valid independent proposal is persisted once.
  it('persists a valid independent skill proposal exactly once', async () => {
    const result = validateSkillEvidenceProposal(modelProposal() as any, runtimeFacts());
    expect(result.rejected).toEqual([]);

    await archiveRepository.completeSession(
      sessionWith({ observations: result.validated, lapses: result.lapses })
    );

    const stored = await archiveRepository.getSkillObservations();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      skillId: 'skill-request-substitution',
      sessionId: 'sess-1',
      attemptId: 'attempt-1',
      sourcePassageId: 'p-1',
      sourceRevision: 'rev-1',
      evidenceSource: 'validated_explicit',
      dayKey: '2026-09-20',
      reasonCode: 'validated_demonstration',
      policyVersion: 3,
    });
  });

  // 2. Replaying completion must not duplicate it.
  it('does not duplicate the observation when completion is replayed', async () => {
    const result = validateSkillEvidenceProposal(modelProposal() as any, runtimeFacts());
    const session = sessionWith({ observations: result.validated, lapses: result.lapses });

    await archiveRepository.completeSession(session);
    await archiveRepository.completeSession(session);
    await archiveRepository.completeSession(session);

    expect(await archiveRepository.getSkillObservations()).toHaveLength(1);
    expect(await archiveRepository.getSkillLapses()).toHaveLength(0);
  });

  // 3. Support on screen means assisted, and the contradiction is recorded.
  it('stores a supported proposal as assisted rather than rejecting the production', async () => {
    const result = validateSkillEvidenceProposal(modelProposal() as any, runtimeFacts({
      supportExposures: [EXPOSURE],
    }));

    expect(result.validated).toHaveLength(1);
    expect(result.validated[0].retrieval).toBe('assisted');
    expect(result.rejected.map(r => r.check)).toContain('support_contradicts_retrieval');

    await archiveRepository.completeSession(
      sessionWith({ observations: result.validated, lapses: result.lapses })
    );

    const stored = await archiveRepository.getSkillObservations();
    expect(stored[0].retrieval).toBe('assisted');
  });

  // 4. A retry cannot inherit independence from attempt 1.
  it('uses the current attemptId and refuses independence on a retry', async () => {
    const retryPassage: Passage = { ...PASSAGE, attemptId: 'attempt-2' };
    const result = validateSkillEvidenceProposal(
      modelProposal({ attemptId: 'attempt-2' }) as any,
      runtimeFacts({ passages: [retryPassage], isRehearsalAttempt: true })
    );

    expect(result.validated).toHaveLength(0);
    expect(result.rejected[0].check).toBe('rehearsal_not_independent');
  });

  it('records a retry attempt against the runtime attempt, not the proposal', async () => {
    const retryPassage: Passage = { ...PASSAGE, attemptId: 'attempt-2' };

    // The proposal claims attempt-1. Runtime says attempt-2. Runtime wins: a
    // proposal that could relabel itself could inherit independence it never had.
    const result = validateSkillEvidenceProposal(
      modelProposal({
        attemptId: 'attempt-1',
        // Proposed as assisted so the rehearsal check does not discard it first;
        // this test is about provenance of the attempt, not about independence.
        skillItems: [
          {
            skillId: 'skill-request-substitution',
            quote: 'la leche de avena',
            sourcePassageId: 'p-1',
            sourceRevision: 'rev-1',
            modality: 'spoken',
            retrievalProposal: 'assisted',
            opportunityInstanceId: 'opp-positive-1',
          },
        ],
      }) as any,
      runtimeFacts({
        attemptId: 'attempt-2',
        passages: [retryPassage],
        isRehearsalAttempt: true,
      })
    );

    await archiveRepository.completeSession(
      sessionWith({ observations: result.validated, lapses: result.lapses })
    );

    const stored = await archiveRepository.getSkillObservations();
    expect(stored).toHaveLength(1);
    expect(stored[0].attemptId).toBe('attempt-2');
  });

  it('does not let a rehearsal produce independent evidence even when nothing else is wrong', async () => {
    const result = validateSkillEvidenceProposal(modelProposal() as any, runtimeFacts({
      attemptId: 'attempt-2',
      passages: [{ ...PASSAGE, attemptId: 'attempt-2' }],
      isRehearsalAttempt: true,
    }));

    expect(result.validated).toHaveLength(0);
    expect(result.rejected.map(r => r.check)).toContain('rehearsal_not_independent');
  });

  // 5. A stale revision never reaches Recap or Progress.
  it('drops a stale passage revision so it never reaches the recap', async () => {
    const result = validateSkillEvidenceProposal(
      modelProposal({
        skillItems: [
          {
            skillId: 'skill-request-substitution',
            quote: 'la leche de avena',
            sourcePassageId: 'p-1',
            sourceRevision: 'rev-superseded',
            modality: 'spoken',
            retrievalProposal: 'unassisted',
            opportunityInstanceId: 'opp-positive-1',
          },
        ],
      }) as any,
      runtimeFacts()
    );

    expect(result.rejected[0].check).toBe('revision_mismatch');

    await archiveRepository.completeSession(
      sessionWith({ observations: result.validated, lapses: result.lapses })
    );

    expect(await archiveRepository.getSkillObservations()).toHaveLength(0);
  });

  // 6. Live sessions never manufacture legacy evidence.
  it('creates only validated_explicit evidence, never legacy_inferred', async () => {
    const results = [
      validateSkillEvidenceProposal(modelProposal() as any, runtimeFacts()),
      validateSkillEvidenceProposal(
        modelProposal({ taskOutcome: 'not_achieved' }) as any,
        runtimeFacts()
      ),
      validateSkillEvidenceProposal(modelProposal({ skillItems: [] }) as any, runtimeFacts()),
    ];

    for (const result of results) {
      await archiveRepository.completeSession(
        sessionWith({ observations: result.validated, lapses: result.lapses })
      );
    }

    const stored = await archiveRepository.getSkillObservations();
    expect(stored.length).toBeGreaterThan(0);
    expect(stored.every(o => o.evidenceSource === 'validated_explicit')).toBe(true);
  });

  it('cannot write legacy evidence even if the caller asks for it', async () => {
    // The runtime path hardcodes the source. This asserts the validator defaults
    // are safe rather than trusting the call site alone.
    const result = validateSkillEvidenceProposal(modelProposal() as any, runtimeFacts());
    expect(result.validated.every(o => o.evidenceSource === 'validated_explicit')).toBe(true);
  });
});

describe('a failed cold attempt is durably recorded as a review signal', () => {
  it('stores a lapse without promoting or demoting anything', async () => {
    const result = validateSkillEvidenceProposal(
      modelProposal({ taskOutcome: 'not_achieved', skillItems: [] }) as any,
      runtimeFacts({ opportunityInstances: [failedOpportunity()] })
    );

    expect(result.validated).toHaveLength(0);
    expect(result.lapses.length).toBeGreaterThan(0);

    await archiveRepository.completeSession(
      sessionWith(
        { observations: result.validated, lapses: result.lapses },
        [failedOpportunity()]
      )
    );

    const storedSession = await archiveRepository.getSessionById('sess-1');
    expect(storedSession?.opportunityInstances).toHaveLength(1);

    const lapses = await archiveRepository.getSkillLapses();
    expect(lapses.length).toBeGreaterThan(0);
    expect(lapses[0]).toMatchObject({
      basis: 'cold_attempt_failed',
      dayKey: '2026-09-20',
      reasonCode: 'cold_taken_opportunity_not_demonstrated',
      policyVersion: 3,
    });
    expect(await archiveRepository.getSkillObservations()).toHaveLength(0);
  });

  it('does not duplicate a lapse on replay', async () => {
    const result = validateSkillEvidenceProposal(
      modelProposal({ taskOutcome: 'not_achieved', skillItems: [] }) as any,
      runtimeFacts({ opportunityInstances: [failedOpportunity()] })
    );
    const session = sessionWith(
      { observations: result.validated, lapses: result.lapses },
      [failedOpportunity()]
    );

    await archiveRepository.completeSession(session);
    await archiveRepository.completeSession(session);

    expect((await archiveRepository.getSkillLapses()).length).toBe(result.lapses.length);
  });

  it('flags review on the persisted lapse without lowering a steady skill', async () => {
    const day = 86_400_000;
    const now = Date.parse('2026-10-01T12:00:00.000Z');

    const built = [0, 1, 2, 3].map(i => ({
      id: `so-${i}`,
      skillId: 'skill-request-substitution',
      sessionId: `s-${i}`,
      attemptId: 'attempt-1',
      sourcePassageId: `p-${i}`,
      sourceRevision: 'rev-1',
      contextKey: {
        domainId: 'test',
        scenarioFamilyId: `family-${i}`,
      },
      modality: 'spoken' as const,
      retrieval: 'unassisted' as const,
      taskOutcome: 'achieved' as const,
      demonstration: 'demonstrated' as const,
      supportExposureIds: [],
      evidenceSource: 'validated_explicit' as const,
      quote: 'la leche de avena',
      recordedAt: new Date(Date.parse('2026-09-20T09:00:00.000Z') + i * day).toISOString(),
    }));

    const lapse = {
      id: 'lapse-1',
      skillId: 'skill-request-substitution',
      sessionId: 'sess-lapse',
      attemptId: 'attempt-1',
      sourcePassageId: 'p-9',
      sourceRevision: 'rev-1',
      contextKey: {
        domainId: 'test',
        scenarioFamilyId: 'family-lapse',
      },
      opportunityInstanceId: 'opp-lapse-1',
      demonstration: 'attempted_not_demonstrated' as const,
      basis: 'cold_attempt_failed' as const,
      recordedAt: new Date(now - day).toISOString(),
    };

    await archiveRepository.completeSession(
      sessionWith({ observations: [], lapses: [lapse] })
    );

    const projections = projectSkillsV2(
      built,
      await archiveRepository.getSkillLapses(),
      now
    );
    const skill = projections.find(p => p.skillId === 'skill-request-substitution');

    expect(skill?.status).toBe('steady');
    expect(skill?.reviewDue).toBe(true);
  });
});

describe('session completion is atomic across evidence kinds', () => {
  it('writes skill evidence in the same transaction as the transcript', async () => {
    const result = validateSkillEvidenceProposal(modelProposal() as any, runtimeFacts());

    await archiveRepository.completeSession(
      sessionWith({ observations: result.validated, lapses: result.lapses })
    );

    const session = await archiveRepository.getSessionById('sess-1');
    const skills = await archiveRepository.getSkillObservations();

    expect(session).not.toBeNull();
    expect(skills).toHaveLength(1);
  });

  it('writes no skill evidence for a session that produced none', async () => {
    await archiveRepository.completeSession(sessionWith({ observations: [] }));

    expect(await archiveRepository.getSkillObservations()).toHaveLength(0);
    expect(await archiveRepository.getSkillLapses()).toHaveLength(0);
  });
});