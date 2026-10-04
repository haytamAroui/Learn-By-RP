import { expect, test } from '@playwright/test';
import { INITIAL_PHRASE_ITEMS, MISSION_CATALOG } from '../src/data/missions';

for (const alreadyHidden of [false, true]) test(
  alreadyHidden ? 'startup repairs old recall and recap caches for hidden evidence' : 'hiding the last observation clears recall and stays hidden after reopening Recap',
  async ({ page }) => {
  const mission = MISSION_CATALOG.find(m => m.id === 'mission-nl-be-koffiebar')!;
  const phrase = INITIAL_PHRASE_ITEMS.find(p => p.id === mission.usefulPhrases[0].id)!;
  await page.goto('/');
  // Seed a known evidence ledger; this test verifies projection/UI removal,
  // not microphone recognition or provider assessment.
  await page.evaluate(async ({ mission, phrase, alreadyHidden }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('mission-coach-archive', 1);
      req.onupgradeneeded = () => {
        for (const name of ['meta', 'consent', 'sessions', 'observations', 'skill_observations', 'skill_lapses', 'phrases', 'deletion_markers', 'pending_jobs']) {
          if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name);
        }
      };
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    const tx = db.transaction(['meta', 'consent', 'sessions', 'observations', 'phrases'], 'readwrite');
    const now = new Date().toISOString();
    tx.objectStore('meta').put({ id: 'current', payload: {
      learningLanguage: 'nl-BE', explanationLanguage: 'en', comfortLevel: 'beginner', primaryGoal: 'everyday',
      modeDefault: 'guided', voiceProcessingConsent: true, savedAnalysisConsent: true,
      audioPlaybackEnabled: false, autoPlaySpeech: false, speechRate: 1,
    } }, 'current');
    for (const scope of ['voice', 'saved_analysis']) {
      tx.objectStore('consent').put({ id: scope, scope, granted: true, version: '2026-09-30.1', decidedAt: now }, scope);
    }
    const observation = {
      observationId: 'projection-observation', sessionId: 'projection-session', attemptId: 'attempt-1',
      sourceTurnId: 'projection-turn', sourceRevision: 'rev-1', itemId: phrase.id,
      candidateForm: phrase.form, meaning: phrase.meaning, quote: phrase.form,
      modality: 'spoken', retrieval: 'unassisted', taskOutcome: 'achieved', rehearsal: false,
      supportExposureIds: [], recordedAt: now,
    };
    tx.objectStore('observations').put({ ...observation, hidden: alreadyHidden }, `projection-turn::rev-1::${phrase.id}`);
    tx.objectStore('sessions').put({
      id: 'projection-session', missionId: mission.id, missionVersion: mission.version, language: mission.language,
      mode: 'guided', coldAttempt: true, state: 'recap_ready', startedAt: now, endedAt: now,
      passages: [{ id: 'projection-turn', sessionId: 'projection-session', attemptId: 'attempt-1',
        speaker: 'user', status: 'final', revisionKey: 'rev-1', assemblyVersion: 3, text: phrase.form, modality: 'spoken', fragments: [] }],
      supportExposures: [], observations: [observation], taskOutcome: 'unknown',
      sceneState: { sceneId: mission.sceneId, revision: 1, facts: {}, learnerKnows: [], characterKnows: [], checkpoints: [], isFinished: false, outcome: 'unknown' },
    }, 'projection-session');
    tx.objectStore('phrases').put({ ...phrase, recallStatus: 'growing',
      stats: { assistedCount: 0, unassistedCount: 1, spokenCount: 1, typedCount: 0, lastPracticedAt: now },
      scheduling: { ...phrase.scheduling, intervalDays: 4, modalityHistory: ['spoken'] },
    }, phrase.id);
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, { mission, phrase, alreadyHidden });
  await page.goto('/recap/projection-session');
  if (!alreadyHidden) {
    await page.getByRole('button', { name: 'Evidence · 1', exact: true }).click();
    await page.getByRole('button', { name: 'Hide from ledger', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'Evidence · 0', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Evidence · 0', exact: true })).toBeVisible();
  await page.goto(`/phrase/${encodeURIComponent(phrase.id)}`);
  await expect(page.getByText('new', { exact: true })).toBeVisible();
  await expect(page.getByText('Independent uses', { exact: true })).toBeVisible();
  const stored = await page.evaluate(async phraseId => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('mission-coach-archive', 1);
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    const req = db.transaction(['phrases'], 'readonly').objectStore('phrases').get(phraseId);
    const value = await new Promise<any>((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
    db.close(); return value;
  }, phrase.id);
  expect(stored.stats.unassistedCount).toBe(0);
  expect(stored.scheduling.intervalDays).toBe(1);
  expect(stored.scheduling.modalityHistory).toEqual([]);
});
