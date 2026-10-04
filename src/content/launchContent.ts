import { getScene } from './scenes';
import { sceneReviewGaps } from './releaseReview';
import { isOpportunityQualificationReviewed } from '../features/learning/opportunityQualification';
import { MISSION_CATALOG } from '../data/missions';
import type { CommunicativeSkillId, EvidenceBand, Modality, ScenarioFamilyId, SkillModality } from '../types';

export interface LaunchContentSpec {
  id: string;
  targetLanguage: string;
  targetLocale: string;
  missionIds: readonly string[];
  coreSkillIds: readonly CommunicativeSkillId[];
  minFamiliesPerCoreSkill: number;
}

export const SPANISH_LAUNCH_CONTENT_V1: LaunchContentSpec = {
  id: 'launch.es-es.daily-life.v1',
  targetLanguage: 'es',
  targetLocale: 'es-ES',
  missionIds: [
    'mission-es-cafe-sol',
    'mission-es-parcel-counter',
    'mission-es-neighbors-door',
    'mission-es-metro-station',
    'mission-es-farmacia-sol',
    'mission-es-la-terraza',
    'mission-es-hotel-checkin',
    'mission-es-bike-rental',
  ],
  coreSkillIds: [
    'skill-inquire-specifications',
    'skill-propose-alternative',
    'skill-request-substitution',
    'skill-request-repetition',
    'skill-ask-clarification',
    'skill-check-understanding',
  ],
  minFamiliesPerCoreSkill: 3,
};

export const FLEMISH_LAUNCH_CONTENT_V1: LaunchContentSpec = {
  id: 'launch.nl-be.daily-life.v1',
  targetLanguage: 'nl',
  targetLocale: 'nl-BE',
  missionIds: [
    'mission-nl-be-koffiebar',
    'mission-nl-be-pakjespunt',
    'mission-nl-be-buur-sleutel',
    'mission-nl-be-metro',
    'mission-nl-be-apotheek',
    'mission-nl-be-terras',
    'mission-nl-be-hotel',
    'mission-nl-be-fietsverhuur',
  ],
  coreSkillIds: [
    'skill-inquire-specifications',
    'skill-propose-alternative',
    'skill-request-substitution',
    'skill-request-repetition',
    'skill-ask-clarification',
    'skill-check-understanding',
  ],
  minFamiliesPerCoreSkill: 3,
};

export const LAUNCH_CONTENT_SPECS: readonly LaunchContentSpec[] = [
  SPANISH_LAUNCH_CONTENT_V1,
  FLEMISH_LAUNCH_CONTENT_V1,
];

export interface LaunchContentCoverage {
  skillId: CommunicativeSkillId;
  scenarioFamilyIds: ScenarioFamilyId[];
}

export interface LaunchContentValidation {
  valid: boolean;
  errors: string[];
  coverage: LaunchContentCoverage[];
  readiness: LaunchLearningLoopReadiness;
}

export interface LaunchSkillLoopReadiness {
  skillId: CommunicativeSkillId;
  opportunityMissionIds: string[];
  contrastiveRubricOpportunityIds: string[];
  helpAvailableMissionIds: string[];
  laterRetrievalPairs: Array<{ firstMissionId: string; laterMissionId: string; familyId: ScenarioFamilyId }>;
  qualifiedBandChannels: Array<{
    evidenceBand: EvidenceBand;
    assessedChannel: SkillModality;
    eligibleModalities: Modality[];
  }>;
  /**
   * Opportunities whose dimensions have been authored with a rationale but that
   * no qualified reviewer has accepted yet. They are one signature away from
   * qualifying, which is a different state from having no decision at all.
   */
  pendingReviewBandChannels: Array<{
    evidenceBand: EvidenceBand;
    assessedChannel: SkillModality;
    eligibleModalities: Modality[];
  }>;
  gaps: string[];
}

export interface LaunchLearningLoopReadiness {
  ready: boolean;
  skills: LaunchSkillLoopReadiness[];
  assetReviewEvidence: 'not-tracked' | 'incomplete';
  assetReviewGaps: string[];
}

export function validateLaunchContentCoverage(
  spec: LaunchContentSpec = SPANISH_LAUNCH_CONTENT_V1
): LaunchContentValidation {
  const errors: string[] = [];
  const selectedMissions = spec.missionIds.map(missionId =>
    MISSION_CATALOG.find(candidate => candidate.id === missionId)
  );
  const familiesBySkill = new Map<CommunicativeSkillId, Set<ScenarioFamilyId>>(
    spec.coreSkillIds.map(skillId => [skillId, new Set<ScenarioFamilyId>()])
  );

  for (const missionId of spec.missionIds) {
    const mission = MISSION_CATALOG.find(candidate => candidate.id === missionId);
    if (!mission) {
      errors.push(`${spec.id}: unknown mission ${missionId}`);
      continue;
    }
    if (mission.language !== spec.targetLanguage) {
      errors.push(
        `${spec.id}/${missionId}: language ${mission.language} != ${spec.targetLanguage}`
      );
    }
    if (!mission.sceneId) {
      errors.push(`${spec.id}/${missionId}: executable scene is required`);
      continue;
    }

    const scene = getScene(mission.sceneId);
    if (!scene) {
      errors.push(`${spec.id}/${missionId}: scene ${mission.sceneId} is missing`);
      continue;
    }
    if (scene.reviewStatus !== 'released') {
      errors.push(
        `${spec.id}/${missionId}: scene ${scene.id} is ${scene.reviewStatus}, not released`
      );
    }

    const opportunitySkills = new Set(
      scene.opportunityDefinitions.map(opportunity => opportunity.skillId)
    );
    for (const skillId of spec.coreSkillIds) {
      if (opportunitySkills.has(skillId)) {
        familiesBySkill.get(skillId)!.add(mission.scenarioFamilyId);
      }
    }
  }

  const coverage = spec.coreSkillIds.map(skillId => ({
    skillId,
    scenarioFamilyIds: [...(familiesBySkill.get(skillId) ?? new Set())].sort(),
  }));

  for (const item of coverage) {
    if (item.scenarioFamilyIds.length < spec.minFamiliesPerCoreSkill) {
      errors.push(
        `${spec.id}/${item.skillId}: ${item.scenarioFamilyIds.length} executable scenario families; minimum is ${spec.minFamiliesPerCoreSkill}`
      );
    }
  }

  const skills: LaunchSkillLoopReadiness[] = spec.coreSkillIds.map(skillId => {
    const opportunityMissionIds: string[] = [];
    const contrastiveRubricOpportunityIds: string[] = [];
    const helpAvailableMissionIds: string[] = [];
    const qualifiedDimensions = new Map<string, LaunchSkillLoopReadiness['qualifiedBandChannels'][number]>();
    const pendingReviewDimensions = new Map<string, LaunchSkillLoopReadiness['pendingReviewBandChannels'][number]>();
    const opportunitiesByMission = selectedMissions.map(mission => {
      if (!mission?.sceneId) return [];
      const scene = getScene(mission.sceneId);
      return scene?.opportunityDefinitions
        .filter(opportunity => opportunity.skillId === skillId)
        .map(opportunity => ({ mission, opportunity })) ?? [];
    });

    for (const opportunities of opportunitiesByMission) {
      for (const { mission, opportunity } of opportunities) {
        opportunityMissionIds.push(mission.id);
        if (mission.supportPolicy.hintLadderAvailable) helpAvailableMissionIds.push(mission.id);
        if (opportunity.positiveExamples.length > 0 && opportunity.negativeExamples.length > 0) {
          contrastiveRubricOpportunityIds.push(opportunity.id);
        }
        if (
          opportunity.evidenceBand && opportunity.evidenceBand !== 'unknown' &&
          opportunity.assessedChannel && opportunity.eligibleModalities?.length
        ) {
          const key = `${opportunity.evidenceBand}::${opportunity.assessedChannel}`;
          const dimension = {
            evidenceBand: opportunity.evidenceBand,
            assessedChannel: opportunity.assessedChannel,
            eligibleModalities: [...opportunity.eligibleModalities],
          };
          // Authored and accepted are separate facts, so they are counted
          // separately. Collapsing them would let an unreviewed band read as
          // coverage in the one report a release decision is based on.
          const target = isOpportunityQualificationReviewed(opportunity)
            ? qualifiedDimensions
            : pendingReviewDimensions;
          target.set(key, dimension);
        }
      }
    }

    const selectedById = new Map(
      selectedMissions.filter((mission): mission is NonNullable<typeof mission> => Boolean(mission))
        .map(mission => [mission.id, mission])
    );
    const laterRetrievalPairs: LaunchSkillLoopReadiness['laterRetrievalPairs'] = [];
    for (let firstIndex = 0; firstIndex < selectedMissions.length; firstIndex += 1) {
      const firstMission = selectedMissions[firstIndex];
      if (!firstMission || opportunitiesByMission[firstIndex].length === 0) continue;
      const seen = new Set([firstMission.id]);
      let nextMissionId = firstMission.nextMissionId;
      while (nextMissionId && !seen.has(nextMissionId)) {
        seen.add(nextMissionId);
        const laterMission = selectedById.get(nextMissionId);
        // A path that leaves this launch pack cannot establish its coverage.
        if (!laterMission) break;
        const laterIndex = selectedMissions.findIndex(mission => mission?.id === laterMission.id);
        if (
          laterIndex >= 0 && opportunitiesByMission[laterIndex].length > 0 &&
          laterMission.scenarioFamilyId !== firstMission.scenarioFamilyId
        ) {
          laterRetrievalPairs.push({
            firstMissionId: firstMission.id,
            laterMissionId: laterMission.id,
            familyId: laterMission.scenarioFamilyId,
          });
        }
        nextMissionId = laterMission.nextMissionId;
      }
    }

    const gaps: string[] = [];
    if (contrastiveRubricOpportunityIds.length === 0) gaps.push('no opportunity has both positive and negative rubric examples');
    if (helpAvailableMissionIds.length === 0) gaps.push('no opportunity mission offers the authored help ladder');
    if (laterRetrievalPairs.length === 0) gaps.push('no later retrieval is authored in a different scenario family');
    if (qualifiedDimensions.size === 0) {
      gaps.push(
        pendingReviewDimensions.size === 0
          ? 'no opportunity has an authored evidence band, assessed channel, and eligible modality'
          : `no opportunity has a reviewed evidence band (${pendingReviewDimensions.size} authored, awaiting a qualified reviewer)`
      );
    }

    return {
      skillId,
      opportunityMissionIds: [...new Set(opportunityMissionIds)],
      contrastiveRubricOpportunityIds,
      helpAvailableMissionIds: [...new Set(helpAvailableMissionIds)],
      laterRetrievalPairs,
      qualifiedBandChannels: [...qualifiedDimensions.values()],
      pendingReviewBandChannels: [...pendingReviewDimensions.values()],
      gaps,
    };
  });

  // Scene `released` flags do not attest to human locale review, example-audio
  // review, asset rights, or reviewer sign-off. The review records are modeled
  // now and are empty, so these gaps are the reported state rather than a
  // modelling omission.
  const assetReviewGaps = selectedMissions.flatMap(mission => {
    if (!mission?.sceneId) return [];
    const scene = getScene(mission.sceneId);
    return scene ? sceneReviewGaps(scene) : [];
  });
  const readiness: LaunchLearningLoopReadiness = {
    ready: skills.every(skill => skill.gaps.length === 0) && assetReviewGaps.length === 0,
    skills,
    assetReviewEvidence: 'not-tracked',
    assetReviewGaps,
  };

  return { valid: errors.length === 0, errors, coverage, readiness };
}
