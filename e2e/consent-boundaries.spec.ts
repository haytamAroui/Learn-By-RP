import { expect, test } from '@playwright/test';
import { MISSION_CATALOG } from '../src/data/missions';

for (const savedAnalysis of [false, true]) test(
  savedAnalysis ? 'a forbidden assessment cannot trigger local fallback evidence' : 'typed live practice saves activity without analysis or evidence',
  async ({ page }) => {
  const mission = MISSION_CATALOG.find(m => m.id === 'mission-nl-be-koffiebar')!;
  await page.route('**/api/**', route => {
    if (route.request().url().includes('/api/guest/identity')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'test-guest-token' }) });
    }
    if (route.request().url().includes('/api/assessment')) {
      return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: 'Saved-analysis consent is required' }) });
    }
    const isActor = route.request().url().includes('/actor/respond');
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(
      isActor ? { replyText: 'Alstublieft.', meaning: 'Here you are.', proposedAction: null } : {}
    ) });
  });
  let assessmentRequests = 0;
  page.on('request', request => { if (request.url().includes('/api/assessment')) assessmentRequests += 1; });
  await page.goto('/');
  await page.evaluate(async savedAnalysis => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mission-coach-archive', 1);
      request.onupgradeneeded = () => {
        for (const store of ['meta', 'sessions', 'observations', 'skill_observations', 'skill_lapses', 'phrases', 'consent', 'deletion_markers', 'pending_jobs']) {
          if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(['meta', 'consent', 'sessions'], 'readwrite');
    const now = new Date().toISOString();
    tx.objectStore('meta').put({ id: 'current', payload: {
      learningLanguage: 'nl-BE', explanationLanguage: 'en', comfortLevel: 'beginner', primaryGoal: 'everyday',
      modeDefault: 'guided', voiceProcessingConsent: false, savedAnalysisConsent: savedAnalysis,
      audioPlaybackEnabled: false, autoPlaySpeech: false, speechRate: 1,
    } }, 'current');
    for (const scope of ['voice', 'saved_analysis']) {
      tx.objectStore('consent').put({ id: scope, scope, granted: scope === 'saved_analysis' && savedAnalysis, version: '2026-09-30.1', decidedAt: now }, scope);
    }
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, savedAnalysis);

  await page.goto(`/mission/${mission.id}`);
  await page.getByRole('button', { name: /Start Mission Now/i }).click();
  await expect(page).toHaveURL(/session\//);
  const sessionId = new URL(page.url()).pathname.split('/').at(-1)!;
  const input = page.getByPlaceholder(/Type your response/i);
  await expect(input).toBeVisible();
  await input.fill(mission.usefulPhrases[0].form);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Alstublieft.', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: /End conversation/i }).last().click();
  await expect(page).toHaveURL(new RegExp(`recap/${sessionId}`));
  expect(assessmentRequests).toBe(savedAnalysis ? 1 : 0);
  const archive = await page.evaluate(async sessionId => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('mission-coach-archive', 1);
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    const tx = db.transaction(['sessions', 'observations', 'skill_observations', 'skill_lapses'], 'readonly');
    const read = (store: string, key?: string) => new Promise<any>((resolve, reject) => {
      const req = key ? tx.objectStore(store).get(key) : tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    const [session, phrases, skills, lapses] = await Promise.all([
      read('sessions', sessionId), read('observations'), read('skill_observations'), read('skill_lapses'),
    ]);
    db.close();
    return { session, phrases, skills, lapses };
  }, sessionId);
  expect(archive.session.passages.some((p: any) => p.speaker === 'user' && p.text === mission.usefulPhrases[0].form)).toBe(true);
  expect(archive.phrases).toEqual([]);
  expect(archive.skills).toEqual([]);
  expect(archive.lapses).toEqual([]);
});
