import { expect, test } from '@playwright/test';
import { MISSION_CATALOG } from '../src/data/missions';
import { getScene } from '../src/content/scenes';
import { createInitialScene } from '../src/features/roleplay/runtime';

test('checkpoint retry preserves the parent and keeps the active transport', async ({ page }) => {
  const mission = MISSION_CATALOG.find(m => m.id === 'mission-nl-be-koffiebar')!;
  const scene = getScene(mission.sceneId!)!;
  let starts = 0;
  const actorAttempts: string[] = [];
  await page.route('**/v1/voice/**', route => {
    const url = route.request().url();
    const body = route.request().method() === 'POST' ? route.request().postDataJSON() : {};
    if (url.endsWith('/sessions')) {
      starts += 1;
      return route.fulfill({ json: { state: createInitialScene(scene, body.sessionId, body.attemptId) } });
    }
    if (url.endsWith('/scene/fork')) {
      const id = url.split('/sessions/')[1].split('/')[0];
      return route.fulfill({ json: { state: createInitialScene(scene, id, 'attempt-child'), fork: { attemptId: 'attempt-child' } } });
    }
    return route.fulfill({ json: {} });
  });
  await page.route('**/api/**', route => {
    if (route.request().url().includes('/api/guest/identity')) {
      return route.fulfill({ json: { token: 'test-guest-token' } });
    }
    if (route.request().url().includes('/actor/respond')) {
      actorAttempts.push(route.request().postDataJSON().recentPassages.at(-1).attemptId);
      return route.fulfill({ json: { replyText: `Antwoord ${actorAttempts.length}`, meaning: 'Reply', proposedAction: null } });
    }
    return route.fulfill({ json: {} });
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
  await input.fill('Een koffie, alstublieft.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Antwoord 1', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Freeze Scene', exact: true }).click();
  await page.getByRole('button', { name: 'Retry turn', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Freeze Scene', exact: true })).toBeVisible();
  await input.fill('En water, alstublieft.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Antwoord 2', { exact: true }).first()).toBeVisible();
  expect(starts).toBe(1);
  expect(actorAttempts).toEqual(['attempt-1', 'attempt-child']);
  const saved = await page.evaluate(async id => {
    const db = await new Promise<IDBDatabase>(resolve => {
      const req = indexedDB.open('mission-coach-archive', 1); req.onsuccess = () => resolve(req.result);
    });
    const value = await new Promise<any>(resolve => {
      const req = db.transaction('sessions').objectStore('sessions').get(id); req.onsuccess = () => resolve(req.result);
    });
    db.close(); return value;
  }, sessionId);
  expect(saved.activeAttemptId).toBe('attempt-child');
  expect(saved.attemptHistory.at(-1)).toMatchObject({ parentAttemptId: 'attempt-1', checkpointId: 'scene-start', rehearsal: true });
  expect(saved.passages.some((p: any) => p.attemptId === 'attempt-1' && p.text === 'Een koffie, alstublieft.')).toBe(true);
  expect(saved.passages.some((p: any) => p.attemptId === 'attempt-child' && p.text === 'En water, alstublieft.')).toBe(true);
});
