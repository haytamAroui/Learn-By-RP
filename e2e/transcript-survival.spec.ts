import { expect, test } from '@playwright/test';
import { MISSION_CATALOG } from '../src/data/missions';

test('durable learner turn survives provider failure, reload, explicit resume and finish', async ({ page }) => {
  const mission = MISSION_CATALOG.find(m => m.id === 'mission-nl-be-koffiebar')!;
  let actorCalls = 0;
  await page.route('**/api/**', route => {
    if (route.request().url().includes('/api/guest/identity')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'test-guest-token' }) });
    }
    if (route.request().url().includes('/actor/respond')) {
      actorCalls += 1;
      return route.abort('failed');
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
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
  }, false);


  await page.goto(`/mission/${mission.id}`);
  await page.getByRole('button', { name: /Start Mission Now/i }).click();
  await expect(page).toHaveURL(/session\//);
  const sessionId = new URL(page.url()).pathname.split('/').at(-1)!;
  const input = page.getByPlaceholder(/Type your response/i);
  await expect(input).toBeVisible();
  const learnerText = 'Een koffie, alstublieft.';
  await input.fill(learnerText);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect.poll(() => actorCalls).toBe(1);
  const readSession = () => page.evaluate(async id => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('mission-coach-archive', 1);
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    const value = await new Promise<any>((resolve, reject) => {
      const req = db.transaction('sessions').objectStore('sessions').get(id);
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    db.close(); return value;
  }, sessionId);
  await expect.poll(async () => (await readSession()).passages.some((p: any) => p.text === learnerText)).toBe(true);
  const beforeReload = await readSession();
  expect(beforeReload.endedAt).toBeUndefined();
  expect(beforeReload.observations).toEqual([]);
  await page.reload();
  await expect(page).toHaveURL(/recovery/);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`session/${sessionId}`));
  await expect(page.getByText(learnerText, { exact: true }).first()).toBeVisible();
  expect(actorCalls).toBe(1);
  expect((await readSession()).passages).toEqual(beforeReload.passages);
  await page.getByRole('button', { name: /End conversation/i }).last().click();
  await expect(page).toHaveURL(new RegExp(`recap/${sessionId}`));
  const completed = await readSession();
  expect(completed.state).toBe('recap_ready');
  expect(completed.passages.some((p: any) => p.text === learnerText)).toBe(true);
  await page.reload();
  await expect(page).toHaveURL(new RegExp(`recap/${sessionId}`));
});
