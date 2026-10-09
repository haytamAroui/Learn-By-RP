import type { LanguageCode, SessionRecord } from '../../types';

/** Durable activity counts are presentation data, never mastery or band evidence. */
export function summarizeActivity(sessions: SessionRecord[], language: LanguageCode) {
  const relevant = sessions.filter(session => session.language === language);
  const complete = relevant.filter(session => ['completed', 'recap_ready'].includes(session.state));
  const turns = relevant.reduce((count, session) => count + session.passages.filter(passage =>
    passage.speaker === 'user' && passage.status === 'final'
  ).length, 0);
  return { sessions: complete.length, turns };
}
