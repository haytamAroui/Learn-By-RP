/**
 * Opportunity qualification gate (Phase 1H).
 *
 * The gate exists because an authored band and a reviewed band are different
 * things. These tests pin both halves, and pin the content itself: every released
 * opportunity must carry a rationale, because a band with no stated reason is not
 * reviewable by anyone, including its author.
 */

import { describe, expect, it } from 'vitest';
import {
  isOpportunityQualificationReviewed,
  opportunityQualificationStatus,
  qualifiedAssessedChannel,
  qualifiedEvidenceBand,
  authoredEligibleModalities,
  summarizeOpportunityQualification,
  OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
} from './opportunityQualification';
import { withReviewedOpportunityQualification } from './qualificationTestSupport';
import { SCENES } from '../../content/scenes';
import { communicativeSkillFor } from '../../content/skills';
import type { SceneDefinition, SkillOpportunityDefinition } from '../../contracts/scene';

function definition(
  overrides: Partial<SkillOpportunityDefinition> = {}
): SkillOpportunityDefinition {
  return {
    id: 'opp.test.1',
    skillId: 'skill-inquire-specifications',
    sceneCondition: { op: 'eq', fact: 'x', value: true },
    positiveExamples: [],
    negativeExamples: [],
    evidenceBand: 'a2',
    assessedChannel: 'interaction',
    eligibleModalities: ['typed', 'spoken'],
    qualification: {
      rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
      status: 'authored_pending_review',
      rationale: 'Test fixture.',
    },
    ...overrides,
  };
}

describe('qualification gate', () => {
  it('does not qualify an authored qualification nobody has accepted', () => {
    const authored = definition();
    expect(opportunityQualificationStatus(authored)).toBe('authored_pending_review');
    expect(isOpportunityQualificationReviewed(authored)).toBe(false);
    expect(qualifiedEvidenceBand(authored)).toBe('unknown');
    expect(qualifiedAssessedChannel(authored)).toBeUndefined();
  });

  it('qualifies once a named reviewer has accepted it', () => {
    const authored = definition();
    withReviewedOpportunityQualification(authored, () => {
      expect(isOpportunityQualificationReviewed(authored)).toBe(true);
      expect(qualifiedEvidenceBand(authored)).toBe('a2');
      expect(qualifiedAssessedChannel(authored)).toBe('interaction');
    });
    // Restored: the acceptance must not outlive the review it stood for.
    expect(qualifiedEvidenceBand(authored)).toBe('unknown');
  });

  it('refuses a reviewed status with no reviewer named', () => {
    const unattributed = definition({
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'reviewed',
        rationale: 'Test fixture.',
      },
    });
    expect(isOpportunityQualificationReviewed(unattributed)).toBe(false);
    expect(qualifiedEvidenceBand(unattributed)).toBe('unknown');
  });

  it('refuses a blank reviewer id', () => {
    const blank = definition({
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION,
        status: 'reviewed',
        rationale: 'Test fixture.',
        reviewerId: '   ',
      },
    });
    expect(isOpportunityQualificationReviewed(blank)).toBe(false);
  });

  it('refuses a band authored against a superseded rubric', () => {
    const stale = definition({
      qualification: {
        rubricVersion: OPPORTUNITY_QUALIFICATION_RUBRIC_VERSION - 1,
        status: 'reviewed',
        rationale: 'Test fixture.',
        reviewerId: 'reviewer-a',
      },
    });
    expect(isOpportunityQualificationReviewed(stale)).toBe(false);
    expect(qualifiedEvidenceBand(stale)).toBe('unknown');
  });

  it('treats a missing qualification as undecided rather than rejected', () => {
    const bare = definition({ qualification: undefined });
    expect(opportunityQualificationStatus(bare)).toBe('undecided');
    // Undecided is not a finding against the content: there is simply no review
    // record. The authored values are still held back, because nothing has
    // accepted them yet.
    expect(summarizeOpportunityQualification(bare)).toMatchObject({
      status: 'undecided',
      blocksQualification: true,
    });
  });

  it('reports nothing to block when no dimensions were authored at all', () => {
    const undecided = definition({
      evidenceBand: undefined,
      assessedChannel: undefined,
      eligibleModalities: undefined,
      qualification: undefined,
    });
    expect(summarizeOpportunityQualification(undecided).blocksQualification).toBe(false);
  });

  it('keeps modality eligibility outside the competence gate', () => {
    // Modality eligibility decides whether a passage can satisfy the opportunity
    // at all. Reading it as a competence claim is what would let an unreviewed
    // draft quietly narrow or widen what a learner may be assessed on.
    const authored = definition({ qualification: undefined });
    expect(authoredEligibleModalities(authored)).toEqual(['typed', 'spoken']);
  });

  it('reports a pending qualification as blocking', () => {
    expect(summarizeOpportunityQualification(definition())).toMatchObject({
      status: 'authored_pending_review',
      band: 'a2',
      channel: 'interaction',
      rationale: 'Test fixture.',
      reviewerId: null,
      blocksQualification: true,
    });
  });
});

describe('authored content qualifications', () => {
  const scenes = Object.values(SCENES) as SceneDefinition[];
  const opportunities = scenes.flatMap(scene =>
    scene.opportunityDefinitions.map(opportunity => ({ scene, opportunity }))
  );

  it('gives every authored opportunity a decision', () => {
    expect(opportunities.length).toBeGreaterThan(0);
    const undecided = opportunities.filter(
      ({ opportunity }) => opportunity.evidenceBand === undefined
    );
    expect(undecided.map(({ opportunity }) => opportunity.id)).toEqual([]);
  });

  it('states a reason for every band', () => {
    // A band with no rationale cannot be reviewed by a second person, which
    // would make the review gate unreachable rather than merely open.
    const missing = opportunities
      .filter(({ opportunity }) => !(opportunity.qualification?.rationale ?? '').trim())
      .map(({ opportunity }) => opportunity.id);
    expect(missing).toEqual([]);
  });

  it('claims no band at pre-a1, which the content has not established', () => {
    const claimed = opportunities
      .filter(({ opportunity }) => opportunity.evidenceBand === 'pre-a1')
      .map(({ opportunity }) => opportunity.id);
    expect(claimed).toEqual([]);
  });

  it('never asserts unknown as an authored band', () => {
    const claimed = opportunities
      .filter(({ opportunity }) => opportunity.evidenceBand === 'unknown')
      .map(({ opportunity }) => opportunity.id);
    expect(claimed).toEqual([]);
  });

  it('agrees with the canonical channel for the skill it assesses', () => {
    const mismatched = opportunities
      .filter(({ opportunity }) => {
        const skill = communicativeSkillFor(opportunity.skillId);
        return skill ? skill.modality !== opportunity.assessedChannel : false;
      })
      .map(({ opportunity }) => opportunity.id);
    expect(mismatched).toEqual([]);
  });

  it('leaves nothing marked reviewed while no human review exists', () => {
    const reviewed = opportunities
      .filter(({ opportunity }) => isOpportunityQualificationReviewed(opportunity))
      .map(({ opportunity }) => opportunity.id);
    expect(reviewed).toEqual([]);
  });

  it('offers at least one mission whose opportunities span more than one band', () => {
    // "A mission can contain opportunities at different authored bands" is an
    // acceptance item, and a flat catalogue could never satisfy it.
    const mixed = scenes
      .map(scene => ({
        sceneId: scene.id,
        bands: new Set(
          scene.opportunityDefinitions.map(opportunity => opportunity.evidenceBand)
        ),
      }))
      .filter(({ bands }) => bands.size > 1)
      .map(({ sceneId }) => sceneId);
    expect(mixed.length).toBeGreaterThan(0);
  });

  it('restricts a delivery-only opportunity to speech', () => {
    // Asking a partner to speak more slowly exists to change the audio channel;
    // a typed turn cannot perform that act, so typed cannot satisfy it.
    const deliveryOnly = opportunities.filter(
      ({ opportunity }) => opportunity.eligibleModalities?.length === 1
    );
    for (const { opportunity } of deliveryOnly) {
      expect(opportunity.eligibleModalities).toEqual(['spoken']);
    }
    expect(deliveryOnly.map(({ opportunity }) => opportunity.id)).toEqual([
      'opp.es.cafe.repair.request-slower-speech',
    ]);
  });
});

describe('test-support containment', () => {
  it('is never imported by a production module', () => {
    // The helper mutates authored content, so a production import would be a way
    // to make unreviewed evidence look reviewed in the shipped app.
    const { readdirSync, readFileSync, statSync } = require('node:fs') as typeof import('node:fs');
    const { join } = require('node:path') as typeof import('node:path');

    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          if (entry === 'node_modules') continue;
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry)) continue;
        if (entry.endsWith('.test.ts') || entry === 'qualificationTestSupport.ts') continue;
        if (readFileSync(full, 'utf8').includes('qualificationTestSupport')) {
          offenders.push(full);
        }
      }
    };
    walk(join(process.cwd(), 'src'));

    expect(offenders).toEqual([]);
  });
});