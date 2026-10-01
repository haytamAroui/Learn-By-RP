import { describe, expect, it } from 'vitest';
import { EVIDENCE_CASES, SCENE_CASES, TranscriptCase } from '../contracts/fixtures';
import { buildLocalObservations } from '../features/learning/learningCore';
import { LEARNING_POLICY } from '../features/learning/policy';
import { applyResult, createInitialScene, reduceSceneAction } from '../features/roleplay/sceneReducer';
import { getScene } from '../content/scenes';
import { LearningObservation, Passage, SupportExposure } from '../types';

/**
 * The §18.5 scenarios, run from shared fixtures so the client validator and the
 * server reducer are held to the same cases.
 */
const runCase = (testCase: TranscriptCase) => {
  const passage: Passage = {
    id: `p-${testCase.id}`,
    sessionId: 'fixture-session',
    attemptId: 'attempt-1',
    speaker: 'user',
    revisionKey: 'rev-1',
    assemblyVersion: 1,
    status: 'final',
    text: testCase.learnerUtterance,
    modality: testCase.modality ?? 'spoken',
    startedAt: '2026-09-30T10:00:00.000Z',
    fragments: [],
  };

  const exposures: SupportExposure[] = (testCase.exposures ?? []).map((exposure, index) => ({
    id: `exp-${testCase.id}-${index}`,
    sessionId: 'fixture-session',
    attemptId: 'attempt-1',
    source: exposure.source,
    kind: exposure.kind,
    targetItemIds: [testCase.target.id],
    exposure: 'visible',
    recordedAt: new Date(Date.now() - (exposure.minutesAgo ?? 0) * 60_000).toISOString(),
  }));

  return buildLocalObservations({
    sessionId: 'fixture-session',
    attemptId: 'attempt-1',
    passages: [passage],
    supportExposures: exposures,
    candidates: [testCase.target, ...(testCase.distractor ? [testCase.distractor] : [])],
    isColdAttempt: testCase.isColdAttempt ?? true,
    isRehearsalAttempt: testCase.isRehearsalAttempt ?? false,
  });
};

describe('required test scenarios — evidence', () => {
  for (const testCase of EVIDENCE_CASES) {
    describe(`#${testCase.spec} — ${testCase.title}`, () => {
      it(testCase.expect.reason, () => {
        const { observations } = runCase(testCase);
        const forTarget = observations.filter(o => o.itemId === testCase.target.id);

        expect(forTarget.length > 0).toBe(testCase.expect.credited);

        if (forTarget.length > 0) {
          expect(forTarget[0].retrieval).toBe(testCase.expect.retrieval);
        }
      });
    });
  }
});

describe('required test scenarios — scene runtime', () => {
  for (const testCase of SCENE_CASES) {
    describe(`#${testCase.spec} — ${testCase.title}`, () => {
      it('matches the expected verdict', () => {
        const scene = getScene(testCase.sceneId);
        expect(scene).toBeDefined();

        let state = createInitialScene(scene!, 'fixture-session', 'attempt-1');
        const applied = new Map<string, ReturnType<typeof reduceSceneAction>>();
        let lastResult = reduceSceneAction({
          scene: scene!,
          state,
          proposal: {
            actionId: testCase.steps[0].actionId,
            sessionId: 'fixture-session',
            attemptId: 'attempt-1',
            expectedSceneRevision: testCase.steps[0].expectedSceneRevision,
            action: testCase.steps[0].action,
            payload: testCase.steps[0].payload,
            sourceTurnIds: ['p-1'],
          },
          appliedResults: applied,
        });
        applied.set(lastResult.actionId, lastResult);
        state = applyResult(scene!, state, lastResult);

        for (const step of testCase.steps.slice(1)) {
          lastResult = reduceSceneAction({
            scene: scene!,
            state,
            proposal: {
              actionId: step.actionId,
              sessionId: 'fixture-session',
              attemptId: 'attempt-1',
              expectedSceneRevision: step.expectedSceneRevision,
              action: step.action,
              payload: step.payload,
              sourceTurnIds: ['p-1'],
            },
            appliedResults: applied,
          });
          applied.set(lastResult.actionId, lastResult);
          state = applyResult(scene!, state, lastResult);
        }

        expect(lastResult.accepted).toBe(testCase.expect.accepted);

        if (testCase.expect.reasonContains) {
          expect(lastResult.reason).toMatch(new RegExp(testCase.expect.reasonContains, 'i'));
        }
        if (testCase.expect.outcome) {
          expect(state.outcome).toBe(testCase.expect.outcome);
        }
      });
    });
  }
});

describe('fixture integrity', () => {
  it('covers the specification scenarios without gaps in the numbered set', () => {
    const covered = new Set([
      ...EVIDENCE_CASES.map(c => c.spec),
      ...SCENE_CASES.map(c => c.spec),
    ]);
    // Scenarios 8, 9, 10, 14, 15 depend on network, provider and process-death
    // behaviour that cannot be asserted from a pure fixture.
    const pure = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13];
    for (const spec of pure) {
      expect(covered.has(spec)).toBe(true);
    }
  });

  it('gives every evidence case a curated phrase id', () => {
    for (const testCase of EVIDENCE_CASES) {
      expect(testCase.target.id).toMatch(/^phrase\.[a-z]{2}\./);
    }
  });

  it('keeps the modeling window long enough to be a real window', () => {
    expect(LEARNING_POLICY.modeledFormWindowMs).toBeGreaterThanOrEqual(60_000);
  });
});

describe('evidence reclassification is a pure function of the ledger', () => {
  it('produces identical output for identical input', () => {
    const testCase = EVIDENCE_CASES.find(c => c.id === 'case-12-hinted-repetition')!;
    const a = runCase(testCase);
    const b = runCase(testCase);

    const key = (obs: LearningObservation) => `${obs.itemId}:${obs.retrieval}:${obs.modality}`;
    expect(a.observations.map(key)).toEqual(b.observations.map(key));
  });
});
