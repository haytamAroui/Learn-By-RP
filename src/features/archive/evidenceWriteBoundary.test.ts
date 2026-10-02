import { describe, expect, it } from 'vitest';
import type {
  ArchiveRepository,
  PersistableSessionRecord,
} from './ArchiveRepository.types';
import { archiveRepository as sqliteArchiveRepository } from './SqliteArchiveRepository';
import { IndexedDbArchiveRepository } from './IndexedDbArchiveRepository';
import type {
  LearningObservation,
  SkillObservation,
} from '../../types';
import type { validateAssessmentProposal } from '../learning/learningCore';
import type { validateSkillEvidenceProposal } from '../learning/skillEvidence';

type HasDirectSkillWriter =
  'saveSkillObservations' extends keyof ArchiveRepository ? true : false;

const hasDirectSkillWriter: HasDirectSkillWriter = false;

type PhraseWrite = PersistableSessionRecord['observations'][number];
type SkillWrite = NonNullable<
  PersistableSessionRecord['skillObservations']
>[number];

type PhraseValidatorOutput =
  ReturnType<typeof validateAssessmentProposal>['validatedObservations'][number];
type SkillValidatorOutput =
  ReturnType<typeof validateSkillEvidenceProposal>['validated'][number];

// These assignments are compile-time proofs that validator outputs carry the
// capability required by the archive write model.
const phraseValidatorOutputIsPersistable: PhraseWrite =
  null as unknown as PhraseValidatorOutput;
const skillValidatorOutputIsPersistable: SkillWrite =
  null as unknown as SkillValidatorOutput;

const rawPhrase = null as unknown as LearningObservation;
// @ts-expect-error Raw phrase evidence has not crossed the validator boundary.
const rawPhraseMustNotPersist: PhraseWrite = rawPhrase;

const rawSkill = null as unknown as SkillObservation;
// @ts-expect-error Raw skill evidence has not crossed the validator boundary.
const rawSkillMustNotPersist: SkillWrite = rawSkill;

describe('evidence write boundary', () => {
  it('does not expose the removed direct skill writer', () => {
    expect(hasDirectSkillWriter).toBe(false);
    expect('saveSkillObservations' in sqliteArchiveRepository).toBe(false);
    expect('saveSkillObservations' in new IndexedDbArchiveRepository()).toBe(false);
  });

  it('keeps validator output assignable to the archive write capability', () => {
    // Runtime assertions keep the compile-time witnesses referenced so lint/build
    // cannot silently discard the contract as dead test code.
    expect(phraseValidatorOutputIsPersistable).toBeNull();
    expect(skillValidatorOutputIsPersistable).toBeNull();
    expect(rawPhraseMustNotPersist).toBeNull();
    expect(rawSkillMustNotPersist).toBeNull();
  });
});
