import { describe, expect, it } from 'vitest';
import {
  quoteAppearsIn,
  validateSkillEvidenceProposal,
  deriveRetrieval,
  isIndependentSuccess,
  isLapse,
  SkillEvidenceCandidate,
} from './skillEvidence';
import { inferLegacySkillEvidence, projectSkill, projectSkillsV2 } from './skillProjection';
import { allowedSkillIds, allowedSkillsForMission } from './skillMembership';
import { SKILL_POLICY } from './policy';
import { COMMUNICATIVE_SKILLS_CATALOG, MISSION_CATALOG as MISSIONS } from '../../data/missions';
import {
  LearningObservation,
  MissionDefinition,
  OpportunityInstance,
  Passage,
  SkillLapse,
  SkillObservation,
  SupportExposure,
} from '../../types';

/**
 * Skill evidence contract.
 *
 * The claim under test is that a skill can only ever be credited from evidence
 * that is (a) declared by the mission, (b) anchored to words the learner actually
 * produced under the transcript revision they spoke, and (c) not contradicted by
 * the support ledger. Substring matching used to stand in for all three.
 */

const SKILL = 'skill-request-substitution';

function mission(overrides: Partial<MissionDefinition> = {}): MissionDefinition {
  const found = MISSIONS.find(m => m.id === 'mission-es-cafe-sol')!;
  return { ...found, ...overrides };
}

function passage(overrides: Partial<Passage> = {}): Passage {
  return {
    id: 'p-1',
    sessionId: 's-1',
    attemptId: 'attempt-1',
    speaker: 'user',
    revisionKey: 'rev-1',
    assemblyVersion: 1,
    status: 'final',
    text: 'Bonjour, je voudrais un café con leche y la leche de avena por favor?',
    modality: 'spoken',
    startedAt: '2026-09-20T09:00:00.000Z',
    endedAt: '2026-09-20T09:00:04.000Z',
    fragments: [],
    ...overrides,
  };
}

function exposure(overrides: Partial<SupportExposure> = {}): SupportExposure {
  return {
    id: 'exp-1',
    sessionId: 's-1',
    attemptId: 'attempt-1',
    kind: 'full_form',
    source: 'coach',
    targetSkillId: SKILL,
    targetOpportunityId: 'opp-1',
    targetPhraseId: 'phrase.es.1',
    targetItemIds: ['phrase.es.1'],
    exposure: 'visible',
    recordedAt: '2026-09-20T09:00:02.000Z',
    ...overrides,
  };
}

function candidate(overrides: Partial<SkillEvidenceCandidate> = {}): SkillEvidenceCandidate {
  return {
    skillId: SKILL,
    sourcePassageId: 'p-1',
    sourceRevision: 'rev-1',
    quote: 'la leche de avena',
    modality: 'spoken',
    retrievalProposal: 'unassisted',
    opportunityInstanceId: 'opp-1',
    supportExposureIds: [],
    ...overrides,
  };
}

function proposal(skillItems: SkillEvidenceCandidate[], taskOutcome: 'achieved' | 'partial' | 'not_achieved' | 'unknown' = 'achieved') {
  return {
    schemaVersion: 1,
    sessionId: 's-1',
    attemptId: 'attempt-1',
    taskOutcome,
    skillItems,
  };
}

function opportunity(overrides: Partial<OpportunityInstance> = {}): OpportunityInstance {
  return {
    id: 'opp-1',
    attemptId: 'attempt-1',
    opportunityId: 'opp.es.cafe.request-substitution.after-alternative',
    skillId: SKILL,
    status: 'taken',
    detection: 'validated',
    demonstration: 'attempted_not_demonstrated',
    learnerAttemptPassageId: 'p-1',
    learnerAttemptRevision: 'rev-1',
    recordedAt: '2026-09-20T09:00:04.000Z',
    ...overrides,
  };
}

const context = (
  overrides: Partial<Parameters<typeof validateSkillEvidenceProposal>[1]> = {}
) => ({
  sessionId: 's-1',
  attemptId: 'attempt-1',
  mission: mission(),
  passages: [passage()],
  supportExposures: [] as SupportExposure[],
  opportunityInstances: [opportunity({ demonstration: 'demonstrated' })] as OpportunityInstance[],
  sessionEndReason: 'completed' as const,
  ...overrides,
} as Parameters<typeof validateSkillEvidenceProposal>[1]);

describe('validateSkillEvidenceProposal', () => {
  it('accepts a skill the mission declares, quoted from the learner', () => {
    const result = validateSkillEvidenceProposal(proposal([candidate()]), context());

    expect(result.rejected).toEqual([]);
    expect(result.validated).toHaveLength(1);
    expect(result.validated[0].skillId).toBe(SKILL);
    expect(result.validated[0].demonstration).toBe('demonstrated');
    expect(result.validated[0].evidenceSource).toBe('validated_explicit');
  });

  it('rejects a skill that is not in the catalog', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate({ skillId: 'skill-invented-by-model' })]),
      context()
    );

    expect(result.validated).toHaveLength(0);
    expect(result.rejected[0].check).toBe('unknown_skill');
  });

  // This is the check the whole contract exists for.
  it('rejects a catalogued skill the mission does not declare', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate({ skillId: 'skill-wayfinding-transit' })]),
      context()
    );

    expect(result.validated).toHaveLength(0);
    expect(result.rejected[0].check).toBe('not_in_mission');
    expect(result.rejected[0].reason).toContain('does not declare');
  });

  it('does not credit a mission-declared skill without an authored scene opportunity', () => {
    const repair = opportunity({
      id: 'opp-repair',
      opportunityId: 'opp.es.cafe.repair.unreleased',
      skillId: 'skill-communicative-repair',
    });
    const result = validateSkillEvidenceProposal(
      proposal([
        candidate({
          skillId: 'skill-communicative-repair',
          opportunityInstanceId: repair.id,
        }),
      ]),
      context({ opportunityInstances: [repair] })
    );

    expect(result.validated).toHaveLength(0);
    expect(result.rejected[0].check).toBe('opportunity_not_declared');
  });

  it('rejects positive explicit evidence without an opportunity link', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate({ opportunityInstanceId: undefined })]),
      context()
    );

    expect(result.validated).toHaveLength(0);
    expect(result.rejected[0].check).toBe('opportunity_required');
  });

  it('links a demonstrated skill to a validated taken opportunity when supplied', () => {
    const instance = opportunity({ demonstration: 'demonstrated' });
    const result = validateSkillEvidenceProposal(
      proposal([candidate({ opportunityInstanceId: instance.id })]),
      context({ opportunityInstances: [instance] })
    );

    expect(result.rejected).toEqual([]);
    expect(result.validated[0].opportunityInstanceId).toBe(instance.id);
  });

  it('rejects an invented opportunity id', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate({ opportunityInstanceId: 'opp-invented' })]),
      context({ opportunityInstances: [opportunity()] })
    );

    expect(result.validated).toHaveLength(0);
    expect(result.rejected[0].check).toBe('opportunity_unknown');
  });

  it('rejects an opportunity for a different skill', () => {
    const instance = opportunity({
      skillId: 'skill-propose-alternative',
    });
    const result = validateSkillEvidenceProposal(
      proposal([candidate({ opportunityInstanceId: instance.id })]),
      context({ opportunityInstances: [instance] })
    );

    expect(result.validated).toHaveLength(0);
    expect(result.rejected[0].check).toBe('opportunity_skill_mismatch');
  });

  it('rejects a quote that is not in the cited passage', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate({ quote: 'completely different words here' })]),
      context()
    );

    expect(result.rejected[0].check).toBe('quote_not_in_passage');
  });

  it('rejects a stale transcript revision', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate({ sourceRevision: 'rev-old' })]),
      context()
    );

    expect(result.rejected[0].check).toBe('revision_mismatch');
  });

  it('rejects a citation to the assistant rather than the learner', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate({ sourcePassageId: 'p-2' })]),
      context({
        passages: [passage(), passage({ id: 'p-2', speaker: 'assistant' })],
      })
    );

    expect(result.rejected[0].check).toBe('passage_not_learner');
  });

  it('rejects a citation to a passage that does not exist', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate({ sourcePassageId: 'p-missing' })]),
      context()
    );

    expect(result.rejected[0].check).toBe('passage_missing');
  });

  // The ledger overrides the model.
  it('downgrades a claimed unaided turn when support was on screen', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate({ supportExposureIds: ['exp-1'] })]),
      context({ supportExposures: [exposure()] })
    );

    expect(result.validated).toHaveLength(1);
    expect(result.validated[0].retrieval).toBe('assisted');
    expect(result.rejected.map(r => r.check)).toContain('support_contradicts_retrieval');
  });

  it('does not downgrade production for meaning help on the character turn', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate()]),
      context({
        supportExposures: [
          exposure({
            kind: 'meaning_of_assistant_turn',
            targetSkillId: undefined,
            targetOpportunityId: undefined,
            targetPhraseId: undefined,
            targetItemIds: [],
          }),
        ],
      })
    );

    expect(result.validated[0].retrieval).toBe('unassisted');
    expect(result.rejected.map(r => r.check)).not.toContain('support_contradicts_retrieval');
  });

  it('does not downgrade a skill for full-form help scoped to another skill', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate()]),
      context({
        supportExposures: [
          exposure({
            targetSkillId: 'skill-wayfinding-transit',
            targetOpportunityId: undefined,
            targetPhraseId: undefined,
            targetItemIds: [],
          }),
        ],
      })
    );

    expect(result.validated[0].retrieval).toBe('unassisted');
  });

  it('does not treat an intent hint as production-form assistance', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate()]),
      context({ supportExposures: [exposure({ kind: 'intent_hint' })] })
    );

    expect(result.validated[0].retrieval).toBe('unassisted');
  });

  it('rejects a citation to support that is not in the ledger', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate({ supportExposureIds: ['exp-invented'] })]),
      context({ supportExposures: [exposure()] })
    );

    expect(result.rejected[0].check).toBe('support_reference_unknown');
  });

  it('refuses to count a rehearsal as independent', () => {
    const result = validateSkillEvidenceProposal(proposal([candidate()]), context({
      isRehearsalAttempt: true,
    }));

    expect(result.rejected[0].check).toBe('rehearsal_not_independent');
  });

  it('keeps a grounded skill demonstration even when the scene task failed', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate()], 'not_achieved'),
      context()
    );

    expect(result.rejected).toEqual([]);
    expect(result.validated).toHaveLength(1);
    expect(result.validated[0].taskOutcome).toBe('not_achieved');
    expect(result.validated[0].demonstration).toBe('demonstrated');
  });

  it('does not treat spoken typing as spoken production', () => {
    const result = validateSkillEvidenceProposal(
      proposal([candidate({ modality: 'typed' })]),
      context()
    );

    expect(result.validated[0].retrieval).toBe('unknown');
    expect(isIndependentSuccess(result.validated[0])).toBe(false);
  });

  it('stamps the domain and scene so a context is identifiable', () => {
    const result = validateSkillEvidenceProposal(proposal([candidate()]), context());

    expect(result.validated[0].domainId).toBe('cafes');
    expect(result.validated[0].scenarioId).toBe('scene.es.cafe.breakfast');
  });

  // The model proposes context identifiers nowhere in the candidate shape, so
  // there is no field for it to lie in.
  it('takes context identifiers from runtime state, not the proposal', () => {
    const result = validateSkillEvidenceProposal(proposal([candidate()]), context({
      mission: mission({ id: 'mission-fr-bistro', category: 'cafes' }),
    }));

    expect(result.validated[0].sessionId).toBe('s-1');
    expect(result.validated[0].attemptId).toBe('attempt-1');
    expect(result.validated[0].scenarioId).toBe('scene.es.cafe.breakfast');
  });
});

describe('deriveLapses', () => {
  const proposalWithoutFailureClaim = () => proposal([], 'not_achieved');

  it('records a lapse only from a validated taken cold opportunity that was attempted but not demonstrated', () => {
    const result = validateSkillEvidenceProposal(
      proposalWithoutFailureClaim(),
      context({ opportunityInstances: [opportunity()] })
    );

    expect(result.lapses).toHaveLength(1);
    expect(result.lapses[0]).toMatchObject({
      basis: 'cold_attempt_failed',
      skillId: SKILL,
      opportunityInstanceId: 'opp-1',
      demonstration: 'attempted_not_demonstrated',
    });
  });

  it('scene failure alone creates no lapse', () => {
    const result = validateSkillEvidenceProposal(
      proposal([], 'not_achieved'),
      context({ opportunityInstances: [] })
    );

    expect(result.lapses).toEqual([]);
  });

  it('scene success does not erase a real failed skill opportunity', () => {
    const result = validateSkillEvidenceProposal(
      proposal([], 'achieved'),
      context({ opportunityInstances: [opportunity()] })
    );

    expect(result.lapses).toHaveLength(1);
  });

  it('records no lapse when the opportunity was not presented', () => {
    const result = validateSkillEvidenceProposal(
      proposal([], 'not_achieved'),
      context({
        opportunityInstances: [
          opportunity({
            status: 'not_presented',
            demonstration: 'unknown',
            learnerAttemptPassageId: undefined,
          }),
        ],
      })
    );

    expect(result.lapses).toEqual([]);
  });

  it('records no lapse from a provisional semantic detection', () => {
    const result = validateSkillEvidenceProposal(
      proposal([], 'not_achieved'),
      context({ opportunityInstances: [opportunity({ detection: 'provisional' })] })
    );

    expect(result.lapses).toEqual([]);
  });

  it('records no lapse when the learner actually demonstrated the skill', () => {
    const result = validateSkillEvidenceProposal(
      proposal([], 'not_achieved'),
      context({
        opportunityInstances: [opportunity({ demonstration: 'demonstrated' })],
      })
    );

    expect(result.lapses).toEqual([]);
  });

  it('records no lapse when support was relevant to the failed attempt', () => {
    const result = validateSkillEvidenceProposal(
      proposal([], 'not_achieved'),
      context({
        opportunityInstances: [opportunity()],
        supportExposures: [exposure()],
      })
    );

    expect(result.lapses).toEqual([]);
  });

  it('keeps lapse eligibility when support targeted an unrelated skill', () => {
    const result = validateSkillEvidenceProposal(
      proposal([], 'not_achieved'),
      context({
        opportunityInstances: [opportunity()],
        supportExposures: [
          exposure({
            targetSkillId: 'skill-wayfinding-transit',
            targetOpportunityId: undefined,
            targetPhraseId: undefined,
            targetItemIds: [],
          }),
        ],
      })
    );

    expect(result.lapses).toHaveLength(1);
  });

  it('records no lapse when the learner stayed silent', () => {
    const result = validateSkillEvidenceProposal(
      proposal([], 'not_achieved'),
      context({
        passages: [passage({ speaker: 'assistant' })],
        opportunityInstances: [opportunity()],
      })
    );

    expect(result.lapses).toEqual([]);
  });

  it('records no lapse during a rehearsal', () => {
    const result = validateSkillEvidenceProposal(
      proposal([], 'not_achieved'),
      context({
        opportunityInstances: [opportunity()],
        isRehearsalAttempt: true,
      })
    );

    expect(result.lapses).toEqual([]);
  });

  it('records no lapse for technical or recognition failure', () => {
    for (const failureReason of [
      'noise',
      'disconnect',
      'provider_failure',
      'asr_failure',
      'language_mismatch',
    ] as const) {
      const result = validateSkillEvidenceProposal(
        proposal([], 'not_achieved'),
        context({
          opportunityInstances: [opportunity({ failureReason })],
        })
      );

      expect(result.lapses, failureReason).toEqual([]);
    }
  });

  it('records no lapse when the session ended for a non-learning reason', () => {
    for (const sessionEndReason of ['user_ended', 'time_limit', 'error'] as const) {
      const result = validateSkillEvidenceProposal(
        proposal([], 'not_achieved'),
        context({
          opportunityInstances: [opportunity()],
          sessionEndReason,
        })
      );

      expect(result.lapses, sessionEndReason).toEqual([]);
    }
  });

  it('points the lapse at the validated learner passage revision', () => {
    const result = validateSkillEvidenceProposal(
      proposal([], 'unknown'),
      context({
        passages: [passage({ revisionKey: 'rev-7' })],
        opportunityInstances: [
          opportunity({ learnerAttemptRevision: 'rev-7' }),
        ],
      })
    );

    expect(result.lapses[0].sourceRevision).toBe('rev-7');
    expect(result.lapses[0].sourcePassageId).toBe('p-1');
  });

  it('rejects a stale opportunity passage revision as lapse evidence', () => {
    const result = validateSkillEvidenceProposal(
      proposal([], 'not_achieved'),
      context({
        passages: [passage({ revisionKey: 'rev-7' })],
        opportunityInstances: [
          opportunity({ learnerAttemptRevision: 'rev-old' }),
        ],
      })
    );

    expect(result.lapses).toEqual([]);
  });

  it('only lapses mission primary skills', () => {
    const result = validateSkillEvidenceProposal(
      proposal([], 'not_achieved'),
      context({
        opportunityInstances: [
          opportunity({
            skillId: 'skill-communicative-repair',
            opportunityId: 'repair-opportunity',
          }),
        ],
      })
    );

    expect(result.lapses).toEqual([]);
  });

  it('never lets a failed opportunity become positive evidence', () => {
    const result = validateSkillEvidenceProposal(
      proposal([], 'not_achieved'),
      context({ opportunityInstances: [opportunity()] })
    );

    expect(result.validated).toHaveLength(0);
    expect(result.lapses).toHaveLength(1);
  });
});

describe('quoteAppearsIn', () => {
  const text = 'Bonjour, je voudrais un café con leche y la leche de avena por favor?';

  it('accepts an exact substring', () => {
    expect(quoteAppearsIn('la leche de avena', text)).toBe(true);
  });

  it('accepts a quote that differs only in punctuation', () => {
    expect(quoteAppearsIn('¿la leche de avena?', text)).toBe(true);
  });

  it('rejects an empty quote', () => {
    expect(quoteAppearsIn('', text)).toBe(false);
    expect(quoteAppearsIn('   ', text)).toBe(false);
  });

  it('rejects words that are simply absent', () => {
    expect(quoteAppearsIn('quisiera un単なる Polynomial', text)).toBe(false);
  });
});

describe('deriveRetrieval', () => {
  it('keeps a genuine unaided spoken attempt unaided', () => {
    expect(deriveRetrieval({ proposed: 'unassisted', hadSupport: false, modality: 'spoken' }))
      .toBe('unassisted');
  });

  it('forces assisted when support was shown', () => {
    expect(deriveRetrieval({ proposed: 'unassisted', hadSupport: true, modality: 'spoken' }))
      .toBe('assisted');
  });

  it('holds typing at unknown rather than calling it assisted', () => {
    expect(deriveRetrieval({ proposed: 'unassisted', hadSupport: false, modality: 'typed' }))
      .toBe('unknown');
  });
});

describe('the model offer and the validator agree', () => {
  // The prompt is not a boundary, so the list the model is shown and the list the
  // validator enforces have to come from one place.
  it('offers exactly the skills the validator would accept', () => {
    for (const m of MISSIONS) {
      const offered = allowedSkillsForMission(m.id).map(s => s.id);
      const enforced = new Set([...m.primarySkillIds, ...m.secondarySkillIds]);

      expect(new Set(offered)).toEqual(enforced);
    }
  });

  it('offers nothing for an unknown mission rather than the whole catalog', () => {
    expect(allowedSkillsForMission('mission-does-not-exist')).toEqual([]);
    expect(allowedSkillsForMission(undefined)).toEqual([]);
  });

  it('offers nothing to a mission that was authored before membership existed', () => {
    expect(allowedSkillsForMission(undefined)).not.toHaveLength(
      COMMUNICATIVE_SKILLS_CATALOG.length
    );
  });

  it('does not repeat a skill listed as both primary and secondary', () => {
    for (const m of MISSIONS) {
      expect(allowedSkillIds(m)).toHaveLength(
        new Set([...m.primarySkillIds, ...m.secondarySkillIds]).size
      );
    }
  });

  it('would reject any skill it did not offer', () => {
    const m = MISSIONS[0];
    const offered = new Set(allowedSkillsForMission(m.id).map(s => s.id));
    const notOffered = COMMUNICATIVE_SKILLS_CATALOG
      .map(s => s.id)
      .filter(id => !offered.has(id));

    for (const id of notOffered) {
      const result = validateSkillEvidenceProposal(proposal([candidate({ skillId: id })]), context({
        mission: m,
      }));
      expect(result.validated).toHaveLength(0);
      expect(result.rejected[0].check).toBe('not_in_mission');
    }
  });
});

describe('mission skill membership is curated', () => {
  it('every mission declares a non-empty scenario family', () => {
    const missing = MISSIONS.filter(m => !m.scenarioFamilyId.trim());
    expect(missing.map(m => m.id)).toEqual([]);
  });

  it('every mission declares at least one primary skill', () => {
    const bare = MISSIONS.filter(m => m.primarySkillIds.length === 0);
    expect(bare.map(m => m.id)).toEqual([]);
  });

  it('every declared skill exists in the catalog', () => {
    const known = new Set(COMMUNICATIVE_SKILLS_CATALOG.map(s => s.id));
    const unknown: string[] = [];

    for (const m of MISSIONS) {
      for (const id of [...m.primarySkillIds, ...m.secondarySkillIds]) {
        if (!known.has(id)) unknown.push(`${m.id} -> ${id}`);
      }
    }

    expect(unknown).toEqual([]);
  });

  it('does not list the same skill as both primary and secondary', () => {
    const overlaps = MISSIONS.filter(m =>
      m.primarySkillIds.some(id => m.secondarySkillIds.includes(id))
    );
    expect(overlaps.map(m => m.id)).toEqual([]);
  });

  it('has no duplicate ids within a list', () => {
    for (const m of MISSIONS) {
      expect(new Set(m.primarySkillIds).size, m.id).toBe(m.primarySkillIds.length);
      expect(new Set(m.secondarySkillIds).size, m.id).toBe(m.secondarySkillIds.length);
    }
  });

  it('covers every catalogued skill somewhere', () => {
    const used = new Set(MISSIONS.flatMap(m => [...m.primarySkillIds, ...m.secondarySkillIds]));
    const orphans = COMMUNICATIVE_SKILLS_CATALOG.map(s => s.id).filter(id => !used.has(id));
    expect(orphans).toEqual([]);
  });
});

describe('projectSkill', () => {
  const day = 86_400_000;
  const now = Date.parse('2026-10-01T12:00:00.000Z');

  function skillObservation(overrides: Partial<SkillObservation> = {}): SkillObservation {
    const base: SkillObservation = {
      id: 'so-1',
      skillId: SKILL,
      sessionId: 's-1',
      attemptId: 'attempt-1',
      sourcePassageId: 'p-1',
      sourceRevision: 'rev-1',
      contextKey: {
        domainId: 'cafes',
        scenarioFamilyId: 'family-1',
      },
      modality: 'spoken',
      retrieval: 'unassisted',
      taskOutcome: 'achieved',
      demonstration: 'demonstrated',
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

  it('is new with no evidence', () => {
    expect(projectSkill(SKILL, [], [], now).status).toBe('new');
  });

  it('is supported by assisted use alone', () => {
    const projection = projectSkill(SKILL, [skillObservation({ retrieval: 'assisted' })], [], now);
    expect(projection.status).toBe('supported');
  });

  it('stays supported with one independent context', () => {
    const projection = projectSkill(SKILL, [skillObservation()], [], now);
    expect(projection.status).toBe('supported');
  });

  // Two contexts on one day is one session with two chances in it.
  it('does not reach growing from two contexts on a single day', () => {
    const observations = [
      skillObservation({ id: 'a', sessionId: 's-1', contextKey: { domainId: 'test', scenarioFamilyId: 'family-1' }, recordedAt: '2026-09-20T09:00:00.000Z' }),
      skillObservation({ id: 'b', sessionId: 's-2', contextKey: { domainId: 'test', scenarioFamilyId: 'family-2' }, recordedAt: '2026-09-20T15:00:00.000Z' }),
    ];

    const projection = projectSkill(SKILL, observations, [], now);
    expect(projection.independentContexts).toHaveLength(2);
    expect(projection.independentDays).toHaveLength(1);
    expect(projection.status).toBe('supported');
  });

  it('reaches growing at 2 contexts across 2 days', () => {
    const observations = [
      skillObservation({ id: 'a', sessionId: 's-1', contextKey: { domainId: 'test', scenarioFamilyId: 'family-1' }, recordedAt: '2026-09-20T09:00:00.000Z' }),
      skillObservation({ id: 'b', sessionId: 's-2', contextKey: { domainId: 'test', scenarioFamilyId: 'family-2' }, recordedAt: '2026-09-21T09:00:00.000Z' }),
    ];

    expect(projectSkill(SKILL, observations, [], now).status).toBe('growing');
  });

  it('does not reach steady at 4 contexts but only 2 days', () => {
    const observations = [
      skillObservation({ id: 'a', sessionId: 's-1', contextKey: { domainId: 'test', scenarioFamilyId: 'family-1' }, recordedAt: '2026-09-20T09:00:00.000Z' }),
      skillObservation({ id: 'b', sessionId: 's-2', contextKey: { domainId: 'test', scenarioFamilyId: 'family-2' }, recordedAt: '2026-09-20T15:00:00.000Z' }),
      skillObservation({ id: 'c', sessionId: 's-3', contextKey: { domainId: 'test', scenarioFamilyId: 'family-3' }, recordedAt: '2026-09-21T09:00:00.000Z' }),
      skillObservation({ id: 'd', sessionId: 's-4', contextKey: { domainId: 'test', scenarioFamilyId: 'family-4' }, recordedAt: '2026-09-21T15:00:00.000Z' }),
    ];

    const projection = projectSkill(SKILL, observations, [], now);
    expect(projection.independentContexts.length).toBeGreaterThanOrEqual(
      SKILL_POLICY.steadyMinContexts
    );
    expect(projection.independentDays.length).toBeLessThan(SKILL_POLICY.steadyMinDays);
    expect(projection.status).toBe('growing');
  });

  it('reaches steady at 4 contexts across 3 days with validated evidence', () => {
    const observations = [
      skillObservation({ id: 'a', sessionId: 's-1', contextKey: { domainId: 'test', scenarioFamilyId: 'family-1' }, recordedAt: '2026-09-20T09:00:00.000Z' }),
      skillObservation({ id: 'b', sessionId: 's-2', contextKey: { domainId: 'test', scenarioFamilyId: 'family-2' }, recordedAt: '2026-09-21T09:00:00.000Z' }),
      skillObservation({ id: 'c', sessionId: 's-3', contextKey: { domainId: 'test', scenarioFamilyId: 'family-3' }, recordedAt: '2026-09-22T09:00:00.000Z' }),
      skillObservation({ id: 'd', sessionId: 's-4', contextKey: { domainId: 'test', scenarioFamilyId: 'family-4' }, recordedAt: '2026-09-22T15:00:00.000Z' }),
    ];

    expect(projectSkill(SKILL, observations, [], now).status).toBe('steady');
  });

  // Substring inference must not be able to manufacture a capability.
  it('never reaches steady on legacy inference alone, however much of it there is', () => {
    const observations = Array.from({ length: 12 }, (_, i) =>
      skillObservation({
        id: `legacy-${i}`,
        sessionId: `s-${i}`,
        contextKey: { domainId: 'legacy', scenarioFamilyId: 'legacy-unknown' },
        recordedAt: new Date(Date.parse('2026-09-01T09:00:00.000Z') + i * day).toISOString(),
        evidenceSource: 'legacy_inferred',
      })
    );

    const projection = projectSkill(SKILL, observations, [], now);
    expect(projection.independentContexts).toEqual(['legacy::legacy-unknown']);
    expect(projection.independentDays.length).toBeGreaterThanOrEqual(SKILL_POLICY.steadyMinDays);
    expect(projection.status).not.toBe('steady');
  });

  it('keeps legacy evidence visible rather than discarding it', () => {
    const observations = [
      skillObservation({ id: 'legacy', evidenceSource: 'legacy_inferred' }),
    ];

    const projection = projectSkill(SKILL, observations, [], now);
    expect(projection.legacyInferredCount).toBe(1);
    expect(projection.validatedCount).toBe(0);
  });

  // A mistake should schedule review, not rewrite history.
  function lapse(overrides: Partial<SkillLapse> = {}): SkillLapse {
    return {
      id: 'lapse-1',
      skillId: SKILL,
      sessionId: 's-5',
      attemptId: 'attempt-1',
      sourcePassageId: 'p-9',
      sourceRevision: 'rev-1',
      contextKey: {
        domainId: 'test',
        scenarioFamilyId: 'family-lapse',
      },
      opportunityInstanceId: 'opp-lapse-1',
      demonstration: 'attempted_not_demonstrated',
      basis: 'cold_attempt_failed',
      recordedAt: new Date(now - day).toISOString(),
      ...overrides,
    };
  }

  const steadyHistory = () => [
    skillObservation({ id: 'a', sessionId: 's-1', contextKey: { domainId: 'test', scenarioFamilyId: 'family-1' }, recordedAt: '2026-09-20T09:00:00.000Z' }),
    skillObservation({ id: 'b', sessionId: 's-2', contextKey: { domainId: 'test', scenarioFamilyId: 'family-2' }, recordedAt: '2026-09-21T09:00:00.000Z' }),
    skillObservation({ id: 'c', sessionId: 's-3', contextKey: { domainId: 'test', scenarioFamilyId: 'family-3' }, recordedAt: '2026-09-22T09:00:00.000Z' }),
    skillObservation({ id: 'd', sessionId: 's-4', contextKey: { domainId: 'test', scenarioFamilyId: 'family-4' }, recordedAt: '2026-09-22T15:00:00.000Z' }),
  ];

  it('keeps a steady skill steady when a lapse follows', () => {
    expect(projectSkill(SKILL, steadyHistory(), [], now).status).toBe('steady');

    const projection = projectSkill(SKILL, steadyHistory(), [lapse()], now);
    expect(projection.status).toBe('steady');
    expect(projection.reviewDue).toBe(true);
  });

  it('does not flag review for a lapse outside the window', () => {
    const old = lapse({
      recordedAt: new Date(now - (SKILL_POLICY.lapseReviewWindowDays + 5) * day).toISOString(),
    });

    expect(projectSkill(SKILL, steadyHistory(), [old], now).reviewDue).toBe(false);
  });

  it('flags review only for the lapsed skill', () => {
    const other = lapse({ skillId: 'skill-wayfinding-transit' });

    expect(projectSkill(SKILL, steadyHistory(), [other], now).reviewDue).toBe(false);
  });

  it('does not let a lapse promote an unsupported skill', () => {
    const projection = projectSkill(SKILL, [], [lapse()], now);

    expect(projection.status).toBe('new');
    expect(projection.reviewDue).toBe(true);
  });

  it('explains itself in words', () => {
    expect(projectSkill(SKILL, [], [], now).explanation).toMatch(/No evidence/i);
  });

  it('projects every catalogued skill', () => {
    expect(projectSkillsV2([], [])).toHaveLength(COMMUNICATIVE_SKILLS_CATALOG.length);
  });
});

describe('inferLegacySkillEvidence', () => {
  function observation(overrides: Partial<LearningObservation> = {}): LearningObservation {
    return {
      observationId: 'obs-1',
      sessionId: 's-1',
      attemptId: 'attempt-1',
      sourceTurnId: 'p-1',
      sourceRevision: 'rev-1',
      itemId: 'phrase.es.1',
      candidateForm: '¿Tiene leche de avena?',
      meaning: 'Do you have oat milk?',
      quote: '¿Tiene leche de avena?',
      modality: 'spoken',
      retrieval: 'unassisted',
      taskOutcome: 'achieved',
      rehearsal: false,
      supportExposureIds: [],
      recordedAt: '2026-09-20T09:00:00.000Z',
      ...overrides,
    };
  }

  it('marks everything it produces as legacy inferred', () => {
    const inferred = inferLegacySkillEvidence([observation()]);
    expect(inferred.length).toBeGreaterThan(0);
    expect(inferred.every(o => o.evidenceSource === 'legacy_inferred')).toBe(true);
  });

  it('produces nothing for an unrelated utterance', () => {
    expect(inferLegacySkillEvidence([observation({ quote: '¿A qué hora sale el tren?' })])).toEqual([]);
  });

  it('produces nothing for an empty quote', () => {
    expect(inferLegacySkillEvidence([observation({ quote: '', candidateForm: '' })])).toEqual([]);
  });

  it('keeps the original quote as provenance', () => {
    const inferred = inferLegacySkillEvidence([observation()]);
    expect(inferred[0].quote).toBe('¿Tiene leche de avena?');
  });
});