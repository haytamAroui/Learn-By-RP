import { expect, test } from '@playwright/test';

const CONSENT_VERSION = '2026-09-30.1';

test('320px large-text typed attempt can get help, finish, reload, and recover', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.route('**/api/**', async route => {
    const url = route.request().url();
    if (url.includes('/api/guest/identity')) {
      return route.fulfill({ json: { token: 'test-guest-token' } });
    }
    if (url.includes('/api/actor/respond')) return route.abort('failed');
    return route.fulfill({ json: {} });
  });

  await page.goto('/');
  await page.evaluate(async consentVersion => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('mission-coach-archive');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mission-coach-archive', 1);
      request.onupgradeneeded = () => {
        for (const store of [
          'meta', 'sessions', 'observations', 'skill_observations', 'skill_lapses',
          'phrases', 'consent', 'deletion_markers', 'pending_jobs',
        ]) {
          if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const now = new Date().toISOString();
    const tx = db.transaction(['meta', 'consent'], 'readwrite');
    tx.objectStore('meta').put({ id: 'current', payload: {
      learningLanguage: 'nl-BE', explanationLanguage: 'en', comfortLevel: 'beginner',
      primaryGoal: 'everyday', modeDefault: 'guided', voiceProcessingConsent: false,
      savedAnalysisConsent: false, audioPlaybackEnabled: false, autoPlaySpeech: false,
      speechRate: 1,
    } }, 'current');
    for (const scope of ['voice', 'saved_analysis']) {
      tx.objectStore('consent').put({ id: scope, scope, granted: false, version: consentVersion, decidedAt: now }, scope);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, CONSENT_VERSION);

  await page.reload();
  await page.goto('/mission/mission-nl-be-koffiebar');
  await page.getByRole('button', { name: /Start Mission Now/i }).click();
  await expect(page).toHaveURL(/session\//);

  // Browser text scaling exercises the same rem-based text sizing without hiding
  // overflow behind a device-specific accessibility setting.
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });

  const help = page.getByRole('button', { name: /Help/i });
  await help.scrollIntoViewIfNeeded();
  await expect(help).toBeVisible();
  await help.click();
  await expect(page.getByRole('button', { name: /Strategic intent hint/i })).toBeVisible();
  await page.getByRole('button', { name: /Close/i }).last().click();

  const input = page.getByRole('textbox').last();
  if (!(await input.isVisible())) {
    await page.getByRole('button', { name: /Type instead/i }).click();
  }
  await expect(input).toBeVisible();
  // A reduced visual viewport stands in for the height consumed by a mobile
  // keyboard; the focused field and send control must remain reachable.
  await page.setViewportSize({ width: 320, height: 430 });
  await input.scrollIntoViewIfNeeded();
  await input.fill('Een koffie, alstublieft.');
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Send', exact: true }).click();

  const end = page.getByRole('button', { name: /End conversation/i }).last();
  await end.scrollIntoViewIfNeeded();
  await expect(end).toBeVisible();
  await end.click();
  await expect(page).toHaveURL(/\/recap\/session-/);
  await expect(page.locator('body')).toContainText(/analysis|review|session/i);

  const sessionId = new URL(page.url()).pathname.split('/').at(-1)!;
  await page.reload();
  await expect(page).toHaveURL(new RegExp(`recap/${sessionId}`));
  const savedSession = await page.evaluate(async id => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mission-coach-archive', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const saved = await new Promise<any>((resolve, reject) => {
      const request = db.transaction('sessions').objectStore('sessions').get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return saved;
  }, sessionId);
  expect(savedSession.passages.some((passage: any) => passage.text === 'Een koffie, alstublieft.')).toBe(true);
  expect(savedSession.state).toBe('recap_ready');
  expect(savedSession.sceneState.outcome).toBe('unknown');
  expect(savedSession.taskOutcome).toBe('unknown');
});
