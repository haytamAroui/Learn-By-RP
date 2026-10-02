import { describe, expect, it } from 'vitest';
import { SPANISH_DAILY_SERVICES_PILOT } from '../../data/programs';
import { decideAuthoringExecution } from './authoringPolicy';

const REFS = SPANISH_DAILY_SERVICES_PILOT.missionPlan;

describe('program authoring policy', () => {
  it('allows curated execution only from reviewed catalog refs', () => {
    expect(
      decideAuthoringExecution({
        mode: 'curated',
        goalDomain: 'travel',
        curatedRefs: REFS,
      })
    ).toEqual({ executable: true, reason: 'curated_reviewed_refs' });
  });

  it('keeps AI sequencing non-executable in V1', () => {
    expect(
      decideAuthoringExecution({
        mode: 'ai_sequence',
        goalDomain: 'travel',
        aiSequence: { missionRefs: REFS, v2Enabled: false },
      })
    ).toEqual({ executable: false, reason: 'ai_sequence_deferred_to_v2' });
  });

  it('allows V2 AI sequencing only over reviewed mission refs', () => {
    expect(
      decideAuthoringExecution({
        mode: 'ai_sequence',
        goalDomain: 'travel',
        aiSequence: { missionRefs: REFS, v2Enabled: true },
      })
    ).toEqual({ executable: true, reason: 'ai_sequence_reviewed_refs_only' });

    expect(
      decideAuthoringExecution({
        mode: 'ai_sequence',
        goalDomain: 'travel',
        aiSequence: {
          v2Enabled: true,
          missionRefs: [{ missionId: 'invented', missionVersion: 1 }],
        },
      }).executable
    ).toBe(false);
  });

  it('requires extraction, screening, caps and learner preview for templates', () => {
    const base = {
      sourceText: 'I need café and pharmacy practice',
      extractedMissionIds: ['mission-es-cafe-sol'],
      screeningStatus: 'passed' as const,
      withinCaps: true,
      previewAccepted: true,
      discarded: false,
    };

    expect(
      decideAuthoringExecution({
        mode: 'template',
        goalDomain: 'travel',
        template: { ...base, previewAccepted: false },
      }).executable
    ).toBe(false);

    expect(
      decideAuthoringExecution({
        mode: 'template',
        goalDomain: 'travel',
        template: base,
      })
    ).toEqual({ executable: true, reason: 'template_preview_accepted' });
  });

  it('keeps exam programs curated', () => {
    expect(
      decideAuthoringExecution({
        mode: 'template',
        goalDomain: 'exam',
        template: {
          sourceText: 'exam',
          extractedMissionIds: ['mission-es-cafe-sol'],
          screeningStatus: 'passed',
          withinCaps: true,
          previewAccepted: true,
          discarded: false,
        },
      })
    ).toEqual({ executable: false, reason: 'regulated_domain_curated_only' });
  });
});
