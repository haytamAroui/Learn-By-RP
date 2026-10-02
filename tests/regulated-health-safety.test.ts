import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { MISSION_CATALOG } from '../src/data/missions';
import { PHARMACY_SCENE } from '../src/content/scenes';
import {
  containsRegulatedHealthAdvice,
  isRegulatedHealthMission,
  regulatedHealthPromptFacts,
  sanitizeRegulatedHealthActorResponse,
} from '../src/features/roleplay/regulatedHealthPolicy';

const pharmacyMissions = MISSION_CATALOG.filter(isRegulatedHealthMission);

describe('regulated health roleplay policy', () => {
  it('keeps every pharmacy mission on the communication-only v2 contract', () => {
    expect(pharmacyMissions.map(mission => mission.id).sort()).toEqual([
      'mission-de-apotheke',
      'mission-es-farmacia-sol',
      'mission-fr-pharmacie',
      'mission-it-farmacia',
      'mission-ja-yakkyoku',
    ]);

    for (const mission of pharmacyMissions) {
      expect(mission.version, mission.id).toBeGreaterThanOrEqual(2);
      expect(mission.character.role, mission.id).toMatch(/counter staff/i);
      expect(mission.learnerGoal, mission.id).toMatch(/pharmacist/i);
      expect(mission.completionSignals.join(' '), mission.id).toMatch(
        /pharmacist/i
      );
    }
  });

  it('does not author medication selection or dosing as a learner success condition', () => {
    const forbidden =
      /\b(?:ibuprofen|loratadin|loratadine|cetirizin|cetirizine|paracetamol|dosage|posology|posologie|dosierung|dosaggio|dosis|one tablet|two tablets|maximum 6|medicine recommended|tablets suggested|spray recommended)\b/i;

    for (const mission of pharmacyMissions) {
      const learnerFacing = [
        mission.title,
        mission.learnerGoal,
        mission.stretchGoal,
        ...mission.targetIntents,
        ...mission.usefulPhrases.flatMap(phrase => [
          phrase.form,
          phrase.meaning,
          phrase.usageNote,
        ]),
        ...mission.completionSignals,
        mission.transferPattern,
        mission.transferReason,
      ].join('\n');

      expect(learnerFacing, mission.id).not.toMatch(forbidden);
    }
  });

  it('uses communication-only facts and actions in pharmacy scene v2', () => {
    const serialized = JSON.stringify(PHARMACY_SCENE);

    expect(PHARMACY_SCENE.version).toBe(2);
    expect(PHARMACY_SCENE.skillIds).not.toContain('skill-request-substitution');
    expect(PHARMACY_SCENE.allowedActions.map(action => action.name)).toEqual([
      'request_pharmacist',
      'request_label_help',
      'offer_pharmacist_handoff',
      'complete_scene',
    ]);
    expect(serialized).not.toMatch(
      /nonDrowsyMedicineAvailable|drowsinessMedicineAvailable|ingredientQuestionAsked|confirm_order_item|offer_alternative/i
    );
  });

  it('masks medically suggestive internal scene facts before provider prompting', () => {
    const promptFacts = regulatedHealthPromptFacts({
      nonDrowsyMedicineAvailable: true,
      drowsinessMedicineAvailable: true,
      itemConfirmed: false,
    });

    expect(promptFacts).toEqual({
      pharmacyServiceContext: true,
      pharmacistConsultationAvailable: true,
      labelOrLeafletHelpAvailable: true,
    });
    expect(JSON.stringify(promptFacts)).not.toMatch(/medicine|drows/i);
  });

  it('replaces provider dosage or medicine recommendations deterministically', () => {
    const unsafe = sanitizeRegulatedHealthActorResponse(
      {
        replyText:
          'Je vous conseille ces pastilles. Prenez une tablette toutes les 4 heures.',
        meaning:
          'I recommend these tablets. Take one tablet every 4 hours.',
        proposedAction: {
          name: 'offer_alternative',
          payload: { item: 'tablets' },
        },
      },
      'fr'
    );

    expect(unsafe.proposedAction).toBeNull();
    expect(unsafe.replyText).toMatch(/pharmacien/i);
    expect(unsafe.meaning).toMatch(/professional/i);
    expect(containsRegulatedHealthAdvice(unsafe.replyText)).toBe(false);
  });

  it('preserves a safe communication-only pharmacy reply', () => {
    const safe = {
      replyText:
        'Je peux vous indiquer le comptoir de consultation et la notice officielle.',
      meaning:
        'I can show you the consultation counter and the official leaflet.',
      proposedAction: null,
    };

    expect(sanitizeRegulatedHealthActorResponse(safe, 'fr')).toEqual(safe);
  });

  it('keeps pharmacy Coach targets mission-authoritative and post-filtered', () => {
    const server = readFileSync('server/index.ts', 'utf8');

    expect(server).toContain(
      "mission.usefulPhrases.find(phrase => phrase.id === targetPhraseId)"
    );
    expect(server).toContain(
      "error: 'targetPhraseId must be declared by the mission'"
    );
    expect(server).toContain('regulatedHealthCoachHint(targetLanguage)');
    expect(server).toContain('containsRegulatedHealthAdvice(proposedHint)');
  });

  it('does not broker Realtime for regulated-health missions', () => {
    const server = readFileSync('server/index.ts', 'utf8');
    const realtime = readFileSync(
      'src/providers/conversation/openAIRealtimeConversationProvider.ts',
      'utf8'
    );

    expect(server).toContain(
      "realtime_not_allowed_for_regulated_health_mission"
    );
    expect(server).toContain('isRegulatedHealthMission(mission)');
    expect(realtime).toContain(
      "Regulated-health missions require the HTTP actor boundary"
    );
  });

  it('re-applies the deterministic action allowlist to Realtime output', () => {
    const realtime = readFileSync(
      'src/providers/conversation/openAIRealtimeConversationProvider.ts',
      'utf8'
    );

    expect(realtime).toContain('sanitizeActorAction(');
    expect(realtime).toContain('input.allowedActions');
    expect(realtime).toContain('finalizeRealtimeActorResponse');
  });

  it('keeps the server actor boundary mission-pinned and post-sanitized', () => {
    const server = readFileSync('server/index.ts', 'utf8');

    expect(server).toContain(
      "MISSION_CATALOG.find(item => item.id === missionId)"
    );
    expect(server).toContain('regulatedHealthPromptFacts(sceneFacts)');
    expect(server).toContain('REGULATED_HEALTH_ACTOR_RULES');
    expect(server).toContain('sanitizeRegulatedHealthActorResponse');
    expect(server).not.toMatch(
      /Loratadin-Tabletten|cetirizina|一回二錠|six lozenges per day/i
    );
  });
});
