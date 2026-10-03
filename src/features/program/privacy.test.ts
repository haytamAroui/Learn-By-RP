import { describe, expect, it } from 'vitest';
import type { ProgramGoalInput, UserPreferences } from '../../types';
import {
  PROGRAM_GOAL_RETENTION_DAYS,
  applyProgramDataRetention,
  pruneProgramGoalInputs,
} from './privacy';

const DAY = 86_400_000;

function goal(recordedAt: string): ProgramGoalInput {
  return {
    targetLanguage: 'es',
    targetLocale: 'es-ES',
    domain: 'travel',
    contextId: 'daily-services',
    recordedAt,
  };
}

describe('program privacy retention', () => {
  it('removes goal/profile inputs after the bounded retention window', () => {
    const now = Date.parse('2026-10-03T00:00:00.000Z');
    const recent = goal(new Date(now - (PROGRAM_GOAL_RETENTION_DAYS - 1) * DAY).toISOString());
    const old = goal(new Date(now - (PROGRAM_GOAL_RETENTION_DAYS + 1) * DAY).toISOString());

    expect(pruneProgramGoalInputs([old, recent], now)).toEqual([recent]);
  });

  it('fails closed for goals without a valid retention timestamp', () => {
    expect(pruneProgramGoalInputs([
      { ...goal('2026-10-03T00:00:00.000Z'), recordedAt: undefined },
      goal('not-a-date'),
    ])).toEqual([]);
  });

  it('drops expired continuity facts while preserving learner alias', () => {
    const now = Date.parse('2026-10-03T00:00:00.000Z');
    const preferences = {
      learningLanguage: 'es',
      explanationLanguage: 'en',
      comfortLevel: 'beginner',
      primaryGoal: 'travel',
      modeDefault: 'guided',
      voiceProcessingConsent: false,
      savedAnalysisConsent: false,
      audioPlaybackEnabled: true,
      autoPlaySpeech: true,
      speechRate: 1,
      accommodations: { enabled: [] },
      programPreferences: [],
      programGoals: [],
      continuityProfile: {
        alias: 'Luna',
        facts: [
          {
            id: 'expired',
            key: 'favorite_drink',
            value: 'tea',
            sensitivity: 'low',
            source: {
              missionId: 'm1',
              sessionId: 's1',
              recordedAt: '2026-09-01T00:00:00.000Z',
            },
            allowedMissionIds: ['m2'],
            expiresAt: '2026-10-02T00:00:00.000Z',
            localOnly: true,
            learnerEditable: true,
          },
        ],
      },
    } satisfies UserPreferences;

    const retained = applyProgramDataRetention(preferences, now);
    expect(retained.continuityProfile?.alias).toBe('Luna');
    expect(retained.continuityProfile?.facts).toEqual([]);
  });
});
