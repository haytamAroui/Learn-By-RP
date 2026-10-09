import { expect, it } from 'vitest';
import { summarizeActivity } from './activitySummary';
import type { SessionRecord } from '../../types';

it('uses active-language final learner turns and durable recaps without inventing achievement', () => {
  const sessions = [
    { language: 'nl', state: 'recap_ready', passages: [{ speaker: 'user', status: 'final' }, { speaker: 'assistant', status: 'final' }, { speaker: 'user', status: 'partial' }] },
    { language: 'nl', state: 'live', passages: [{ speaker: 'user', status: 'final' }] },
    { language: 'es', state: 'completed', passages: [{ speaker: 'user', status: 'final' }] },
  ] as SessionRecord[];
  expect(summarizeActivity(sessions, 'nl')).toEqual({ sessions: 1, turns: 2 });
  expect(summarizeActivity([], 'nl')).toEqual({ sessions: 0, turns: 0 });
});
