import { INITIAL_PHRASE_ITEMS, MISSION_CATALOG } from '../../data/missions';
import {
  LearningObservation,
  PhraseItem,
  SessionRecord,
  UserPreferences
} from '../../types';
import { projectPhraseState } from '../learning/learningCore';

const STORAGE_KEYS = {
  PREFERENCES: 'mission_coach_preferences',
  SESSIONS: 'mission_coach_sessions',
  PHRASES: 'mission_coach_phrases',
  OBSERVATIONS: 'mission_coach_observations'
};

const DEFAULT_PREFERENCES: UserPreferences = {
  learningLanguage: 'es',
  explanationLanguage: 'en',
  comfortLevel: 'beginner',
  primaryGoal: 'travel',
  modeDefault: 'guided',
  voiceProcessingConsent: true,
  savedAnalysisConsent: true,
  audioPlaybackEnabled: true,
  autoPlaySpeech: true,
  speechRate: 1.0
};

export class ArchiveStorage {
  static getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (data) {
        const parsed = JSON.parse(data);
        // Normalize explanationLanguage to valid UiLanguage ('en' | 'fr' | 'es' | 'nl')
        let lang = (parsed.explanationLanguage || 'en').toLowerCase();
        if (lang.startsWith('fr')) lang = 'fr';
        else if (lang.startsWith('es') || lang.startsWith('sp')) lang = 'es';
        else if (lang.startsWith('nl') || lang.startsWith('du')) lang = 'nl';
        else lang = 'en';

        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          explanationLanguage: lang
        };
      }
    } catch (e) {
      console.error('Failed to read preferences', e);
    }
    return DEFAULT_PREFERENCES;
  }

  static savePreferences(prefs: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to save preferences', e);
    }
  }

  static getSessions(): SessionRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read sessions', e);
    }
    return [];
  }

  static getSessionById(id: string): SessionRecord | undefined {
    return this.getSessions().find(s => s.id === id);
  }

  static saveSession(session: SessionRecord): void {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

    // Also persist observations
    if (session.observations && session.observations.length > 0) {
      const allObs = this.getObservations();
      const existingObsIds = new Set(allObs.map(o => o.observationId));
      for (const obs of session.observations) {
        if (!existingObsIds.has(obs.observationId)) {
          allObs.push(obs);
        }
      }
      localStorage.setItem(STORAGE_KEYS.OBSERVATIONS, JSON.stringify(allObs));

      // Re-project phrase states
      this.reprojectAllPhrases();
    }
  }

  static deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

    const obs = this.getObservations().filter(o => o.sessionId !== sessionId);
    localStorage.setItem(STORAGE_KEYS.OBSERVATIONS, JSON.stringify(obs));

    this.reprojectAllPhrases();
  }

  static getObservations(): LearningObservation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OBSERVATIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read observations', e);
    }
    return [];
  }

  static deleteObservation(observationId: string): void {
    const obs = this.getObservations().map(o => {
      if (o.observationId === observationId) {
        return { ...o, userDisputed: true, hidden: true };
      }
      return o;
    });
    localStorage.setItem(STORAGE_KEYS.OBSERVATIONS, JSON.stringify(obs));
    this.reprojectAllPhrases();
  }

  static hideObservation(observationId: string): void {
    const obs = this.getObservations().map(o => {
      if (o.observationId === observationId) {
        return { ...o, hidden: true };
      }
      return o;
    });
    localStorage.setItem(STORAGE_KEYS.OBSERVATIONS, JSON.stringify(obs));
    this.reprojectAllPhrases();
  }

  static getPhrases(): PhraseItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PHRASES);
      if (data) {
        let phrases: PhraseItem[] = JSON.parse(data);
        // Ensure phrases from new catalog additions are merged
        const existingIds = new Set(phrases.map(p => p.id));
        const missingPhrases = INITIAL_PHRASE_ITEMS.filter(ip => !existingIds.has(ip.id));
        if (missingPhrases.length > 0) {
          phrases = [...phrases, ...missingPhrases];
          this.savePhrases(phrases);
        }

        // Refresh 'due' calculation against current time
        const now = Date.now();
        return phrases.map(p => ({
          ...p,
          scheduling: {
            ...p.scheduling,
            due: new Date(p.scheduling.nextReviewAt).getTime() <= now
          }
        }));
      }
    } catch (e) {
      console.error('Failed to read phrases', e);
    }

    // Seed default phrases
    this.savePhrases(INITIAL_PHRASE_ITEMS);
    return INITIAL_PHRASE_ITEMS;
  }

  static savePhrases(phrases: PhraseItem[]): void {
    localStorage.setItem(STORAGE_KEYS.PHRASES, JSON.stringify(phrases));
  }

  static resetPhrase(phraseId: string): void {
    const phrases = this.getPhrases();
    const updated = phrases.map(p => {
      if (p.id === phraseId) {
        return {
          ...p,
          recallStatus: 'new' as const,
          scheduling: {
            ...p.scheduling,
            nextReviewAt: new Date(Date.now() - 3600000).toISOString(),
            due: true,
            intervalDays: 1
          },
          stats: {
            assistedCount: 0,
            unassistedCount: 0,
            spokenCount: 0,
            typedCount: 0
          }
        };
      }
      return p;
    });
    this.savePhrases(updated);
  }

  static reprojectAllPhrases(): void {
    const allPhrases = this.getPhrases();
    const allObservations = this.getObservations();

    const updated = allPhrases.map(phrase => {
      const relevant = allObservations.filter(
        o => o.itemId === phrase.id || o.candidateForm.toLowerCase() === phrase.form.toLowerCase()
      );
      return projectPhraseState(phrase, relevant);
    });

    this.savePhrases(updated);
  }

  static exportArchiveJson(): string {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      preferences: this.getPreferences(),
      sessions: this.getSessions(),
      observations: this.getObservations(),
      phrases: this.getPhrases()
    };
    return JSON.stringify(payload, null, 2);
  }

  static importArchiveJson(jsonString: string): {
    success: boolean;
    message: string;
    counts?: { sessions: number; phrases: number; observations: number };
  } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'Invalid JSON payload format' };
      }

      let sessionsCount = 0;
      let phrasesCount = 0;
      let observationsCount = 0;

      if (Array.isArray(parsed.sessions)) {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(parsed.sessions));
        sessionsCount = parsed.sessions.length;
      }
      if (Array.isArray(parsed.observations)) {
        localStorage.setItem(STORAGE_KEYS.OBSERVATIONS, JSON.stringify(parsed.observations));
        observationsCount = parsed.observations.length;
      }
      if (Array.isArray(parsed.phrases)) {
        localStorage.setItem(STORAGE_KEYS.PHRASES, JSON.stringify(parsed.phrases));
        phrasesCount = parsed.phrases.length;
      }
      if (parsed.preferences && typeof parsed.preferences === 'object') {
        this.savePreferences({
          ...DEFAULT_PREFERENCES,
          ...parsed.preferences
        });
      }

      this.reprojectAllPhrases();

      return {
        success: true,
        message: `Successfully restored ${sessionsCount} sessions, ${phrasesCount} phrases, and ${observationsCount} observations.`,
        counts: {
          sessions: sessionsCount,
          phrases: phrasesCount,
          observations: observationsCount
        }
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to import archive: ${err.message || 'Malformed file'}`
      };
    }
  }

  static exportLearningReceiptText(session: SessionRecord): string {
    const mission = MISSION_CATALOG.find(m => m.id === session.missionId);
    let out = `========================================================\n`;
    out += `MISSION COACH — LEARNING RECEIPT\n`;
    out += `========================================================\n`;
    out += `Date:        ${new Date(session.startedAt).toLocaleString()}\n`;
    out += `Mission:     ${mission?.title || session.missionId}\n`;
    out += `Mode:        ${session.mode.toUpperCase()}\n`;
    out += `Outcome:     ${session.taskOutcome.toUpperCase()}\n`;
    out += `Cold Start:  ${session.coldAttempt ? 'Yes (No phrases revealed)' : 'No (Briefing exposed)'}\n`;
    out += `--------------------------------------------------------\n\n`;

    out += `VALIDATED PHRASE EVIDENCE:\n`;
    if (session.observations.length === 0) {
      out += `  No specific target phrases validated in this session.\n`;
    } else {
      session.observations.forEach((obs, idx) => {
        out += `${idx + 1}. "${obs.candidateForm}"\n`;
        out += `   Meaning:   ${obs.meaning}\n`;
        out += `   Quote:     "${obs.quote}"\n`;
        out += `   Retrieval: ${obs.retrieval.toUpperCase()} (${obs.modality})\n`;
        out += `   Rehearsal: ${obs.rehearsal ? 'Yes' : 'No'}\n\n`;
      });
    }

    out += `--------------------------------------------------------\n`;
    out += `TRANSCRIPT SUMMARY (${session.passages.length} turns):\n`;
    session.passages.forEach(p => {
      const spk = p.speaker === 'user' ? 'YOU' : 'CHARACTER';
      out += `[${spk}] ${p.text}\n`;
    });

    out += `\n========================================================\n`;
    out += `Generated locally on device. No telemetry or cloud lock-in.\n`;
    return out;
  }

  static clearAllLearningData(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.OBSERVATIONS);
    localStorage.removeItem(STORAGE_KEYS.PHRASES);
    this.savePhrases(INITIAL_PHRASE_ITEMS);
  }
}
