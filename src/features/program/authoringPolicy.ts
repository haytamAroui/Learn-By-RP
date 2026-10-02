import type { ProgramGoalDomain, ProgramMissionRef } from '../../contracts/program';
import { MISSION_CATALOG } from '../../data/missions';
import { getScene } from '../../content/scenes';

export type ProgramAuthoringMode = 'curated' | 'template' | 'ai_sequence';

export interface TemplateProgramDraft {
  sourceText: string;
  extractedMissionIds: string[];
  screeningStatus: 'pending' | 'passed' | 'rejected';
  withinCaps: boolean;
  previewAccepted: boolean;
  discarded: boolean;
}

export interface AiSequenceProposal {
  missionRefs: ProgramMissionRef[];
  /** V1 must remain false; executable AI sequencing starts in V2 only. */
  v2Enabled: boolean;
}

export interface AuthoringDecision {
  executable: boolean;
  reason:
    | 'curated_reviewed_refs'
    | 'template_requires_review_pipeline'
    | 'template_preview_accepted'
    | 'ai_sequence_deferred_to_v2'
    | 'ai_sequence_reviewed_refs_only'
    | 'regulated_domain_curated_only'
    | 'unknown_or_unreviewed_mission';
}

function refsAreReviewedCatalogEntries(refs: ProgramMissionRef[]): boolean {
  return refs.every(ref => {
    const mission = MISSION_CATALOG.find(item => item.id === ref.missionId);
    if (!mission || mission.version !== ref.missionVersion) return false;

    if (ref.sceneId) {
      const scene = getScene(ref.sceneId);
      return Boolean(
        scene &&
          mission.sceneId === ref.sceneId &&
          scene.version === ref.sceneVersion &&
          scene.reviewStatus === 'released'
      );
    }

    return true;
  });
}

export function decideAuthoringExecution(input: {
  mode: ProgramAuthoringMode;
  goalDomain: ProgramGoalDomain;
  curatedRefs?: ProgramMissionRef[];
  template?: TemplateProgramDraft;
  aiSequence?: AiSequenceProposal;
}): AuthoringDecision {
  if (input.goalDomain === 'exam' && input.mode !== 'curated') {
    return { executable: false, reason: 'regulated_domain_curated_only' };
  }

  if (input.mode === 'curated') {
    const refs = input.curatedRefs ?? [];
    return refs.length > 0 && refsAreReviewedCatalogEntries(refs)
      ? { executable: true, reason: 'curated_reviewed_refs' }
      : { executable: false, reason: 'unknown_or_unreviewed_mission' };
  }

  if (input.mode === 'template') {
    const draft = input.template;
    if (
      !draft ||
      draft.discarded ||
      draft.screeningStatus !== 'passed' ||
      !draft.withinCaps ||
      !draft.previewAccepted
    ) {
      return { executable: false, reason: 'template_requires_review_pipeline' };
    }

    const refs = draft.extractedMissionIds
      .map(id => {
        const mission = MISSION_CATALOG.find(item => item.id === id);
        if (!mission) return null;
        const scene = mission.sceneId ? getScene(mission.sceneId) : undefined;
        return {
          missionId: mission.id,
          missionVersion: mission.version,
          sceneId: scene?.id,
          sceneVersion: scene?.version,
        } satisfies ProgramMissionRef;
      })
      .filter((ref): ref is ProgramMissionRef => Boolean(ref));

    return (
      refs.length === draft.extractedMissionIds.length &&
      refs.length > 0 &&
      refsAreReviewedCatalogEntries(refs)
    )
      ? { executable: true, reason: 'template_preview_accepted' }
      : { executable: false, reason: 'unknown_or_unreviewed_mission' };
  }

  const proposal = input.aiSequence;
  if (!proposal?.v2Enabled) {
    return { executable: false, reason: 'ai_sequence_deferred_to_v2' };
  }

  return proposal.missionRefs.length > 0 && refsAreReviewedCatalogEntries(proposal.missionRefs)
    ? { executable: true, reason: 'ai_sequence_reviewed_refs_only' }
    : { executable: false, reason: 'unknown_or_unreviewed_mission' };
}
