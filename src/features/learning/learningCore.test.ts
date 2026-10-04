import { describe, expect, it } from 'vitest';
import {
  buildLocalObservations,
  projectPhraseState,
  StructuredAssessmentProposal,
  validateAssessmentProposal as validateRuntimeAssessment,
  validateDrillReview,
  assertValidatedPhraseEvidence,
  type ValidatedPhraseEvidence,
} from './learningCore';
import { LEARNING_POLICY } from './policy';
import { LearningObservation, Passage, PhraseItem, SupportExposure } from '../../types';

const PHRASE: Pick<UsefulPhraseLike, 'id' | 'form' | 'meaning'> = {
  id: 'phrase.es.cafe_leche',
  form: 'Un café con leche',
  meaning: 'A coffee with milk',
};

type UsefulPhraseLike = { id: string; form: string; meaning: string };

function validateAssessmentProposal(
  proposal: StructuredAssessmentProposal,
  passages: Passage[],
  exposures: SupportExposure[],
  rehearsal = false
) {
  return validateRuntimeAssessment(proposal, passages, exposures,
    { sessionId: 's-1', attemptId: 'attempt-1', candidates: [PHRASE] }, rehearsal);
}

const day = 86_400_000;

function makePassage(overrides: Partial<Passage> = {}): Passage {
  return {
    id: 'p-1',
    sessionId: 's-1',
    attemptId: 'attempt-1',
    speaker: 'user',
    revisionKey: 'rev-1',
    assemblyVersion: 1,
    status: 'final',
    text: 'quisiera un café con leche por favor',
    modality: 'spoken',
    startedAt: '2026-01-01T10:00:00.000Z',
    fragments: [],
    ...overrides,
  };
}

function makeProposal(overrides: Partial<StructuredAssessmentProposal> = {}): StructuredAssessmentProposal {
  return {
    schemaVersion: 2,
    sessionId: 's-1',
    attemptId: 'attempt-1',
    taskOutcome: 'achieved',
    items: [
      {
        itemId: PHRASE.id,
        candidateForm: PHRASE.form,
        meaning: PHRASE.meaning,
        quote: 'quisiera un café con leche por favor',
        sourcePassageId: 'p-1',
        sourceRevision: 'rev-1',
        modality: 'spoken',
        retrievalProposal: 'unassisted',
      },
    ],
    ...overrides,
  };
}

function makePhrase(overrides: Partial<PhraseItem> = {}): PhraseItem {
  return {
    id: PHRASE.id,
    language: 'es',
    form: PHRASE.form,
    meaning: PHRASE.meaning,
    usageNote: '',
    difficulty: 'beginner',
    recallStatus: 'new',
    scheduling: {
      nextReviewAt: new Date(0).toISOString(),
      due: true,
      intervalDays: 1,
      modalityHistory: [],
      contexts: [],
    },
    stats: { assistedCount: 0, unassistedCount: 0, spokenCount: 0, typedCount: 0 },
    ...overrides,
  };
}

function makeObservation(overrides: Partial<LearningObservation> = {}): LearningObservation {
  return {
    observationId: `obs-${Math.random().toString(36).slice(2, 8)}`,
    sessionId: 's-1',
    attemptId: 'attempt-1',
    sourceTurnId: 'p-1',
    sourceRevision: 'rev-1',
    itemId: PHRASE.id,
    candidateForm: PHRASE.form,
    meaning: PHRASE.meaning,
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

describe('validator-owned phrase evidence', () => {
  it('cannot be structurally forged', () => {
    // @ts-expect-error The phrase-evidence brand is private to learningCore.ts.
    const forged: ValidatedPhraseEvidence = { observations: [] };

    expect(() => assertValidatedPhraseEvidence(forged)).toThrow(
      /validator-issued evidence bundle required/i
    );

    const valid = validateAssessmentProposal(makeProposal(), [makePassage()], []);
    expect(() => assertValidatedPhraseEvidence(valid.evidence)).not.toThrow();

    const copiedBrand = Object.assign({}, valid.evidence) as ValidatedPhraseEvidence;
    expect(() => assertValidatedPhraseEvidence(copiedBrand)).toThrow(
      /validator-issued evidence bundle required/i
    );
  });
});

describe('validateDrillReview', () => {
  const base = {
    phrase: PHRASE,
    quote: 'un café con leche',
    modality: 'spoken' as const,
    selfReportedResult: 'remembered' as const,
    learnerAttemptCaptured: true,
    answerRevealedBeforeAttempt: false,
    modelAudioPlayedBeforeAttempt: false,
    recordedAt: '2026-01-01T10:00:00.000Z',
  };

  it('allows independent spoken recall only when the attempt predates support', () => {
    const evidence = validateDrillReview(base);
    expect(evidence.observations).toHaveLength(1);
    expect(evidence.observations[0].retrieval).toBe('unassisted');
    expect(evidence.observations[0].quote).toBe(base.quote);
  });

  it('makes an answer reveal before the attempt assisted', () => {
    const evidence = validateDrillReview({
      ...base,
      answerRevealedBeforeAttempt: true,
    });
    expect(evidence.observations[0].retrieval).toBe('assisted');
  });

  it('makes model audio heard before the attempt assisted', () => {
    const evidence = validateDrillReview({
      ...base,
      modelAudioPlayedBeforeAttempt: true,
    });
    expect(evidence.observations[0].retrieval).toBe('assisted');
  });

  it('creates no learner observation when only the answer was revealed/listened to', () => {
    const evidence = validateDrillReview({
      ...base,
      quote: '',
      learnerAttemptCaptured: false,
      answerRevealedBeforeAttempt: true,
      modelAudioPlayedBeforeAttempt: true,
    });
    expect(evidence.observations).toEqual([]);
  });

  it('keeps spontaneous typed recall as written/unknown, not spoken independent', () => {
    const evidence = validateDrillReview({
      ...base,
      modality: 'typed',
    });
    expect(evidence.observations[0].modality).toBe('typed');
    expect(evidence.observations[0].retrieval).toBe('unknown');
  });

  it('honors a learner report that help was needed even without a reveal', () => {
    const evidence = validateDrillReview({
      ...base,
      selfReportedResult: 'supported',
    });
    expect(evidence.observations[0].retrieval).toBe('assisted');
  });
});

describe('validateAssessmentProposal', () => {
  describe('provenance: the model may not invent evidence', () => {
    it('rejects a quote the learner never said', () => {
      const proposal = makeProposal({
        items: [
          {
            ...makeProposal().items[0],
            quote: 'quisiera un crujiente con pollo',
          },
        ],
      });

      const result = validateAssessmentProposal(proposal, [makePassage()], []);

      expect(result.validatedObservations).toHaveLength(0);
      expect(result.rejectedProposals).toHaveLength(1);
      expect(result.rejectedProposals[0].reason).toMatch(/not verified/i);
    });

    it('rejects a quote taken from the assistant side of the conversation', () => {
      const assistantPassage = makePassage({
        id: 'p-assistant',
        speaker: 'assistant',
        text: 'Claro, un café con leche para usted',
      });

      const result = validateAssessmentProposal(makeProposal(), [assistantPassage], []);

      expect(result.validatedObservations).toHaveLength(0);
      expect(result.rejectedProposals).toHaveLength(1);
    });

    it('rejects an item with no curated phrase id', () => {
      const proposal = makeProposal({
        items: [{ ...makeProposal().items[0], itemId: undefined }],
      });

      const result = validateAssessmentProposal(proposal, [makePassage()], []);

      expect(result.validatedObservations).toHaveLength(0);
      expect(result.rejectedProposals[0].reason).toMatch(/curated item id/i);
    });

    it('rejects an empty quote', () => {
      const proposal = makeProposal({ items: [{ ...makeProposal().items[0], quote: '' }] });
      const result = validateAssessmentProposal(proposal, [makePassage()], []);
      expect(result.validatedObservations).toHaveLength(0);
    });

    it('rejects a valid quote paired with a stale revision key', () => {
      const proposal = makeProposal({
        items: [{ ...makeProposal().items[0], sourceRevision: 'rev-99' }],
      });

      // The quote is real, but the cited revision does not exist, so provenance
      // cannot be established and the claim is dropped rather than trusted.
      const result = validateAssessmentProposal(proposal, [makePassage()], []);
      expect(result.validatedObservations).toHaveLength(0);
    });

    it('rejects a semantically wrong match even when the quote is real', () => {
      // The learner really said this, and the model quoted it accurately, but
      // they asked for green tea. Provenance holds; the claim does not.
      const spoken = 'quisiera un té verde por favor';
      const passage = makePassage({ text: spoken });
      const proposal = makeProposal({ items: [{ ...makeProposal().items[0], quote: spoken }] });

      const result = validateAssessmentProposal(proposal, [passage], []);

      expect(result.validatedObservations).toHaveLength(0);
      expect(result.rejectedProposals[0].reason).toMatch(/does not convey/i);
    });

    it('keeps the other items when one item is malformed', () => {
      const good = makeProposal().items[0];
      const result = validateAssessmentProposal(
        makeProposal({
          items: [
            { ...good, quote: '' },
            { ...good, itemId: 'phrase.es.otra', candidateForm: 'Otra cosa' },
            good,
          ],
        }),
        [makePassage()],
        []
      );

      expect(result.validatedObservations).toHaveLength(1);
      expect(result.rejectedProposals).toHaveLength(2);
    });
  });

  describe('retrieval is derived, never taken from the model', () => {
    it('overrides a model claim of unassisted when the briefing exposed the form', () => {
      const exposures: SupportExposure[] = [
        {
          id: 'exp-1',
          sessionId: 's-1',
          attemptId: 'attempt-1',
          source: 'briefing',
          kind: 'full_form',
          targetItemIds: [PHRASE.id],
          exposure: 'visible',
          recordedAt: '2026-01-01T09:59:30.000Z',
        },
      ];

      const result = validateAssessmentProposal(makeProposal(), [makePassage()], exposures);

      expect(result.validatedObservations[0].retrieval).toBe('assisted');
    });

    it('never records a revealed briefing phrase as unassisted', () => {
      const exposures: SupportExposure[] = [
        {
          id: 'exp-briefing-reveal',
          sessionId: 's-1',
          attemptId: 'attempt-1',
          source: 'briefing',
          kind: 'briefing_exposure',
          targetPhraseId: PHRASE.id,
          targetItemIds: [PHRASE.id],
          exposure: 'visible',
          recordedAt: '2026-01-01T09:59:30.000Z',
        },
      ];

      const result = validateAssessmentProposal(
        makeProposal(),
        [makePassage()],
        exposures
      );

      expect(result.validatedObservations[0].retrieval).toBe('assisted');
      expect(result.validatedObservations[0].supportExposureIds).toContain(
        'exp-briefing-reveal'
      );
    });

    it('never records a listened model phrase as unassisted', () => {
      const exposures: SupportExposure[] = [
        {
          id: 'exp-model-listen',
          sessionId: 's-1',
          attemptId: 'attempt-1',
          source: 'coach',
          kind: 'model_phrase_audio',
          targetPhraseId: PHRASE.id,
          targetItemIds: [PHRASE.id],
          exposure: 'played',
          recordedAt: '2026-01-01T09:59:30.000Z',
        },
      ];

      const result = validateAssessmentProposal(
        makeProposal(),
        [makePassage()],
        exposures
      );

      expect(result.validatedObservations[0].retrieval).toBe('assisted');
      expect(result.validatedObservations[0].supportExposureIds).toContain(
        'exp-model-listen'
      );
    });

    it('downgrades unassisted when a coach showed the full form', () => {
      const exposures: SupportExposure[] = [
        {
          id: 'exp-2',
          sessionId: 's-1',
          attemptId: 'attempt-1',
          source: 'coach',
          kind: 'full_form',
          targetItemIds: [PHRASE.id],
          exposure: 'visible',
          recordedAt: '2026-01-01T09:59:30.000Z',
        },
      ];

      const result = validateAssessmentProposal(makeProposal(), [makePassage()], exposures);
      expect(result.validatedObservations[0].retrieval).toBe('assisted');
    });

    it('does not downgrade for an intent hint alone, which exposes no form', () => {
      const exposures: SupportExposure[] = [
        {
          id: 'exp-3',
          sessionId: 's-1',
          attemptId: 'attempt-1',
          source: 'coach',
          kind: 'intent_hint',
          targetItemIds: [PHRASE.id],
          exposure: 'visible',
          recordedAt: new Date().toISOString(),
        },
      ];

      const result = validateAssessmentProposal(makeProposal(), [makePassage()], exposures);
      expect(result.validatedObservations[0].retrieval).toBe('unassisted');
    });

    it('marks a rehearsal attempt assisted', () => {
      const result = validateAssessmentProposal(makeProposal(), [makePassage()], [], true);
      expect(result.validatedObservations[0].retrieval).toBe('assisted');
      expect(result.validatedObservations[0].rehearsal).toBe(true);
    });

    it('records a typed answer as unknown retrieval, not spoken production', () => {
      const typedPassage = makePassage({ modality: 'typed' });
      const proposal = makeProposal({
        items: [{ ...makeProposal().items[0], modality: 'typed' }],
      });

      const result = validateAssessmentProposal(proposal, [typedPassage], []);

      expect(result.validatedObservations[0].modality).toBe('typed');
      expect(result.validatedObservations[0].retrieval).toBe('unknown');
    });

    it('ignores an actor exposure older than the modeling window', () => {
      const stale = new Date(Date.now() - (LEARNING_POLICY.modeledFormWindowMs + day)).toISOString();
      const exposures: SupportExposure[] = [
        {
          id: 'exp-4',
          sessionId: 's-1',
          attemptId: 'attempt-1',
          source: 'actor',
          kind: 'repeat',
          targetItemIds: [PHRASE.id],
          exposure: 'played',
          recordedAt: stale,
        },
      ];

      const result = validateAssessmentProposal(makeProposal(), [makePassage()], exposures);
      expect(result.validatedObservations[0].retrieval).toBe('unassisted');
    });
  });

  it('defaults the outcome to unknown rather than a flattering label', () => {
    const result = validateAssessmentProposal(
      makeProposal({ taskOutcome: undefined as any }),
      [makePassage()],
      []
    );
    expect(result.taskOutcome).toBe('unknown');
  });
});

describe('buildLocalObservations', () => {
  const candidates = [PHRASE];

  it('records a verified paraphrase as unassisted on a cold attempt', () => {
    const { observations } = buildLocalObservations({
      sessionId: 's-1',
      attemptId: 'attempt-1',
      passages: [makePassage()],
      supportExposures: [],
      candidates,
      isColdAttempt: true,
      isRehearsalAttempt: false,
    });

    expect(observations).toHaveLength(1);
    expect(observations[0].retrieval).toBe('unassisted');
    expect(observations[0].itemId).toBe(PHRASE.id);
  });

  it('records assisted when the briefing exposed the phrase', () => {
    const { observations } = buildLocalObservations({
      sessionId: 's-1',
      attemptId: 'attempt-1',
      passages: [makePassage()],
      supportExposures: [
        {
          id: 'exp-1',
          sessionId: 's-1',
          attemptId: 'attempt-1',
          source: 'briefing',
          kind: 'full_form',
          targetItemIds: [PHRASE.id],
          exposure: 'visible',
          recordedAt: '2026-01-01T09:59:30.000Z',
        },
      ],
      candidates,
      isColdAttempt: false,
      isRehearsalAttempt: false,
    });

    expect(observations[0].retrieval).toBe('assisted');
  });

  it('keeps a cold attempt assisted after reveal or listen of the exact phrase', () => {
    for (const exposure of [
      {
        id: 'exp-local-briefing',
        sessionId: 's-1',
        attemptId: 'attempt-1',
        source: 'briefing' as const,
        kind: 'briefing_exposure' as const,
        targetPhraseId: PHRASE.id,
        targetItemIds: [PHRASE.id],
        exposure: 'visible' as const,
        recordedAt: '2026-01-01T09:59:30.000Z',
      },
      {
        id: 'exp-local-listen',
        sessionId: 's-1',
        attemptId: 'attempt-1',
        source: 'coach' as const,
        kind: 'model_phrase_audio' as const,
        targetPhraseId: PHRASE.id,
        targetItemIds: [PHRASE.id],
        exposure: 'played' as const,
        recordedAt: '2026-01-01T09:59:30.000Z',
      },
    ]) {
      const { observations } = buildLocalObservations({
        sessionId: 's-1',
        attemptId: 'attempt-1',
        passages: [makePassage()],
        supportExposures: [exposure],
        candidates,
        isColdAttempt: true,
        isRehearsalAttempt: false,
      });

      expect(observations).toHaveLength(1);
      expect(observations[0].retrieval).toBe('assisted');
      expect(observations[0].supportExposureIds).toContain(exposure.id);
    }
  });

  it('records nothing and reports ambiguity for a wrong item', () => {
    const { observations, ambiguous } = buildLocalObservations({
      sessionId: 's-1',
      attemptId: 'attempt-1',
      passages: [makePassage({ text: 'quisiera un té verde' })],
      supportExposures: [],
      candidates,
      isColdAttempt: true,
      isRehearsalAttempt: false,
    });

    expect(observations).toHaveLength(0);
    expect(typeof ambiguous).toBe('number');
  });

  it('emits one observation per phrase per passage, never duplicates', () => {
    const { observations } = buildLocalObservations({
      sessionId: 's-1',
      attemptId: 'attempt-1',
      passages: [makePassage()],
      supportExposures: [],
      candidates,
      isColdAttempt: true,
      isRehearsalAttempt: false,
    });

    const keys = observations.map(o => `${o.sourceTurnId}:${o.itemId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('projectPhraseState', () => {
  it('stays new with no usable evidence', () => {
    const projected = projectPhraseState(makePhrase(), []);
    expect(projected.recallStatus).toBe('new');
    expect(projected.scheduling.due).toBe(true);
  });

  it('is supported when every observation was assisted', () => {
    const projected = projectPhraseState(makePhrase(), [makeObservation({ retrieval: 'assisted' })]);
    expect(projected.recallStatus).toBe('supported');
  });

  it('is growing after one independent spoken recall', () => {
    const projected = projectPhraseState(makePhrase(), [makeObservation()]);
    expect(projected.recallStatus).toBe('growing');
  });

  it('does not reach steady from two recalls in a single sitting', () => {
    const now = Date.now();
    const projected = projectPhraseState(makePhrase(), [
      makeObservation({ recordedAt: new Date(now - 60_000).toISOString() }),
      makeObservation({
        sessionId: 's-1',
        recordedAt: new Date(now - 30_000).toISOString(),
      }),
    ]);

    expect(projected.recallStatus).not.toBe('steady');
  });

  it('reaches steady after independent recall across sessions and a real span', () => {
    const now = Date.now();
    const projected = projectPhraseState(
      makePhrase(),
      [
        makeObservation({ recordedAt: new Date(now - 10 * day).toISOString() }),
        makeObservation({
          sessionId: 's-2',
          recordedAt: new Date(now - day).toISOString(),
        }),
      ]
    );

    expect(projected.recallStatus).toBe('steady');
    expect(projected.scheduling.intervalDays).toBe(LEARNING_POLICY.intervals.steady);
  });

  it('does not reach steady from typed recall alone', () => {
    const now = Date.now();
    const projected = projectPhraseState(makePhrase(), [
      makeObservation({ modality: 'typed', recordedAt: new Date(now - 10 * day).toISOString() }),
      makeObservation({
        sessionId: 's-2',
        modality: 'typed',
        recordedAt: new Date(now - day).toISOString(),
      }),
    ]);

    expect(projected.recallStatus).not.toBe('steady');
  });

  it('ignores hidden and disputed observations', () => {
    const now = Date.now();
    const projected = projectPhraseState(makePhrase(), [
      makeObservation({ hidden: true, recordedAt: new Date(now - 10 * day).toISOString() }),
      makeObservation({
        sessionId: 's-2',
        userDisputed: true,
        recordedAt: new Date(now - day).toISOString(),
      }),
    ]);

    expect(projected.recallStatus).toBe('new');
  });

  it('derives due from the schedule, independently of recall status', () => {
    const projected = projectPhraseState(makePhrase(), [makeObservation()]);
    // A learner who recalled this today is "growing", but a long-overdue
    // schedule still reports due. The two dimensions stay separate.
    expect(projected.recallStatus).toBe('growing');
    expect(typeof projected.scheduling.due).toBe('boolean');
  });

  it('applies the versioned interval for each status', () => {
    const now = Date.now();
    const growing = projectPhraseState(makePhrase(), [makeObservation()]);
    expect(growing.scheduling.intervalDays).toBe(LEARNING_POLICY.intervals.growing);

    const steady = projectPhraseState(makePhrase(), [
      makeObservation({ recordedAt: new Date(now - 10 * day).toISOString() }),
      makeObservation({ sessionId: 's-2', recordedAt: new Date(now - day).toISOString() }),
    ]);
    expect(steady.scheduling.intervalDays).toBe(LEARNING_POLICY.intervals.steady);
  });
});
