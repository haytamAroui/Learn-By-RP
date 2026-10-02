import { describe, expect, it } from 'vitest';
import { CAFE_SCENE } from '../../content/scenes';
import { OpportunityInstance } from '../../types';
import { applyResult, createInitialScene, reduceSceneAction } from './sceneReducer';
import { acceptSemanticCandidate, decideDirector, DirectorCadence } from './director';

const SESSION = 'director-session';
const ATTEMPT = 'attempt-1';

describe('deterministic director', () => {
  it('selects only the authored complication when its trigger is true', () => {
    const state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);
    const decision = decideDirector({
      scene: CAFE_SCENE,
      state,
      opportunities: [],
    });

    expect(decision).toEqual({
      kind: 'trigger_complication',
      complicationId: CAFE_SCENE.complication?.id,
      reason: 'authored_trigger_true',
    });
  });

  it('does not repeat a complication already fired', () => {
    const state = {
      ...createInitialScene(CAFE_SCENE, SESSION, ATTEMPT),
      firedComplications: [CAFE_SCENE.complication!.id],
    };

    expect(
      decideDirector({ scene: CAFE_SCENE, state, opportunities: [] }).kind
    ).toBe('none');
  });

  it('selects an authored opportunity after its scene condition becomes true', () => {
    let state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);
    state = {
      ...state,
      firedComplications: [CAFE_SCENE.complication!.id],
    };

    const result = reduceSceneAction({
      scene: CAFE_SCENE,
      state,
      proposal: {
        actionId: 'offer-1',
        sessionId: SESSION,
        attemptId: ATTEMPT,
        expectedSceneRevision: state.revision,
        action: 'offer_alternative',
        payload: { alternative: 'leche de almendra' },
        sourceTurnIds: ['assistant-1'],
      },
    });
    state = applyResult(CAFE_SCENE, state, result);

    const decision = decideDirector({
      scene: CAFE_SCENE,
      state,
      opportunities: [],
    });

    expect(decision).toMatchObject({
      kind: 'present_opportunity',
      opportunityId: 'opp.es.cafe.request-substitution.after-alternative',
      skillId: 'skill-request-substitution',
    });
  });

  it('selects an explicit repair challenge only when its capability and target skill are enabled', () => {
    let state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);
    state = {
      ...state,
      firedComplications: [CAFE_SCENE.complication!.id],
      facts: {
        ...state.facts,
        itemConfirmed: true,
      },
    };

    const decision = decideDirector({
      scene: CAFE_SCENE,
      state,
      opportunities: [],
      availableCommunicationChallenges: ['scripted_mishearing'],
      targetChallengeSkillId: 'skill-clarify-misunderstanding',
    });

    expect(decision).toMatchObject({
      kind: 'present_communication_challenge',
      challengeId: 'challenge.es.cafe.mishear-service-mode',
      challengeType: 'scripted_mishearing',
      opportunityId: 'opp.es.cafe.repair.clarify-misunderstanding',
      skillId: 'skill-clarify-misunderstanding',
      reason: 'authored_communication_challenge_available',
    });
  });

  it('does not emit a repair challenge when the provider did not negotiate that type', () => {
    let state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);
    state = {
      ...state,
      firedComplications: [CAFE_SCENE.complication!.id],
      facts: {
        ...state.facts,
        itemConfirmed: true,
      },
    };

    const decision = decideDirector({
      scene: CAFE_SCENE,
      state,
      opportunities: [],
      availableCommunicationChallenges: ['fast_speech'],
      targetChallengeSkillId: 'skill-clarify-misunderstanding',
    });

    expect(decision.kind).not.toBe('present_communication_challenge');
  });

  it('does not re-select an opportunity already materialised for this attempt', () => {
    let state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);
    state = {
      ...state,
      firedComplications: [CAFE_SCENE.complication!.id],
      facts: {
        ...state.facts,
        alternativeOffered: true,
      },
    };

    const existing: OpportunityInstance[] = [
      {
        id: 'opportunity:attempt-1:opp.es.cafe.request-substitution.after-alternative',
        attemptId: ATTEMPT,
        opportunityId: 'opp.es.cafe.request-substitution.after-alternative',
        skillId: 'skill-request-substitution',
        status: 'presented',
        detection: 'validated',
        demonstration: 'unknown',
        recordedAt: '2026-10-02T00:00:00.000Z',
      },
    ];

    const decision = decideDirector({
      scene: CAFE_SCENE,
      state,
      opportunities: existing,
    });

    expect(decision.kind).not.toBe('present_opportunity');
  });

  it('does not emit pressure without explicit learner opt-in policy', () => {
    const state = {
      ...createInitialScene(CAFE_SCENE, SESSION, ATTEMPT),
      firedComplications: [CAFE_SCENE.complication!.id],
      facts: {
        ...createInitialScene(CAFE_SCENE, SESSION, ATTEMPT).facts,
        itemConfirmed: true,
      },
    };

    const decision = decideDirector({
      scene: CAFE_SCENE,
      state,
      opportunities: CAFE_SCENE.opportunityDefinitions
        .filter(item => !item.communicationChallengeId)
        .map(item => ({
          id: `existing:${item.id}`,
          attemptId: ATTEMPT,
          opportunityId: item.id,
          skillId: item.skillId,
          status: 'presented' as const,
          detection: 'validated' as const,
          demonstration: 'unknown' as const,
          recordedAt: '2026-10-02T00:00:00.000Z',
        })),
    });

    expect(decision.kind).not.toBe('present_pressure_branch');
  });

  it('selects only an authored pressure branch allowed by the pressure policy', () => {
    const initial = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);
    const state = {
      ...initial,
      firedComplications: [CAFE_SCENE.complication!.id],
      facts: {
        ...initial.facts,
        itemConfirmed: true,
      },
    };
    const existing = CAFE_SCENE.opportunityDefinitions
      .filter(item => !item.communicationChallengeId)
      .map(item => ({
        id: `existing:${item.id}`,
        attemptId: ATTEMPT,
        opportunityId: item.id,
        skillId: item.skillId,
        status: 'presented' as const,
        detection: 'validated' as const,
        demonstration: 'unknown' as const,
        recordedAt: '2026-10-02T00:00:00.000Z',
      }));

    const decision = decideDirector({
      scene: CAFE_SCENE,
      state,
      opportunities: existing,
      pressurePolicy: {
        enabled: true,
        allowedLevels: ['manageable'],
      },
    });

    expect(decision).toMatchObject({
      kind: 'present_pressure_branch',
      pressureBranchId: 'pressure.es.cafe.concise-followup',
      variantKind: 'more_concise',
      pressureLevel: 'manageable',
      reason: 'authored_pressure_branch_available',
    });
  });

  it('does not let a recovery-like manageable policy select a stretch pressure branch', () => {
    const initial = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);
    const state = {
      ...initial,
      firedComplications: [CAFE_SCENE.complication!.id],
      facts: {
        ...initial.facts,
        alternativeOffered: true,
      },
    };
    const existing = CAFE_SCENE.opportunityDefinitions
      .filter(item => !item.communicationChallengeId)
      .map(item => ({
        id: `existing:${item.id}`,
        attemptId: ATTEMPT,
        opportunityId: item.id,
        skillId: item.skillId,
        status: 'presented' as const,
        detection: 'validated' as const,
        demonstration: 'unknown' as const,
        recordedAt: '2026-10-02T00:00:00.000Z',
      }));

    const decision = decideDirector({
      scene: CAFE_SCENE,
      state,
      opportunities: existing,
      pressurePolicy: {
        enabled: true,
        allowedLevels: ['manageable'],
        allowedVariantKinds: ['one_interruption'],
      },
    });

    expect(decision.kind).not.toBe('present_pressure_branch');
  });

  it('never turns a semantic unknown into an executable mutation', () => {
    expect(
      acceptSemanticCandidate({ intentId: 'something', unknown: true })
    ).toEqual({
      accepted: false,
      reason: 'unknown_or_non_executable',
    });
  });
});


describe('DirectorCadence', () => {
  it('ignores audio frames, interim ASR and streaming response deltas', () => {
    const cadence = new DirectorCadence();
    const state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);

    for (const event of [
      { type: 'audio_level' as const },
      { type: 'interim_transcript' as const },
      { type: 'response_text_delta' as const },
    ]) {
      expect(
        cadence.evaluate({
          event,
          scene: CAFE_SCENE,
          state,
          opportunities: [],
        })
      ).toBeNull();
    }

    // Ignored transport events do not consume the revision. A completed turn may
    // still run the deterministic Director once.
    expect(
      cadence.evaluate({
        event: { type: 'learner_turn_completed', turnId: 'p-1' },
        scene: CAFE_SCENE,
        state,
        opportunities: [],
      })
    ).toMatchObject({ kind: 'trigger_complication' });
  });

  it('evaluates at most once for the same attempt and authoritative revision', () => {
    const cadence = new DirectorCadence();
    const state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);

    expect(
      cadence.evaluate({
        event: { type: 'learner_turn_completed', turnId: 'p-1' },
        scene: CAFE_SCENE,
        state,
        opportunities: [],
      })
    ).not.toBeNull();

    expect(
      cadence.evaluate({
        event: { type: 'actor_turn_completed', turnId: 'p-2' },
        scene: CAFE_SCENE,
        state,
        opportunities: [],
      })
    ).toBeNull();
  });

  it('allows a new evaluation after an accepted action advances scene revision', () => {
    const cadence = new DirectorCadence();
    let state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);

    expect(
      cadence.evaluate({
        event: { type: 'learner_turn_completed', turnId: 'p-1' },
        scene: CAFE_SCENE,
        state,
        opportunities: [],
      })
    ).not.toBeNull();

    state = {
      ...state,
      revision: state.revision + 1,
      firedComplications: [CAFE_SCENE.complication!.id],
    };

    expect(
      cadence.evaluate({
        event: { type: 'scene_action_accepted', actionId: 'confirm-1' },
        scene: CAFE_SCENE,
        state,
        opportunities: [],
      })
    ).not.toBeNull();
  });

  it('dedupes an authored pressure branch across later revisions', () => {
    const cadence = new DirectorCadence();
    const initial = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);
    let state = {
      ...initial,
      firedComplications: [CAFE_SCENE.complication!.id],
      facts: {
        ...initial.facts,
        itemConfirmed: true,
      },
    };
    const existing = CAFE_SCENE.opportunityDefinitions
      .filter(item => !item.communicationChallengeId)
      .map(item => ({
        id: `existing:${item.id}`,
        attemptId: ATTEMPT,
        opportunityId: item.id,
        skillId: item.skillId,
        status: 'presented' as const,
        detection: 'validated' as const,
        demonstration: 'unknown' as const,
        recordedAt: '2026-10-02T00:00:00.000Z',
      }));

    expect(
      cadence.evaluate({
        event: { type: 'actor_turn_completed', turnId: 'p-pressure-1' },
        scene: CAFE_SCENE,
        state,
        opportunities: existing,
        pressurePolicy: {
          enabled: true,
          allowedLevels: ['manageable'],
        },
      })
    ).toMatchObject({
      kind: 'present_pressure_branch',
      pressureBranchId: 'pressure.es.cafe.concise-followup',
    });

    state = { ...state, revision: state.revision + 1 };

    expect(
      cadence.evaluate({
        event: { type: 'scene_action_accepted', actionId: 'advance-pressure' },
        scene: CAFE_SCENE,
        state,
        opportunities: existing,
        pressurePolicy: {
          enabled: true,
          allowedLevels: ['manageable'],
        },
      })
    ).toBeNull();
  });

  it('does not re-emit the same authored directive after a later revision', () => {
    const cadence = new DirectorCadence();
    let state = createInitialScene(CAFE_SCENE, SESSION, ATTEMPT);

    expect(
      cadence.evaluate({
        event: { type: 'actor_turn_completed', turnId: 'p-0' },
        scene: CAFE_SCENE,
        state,
        opportunities: [],
      })
    ).toMatchObject({ kind: 'trigger_complication' });

    state = {
      ...state,
      revision: state.revision + 1,
    };

    expect(
      cadence.evaluate({
        event: { type: 'scene_action_accepted', actionId: 'confirm-2' },
        scene: CAFE_SCENE,
        state,
        opportunities: [],
      })
    ).toBeNull();
  });
});
