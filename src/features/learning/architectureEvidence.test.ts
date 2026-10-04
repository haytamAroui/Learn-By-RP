import { describe, expect, it } from 'vitest';
import { MISSION_CATALOG } from '../../data/missions';
import type { Passage } from '../../types';
import {
  buildLocalObservations,
  validateAssessmentProposal,
  validateDrillReview,
  type StructuredAssessmentProposal,
} from './learningCore';

const mission = MISSION_CATALOG.find(item => item.id === 'mission-nl-be-koffiebar')!;
const phrase = mission.usefulPhrases[0];
const context = { sessionId: 'architecture-session', attemptId: 'attempt-1', candidates: mission.usefulPhrases };

function passage(overrides: Partial<Passage> = {}): Passage {
  return {
    id: 'learner-turn', sessionId: context.sessionId, attemptId: context.attemptId,
    speaker: 'user', revisionKey: 'rev-1', assemblyVersion: 1, status: 'final',
    text: phrase.form, modality: 'spoken', startedAt: '2026-10-03T10:00:00Z', fragments: [],
    ...overrides,
  };
}

function proposal(item: Partial<StructuredAssessmentProposal['items'][number]> = {}): StructuredAssessmentProposal {
  return {
    schemaVersion: 2, sessionId: context.sessionId, attemptId: context.attemptId, taskOutcome: 'unknown',
    items: [{ itemId: phrase.id, candidateForm: phrase.form, meaning: phrase.meaning,
      quote: phrase.form, sourcePassageId: 'learner-turn', sourceRevision: 'rev-1',
      modality: 'spoken', retrievalProposal: 'unknown', ...item }],
  };
}

describe('V2 architecture: runtime authority over phrase proposals', () => {
  it('cannot credit a known target by replacing its form with unrelated learner text', () => {
    const result = validateAssessmentProposal(proposal({candidateForm:'hola',quote:'hola'}), [passage({text:'hola'})], [], context);
    expect(result.evidence.observations).toHaveLength(0);
  });

  it('derives typed provenance from the passage even when the assessor claims speech', () => {
    const result = validateAssessmentProposal(proposal(), [passage({modality:'typed'})], [], context);
    expect(result.evidence.observations).toHaveLength(1);
    expect(result.evidence.observations[0]).toMatchObject({modality:'typed',retrieval:'unknown'});
  });

  it('does not accept a phrase outside the runtime-authored candidates', () => {
    const result = validateAssessmentProposal(proposal({itemId:'invented-target'}), [passage()], [], context);
    expect(result.evidence.observations).toHaveLength(0);
  });

  it('stores authored target wording and meaning instead of model replacements', () => {
    const result = validateAssessmentProposal(proposal({candidateForm:'model replacement',meaning:'model translation'}), [passage()], [], context);
    expect(result.evidence.observations[0]).toMatchObject({candidateForm:phrase.form,meaning:phrase.meaning});
  });

  it.each([
    {status:'partial' as const}, {sessionId:'another-session'}, {attemptId:'another-attempt'},
  ])('does not use an ineligible passage: %j', override => {
    const result = validateAssessmentProposal(proposal(), [passage(override)], [], context);
    expect(result.evidence.observations).toHaveLength(0);
  });

  it('requires a cited learner passage rather than matching across the whole transcript', () => {
    const result = validateAssessmentProposal(proposal({sourcePassageId:''}), [passage()], [], context);
    expect(result.evidence.observations).toHaveLength(0);
  });

  it('rejects a proposal that relocates the evidence to another attempt', () => {
    const result = validateAssessmentProposal({...proposal(),attemptId:'invented-attempt'}, [passage()], [], context);
    expect(result.evidence.observations).toHaveLength(0);
  });

  it('fails closed when a legacy JavaScript caller omits authored assessment context', () => {
    const result = Reflect.apply(validateAssessmentProposal, undefined, [proposal(), [passage()], []]);
    expect(result.evidence.observations).toHaveLength(0);
  });

  it('does not treat word overlap as proof of a quote that never occurred', () => {
    const result = validateAssessmentProposal(proposal({quote:`${phrase.form} invented continuation`}), [passage()], [], context);
    expect(result.evidence.observations).toHaveLength(0);
  });

  it('does not accept an ambiguous lexical match from a hosted assessor', () => {
    const ambiguousContext={...context,candidates:[{id:'milk-target',form:'leche de avena',meaning:'oat milk'}]};
    const result=validateAssessmentProposal(proposal({itemId:'milk-target',candidateForm:'leche de avena',quote:'quiero leche'}),[passage({text:'quiero leche'})],[],ambiguousContext);
    expect(result.evidence.observations).toHaveLength(0);
  });

  it('keeps the local fallback scoped to final learner turns from the current attempt', () => {
    const result=buildLocalObservations({...context,passages:[passage({status:'partial'}),passage({sessionId:'another-session'}),passage({attemptId:'another-attempt'})],supportExposures:[],isColdAttempt:true,isRehearsalAttempt:false});
    expect(result.evidence.observations).toHaveLength(0);
  });
});

describe('V2 architecture: actual production in phrase practice', () => {
  it('does not convert an unrelated answer plus self-report into verified recall', () => {
    const evidence=validateDrillReview({phrase,quote:'banana',modality:'spoken',selfReportedResult:'remembered',learnerAttemptCaptured:true,answerRevealedBeforeAttempt:false,modelAudioPlayedBeforeAttempt:false});
    expect(evidence.observations).toHaveLength(0);
  });
});
