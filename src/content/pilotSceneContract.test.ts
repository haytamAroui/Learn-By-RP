/**
 * Pilot scene contract (Dutch, Belgium, A1–A2).
 *
 * The pilot draft proposed three scenes: a coffee bar, a parcel point and a bike
 * rental. All three already exist as authored nl-BE scenes, so this file asserts
 * the properties the pilot depends on rather than restating content that is
 * already there.
 *
 * Everything here is structural. Bands, register and whether a line sounds
 * natural to a Flemish speaker are review decisions and are deliberately not
 * asserted here — `opportunityQualification.test.ts` holds the authoring side and
 * a reviewer holds the rest.
 */

import { describe, expect, it } from 'vitest';
import { MISSION_CATALOG } from '../data/missions';
import { getScene } from './scenes';
import { communicativeSkillFor } from './skills';
import type { MissionDefinition } from '../types';
import type { SceneDefinition, SkillOpportunityDefinition } from '../contracts/scene';

/** The three pilot families, each already authored under these ids. */
const PILOT_MISSIONS: Array<{
  missionId: string;
  sceneId: string;
  scenarioFamilyId: string;
  label: string;
}> = [
  {
    missionId: 'mission-nl-be-koffiebar',
    sceneId: 'scene.nl-be.cafe.breakfast',
    scenarioFamilyId: 'counter-ordering',
    label: 'Order at a counter',
  },
  {
    missionId: 'mission-nl-be-pakjespunt',
    sceneId: 'scene.nl-be.parcel.pickup',
    scenarioFamilyId: 'parcel-service',
    label: 'Collect a parcel',
  },
  {
    missionId: 'mission-nl-be-fietsverhuur',
    sceneId: 'scene.nl-be.rental.bike',
    scenarioFamilyId: 'equipment-rental',
    label: 'Rent equipment',
  },
];

/**
 * The pilot's hero move: the learner has to find out what else exists rather
 * than accept what was offered.
 */
const HERO_MOVE_SKILLS = ['skill-request-substitution', 'skill-propose-alternative'];

function mission(id: string): MissionDefinition {
  const found = MISSION_CATALOG.find(candidate => candidate.id === id);
  if (!found) throw new Error(`Unknown pilot mission ${id}`);
  return found;
}

function scene(id: string): SceneDefinition {
  const found = getScene(id);
  if (!found) throw new Error(`Unknown pilot scene ${id}`);
  return found;
}

function opportunitiesOf(sceneId: string): SkillOpportunityDefinition[] {
  return scene(sceneId).opportunityDefinitions;
}

describe('pilot scenes exist and are reachable', () => {
  it('has an authored, released scene for each pilot family', () => {
    for (const entry of PILOT_MISSIONS) {
      const authored = mission(entry.missionId);
      expect(authored.language, entry.missionId).toBe('nl');
      expect(authored.sceneId, entry.missionId).toBe(entry.sceneId);
      expect(authored.scenarioFamilyId, entry.missionId).toBe(entry.scenarioFamilyId);
      expect(scene(entry.sceneId).reviewStatus, entry.sceneId).toBe('released');
    }
  });

  it('keeps the three families genuinely different', () => {
    // Three appearances of one skill only show transfer if the situations are
    // not the same situation relabelled.
    const families = PILOT_MISSIONS.map(entry => entry.scenarioFamilyId);
    expect(new Set(families).size).toBe(families.length);
  });

  it('offers the authored help ladder in every pilot scene', () => {
    for (const entry of PILOT_MISSIONS) {
      expect(mission(entry.missionId).supportPolicy.hintLadderAvailable, entry.missionId).toBe(true);
    }
  });
});

describe('the hero move is present in all three families', () => {
  it('gives every pilot scene an opportunity to ask for another option', () => {
    for (const entry of PILOT_MISSIONS) {
      const hero = opportunitiesOf(entry.sceneId).filter(opportunity =>
        HERO_MOVE_SKILLS.includes(opportunity.skillId)
      );
      expect(hero.map(opportunity => opportunity.id), entry.sceneId).not.toEqual([]);
    }
  });

  it('refuses to count accepting what was offered', () => {
    // The pilot's central counting rule: asking what else exists counts, taking
    // the offered fallback does not. If a scene ever loses this negative
    // example, a learner could be credited for the wrong behaviour.
    for (const entry of PILOT_MISSIONS) {
      const hero = opportunitiesOf(entry.sceneId).filter(opportunity =>
        HERO_MOVE_SKILLS.includes(opportunity.skillId)
      );
      for (const opportunity of hero) {
        const negatives = opportunity.negativeExamples.join(' ').toLowerCase();
        expect(negatives, opportunity.id).toMatch(/accept|choos|without (asking|suggesting)/);
      }
    }
  });

  it('gives each hero opportunity a counted example, not only exclusions', () => {
    for (const entry of PILOT_MISSIONS) {
      const hero = opportunitiesOf(entry.sceneId).filter(opportunity =>
        HERO_MOVE_SKILLS.includes(opportunity.skillId)
      );
      for (const opportunity of hero) {
        expect(opportunity.positiveExamples.length, opportunity.id).toBeGreaterThan(0);
      }
    }
  });

  it('records the two-skill reality rather than pretending there is one', () => {
    // The pilot draft calls "request an alternative" a single skill shown in
    // three families. This repository's taxonomy splits it: asking for another
    // option is a substitution, proposing a new arrangement is an alternative.
    // Transfer is computed per skill, so the pilot's hero claim is only true
    // within a skill. This test fails loudly if someone later edits the
    // taxonomy to make the draft's framing true by assertion.
    const skillsByScene = PILOT_MISSIONS.map(entry => [
      ...new Set(
        opportunitiesOf(entry.sceneId)
          .filter(opportunity => HERO_MOVE_SKILLS.includes(opportunity.skillId))
          .map(opportunity => opportunity.skillId)
      ),
    ]);

    expect(skillsByScene[0]).toEqual(['skill-request-substitution']);
    expect(skillsByScene[1]).toEqual(['skill-propose-alternative']);
    expect(skillsByScene[2]).toEqual(['skill-request-substitution']);
  });
});

describe('pilot opportunities stay reviewable', () => {
  const pilotOpportunityIds = PILOT_MISSIONS.flatMap(entry =>
    opportunitiesOf(entry.sceneId).map(opportunity => opportunity.id)
  );

  it('needs review of 13 opportunities rather than all 65', () => {
    // Recorded so the reviewer can see the workload the pilot actually creates.
    expect(pilotOpportunityIds).toHaveLength(13);
  });

  it('leaves every pilot opportunity with a stated rationale and no acceptance', () => {
    for (const opportunityId of pilotOpportunityIds) {
      const sceneEntry = PILOT_MISSIONS.find(entry =>
        opportunitiesOf(entry.sceneId).some(opportunity => opportunity.id === opportunityId)
      )!;
      const opportunity = opportunitiesOf(sceneEntry.sceneId).find(
        candidate => candidate.id === opportunityId
      )!;

      expect(opportunity.qualification?.rationale.trim(), opportunityId).not.toBe('');
      expect(opportunity.evidenceBand, opportunityId).not.toBe('unknown');
      expect(
        communicativeSkillFor(opportunity.skillId)?.modality,
        opportunityId
      ).toBe(opportunity.assessedChannel);
      // No qualified reviewer has signed the pilot content yet, and a test that
      // quietly accepted it would be the exact failure this gate prevents.
      expect(opportunity.qualification?.status, opportunityId).toBe('authored_pending_review');
    }
  });

  it('keeps the pilot scenes free of pre-a1 and above-B1 claims', () => {
    for (const entry of PILOT_MISSIONS) {
      for (const opportunity of opportunitiesOf(entry.sceneId)) {
        expect(['a1', 'a2'], opportunity.id).toContain(opportunity.evidenceBand);
      }
    }
  });
});