import { expect, test, type Page } from '@playwright/test';
import { TRANSLATIONS } from '../src/features/i18n/translations';

async function prepare(page: Page, language: 'en' | 'fr' | 'nl', voice = false) {
  await page.goto('/');
  await page.evaluate(async ({ language, voice }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mission-coach-archive', 1);
      request.onupgradeneeded = () => {
        for (const store of ['meta', 'sessions', 'observations', 'skill_observations', 'skill_lapses',
          'phrases', 'consent', 'deletion_markers', 'pending_jobs']) {
          if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(['meta', 'consent'], 'readwrite');
    tx.objectStore('meta').put({ id: 'current', payload: { learningLanguage: 'nl', explanationLanguage: language,
      comfortLevel: 'beginner', primaryGoal: 'everyday', modeDefault: 'guided', voiceProcessingConsent: voice,
      savedAnalysisConsent: false, audioPlaybackEnabled: voice, speechRate: 1 } }, 'current');
    for (const scope of ['voice', 'saved_analysis']) tx.objectStore('consent').put({ id: scope, scope,
      granted: scope === 'voice' && voice, version: '2026-09-30.1', decidedAt: new Date().toISOString() }, scope);
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  }, { language, voice });
  await page.reload();
  await page.goto('/mission/mission-nl-be-koffiebar');
  await page.getByRole('button', { name: TRANSLATIONS[language].briefing.startMissionButton, exact: true }).click();
  await expect(page).toHaveURL(/session\//);
}

async function savedSession(page: Page) {
  const id = new URL(page.url()).pathname.split('/').at(-1)!;
  return page.evaluate(async id => {
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('mission-coach-archive', 1);
      request.onsuccess = () => resolve(request.result);
    });
    const result = await new Promise<any>(resolve => {
      const request = db.transaction('sessions').objectStore('sessions').get(id);
      request.onsuccess = () => resolve(request.result);
    });
    db.close(); return result;
  }, id);
}

test('answers persist support, draft without sending, and retain typed turns after a successful reply', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  let actorCalls = 0, speechCalls = 0;
  await page.route('**/api/**', async route => {
    const url = route.request().url();
    if (url.includes('/realtime/session')) return route.fulfill({ status: 503, json: { error: 'Test realtime unavailable' } });
    if (url.includes('/speech/synthesize')) speechCalls++;
    if (url.includes('/actor/respond')) {
      actorCalls++;
      return route.fulfill({ json: { replyText: 'Prima. Is het voor hier of om mee te nemen?',
        meaning: 'Okay. Is it for here or to take away?' } });
    }
    if (url.includes('/guest/identity')) return route.fulfill({ json: { token: 'test-guest-token' } });
    return route.fulfill({ json: {} });
  });
  await prepare(page, 'en');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '2');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  const answers = page.getByRole('button', { name: 'Suggestions & help', exact: true });
  const phrase = page.getByRole('button', { name: 'Use in typed reply: Een koffie met melk, alstublieft.', exact: true });
  await expect(answers).toHaveAttribute('aria-expanded', 'false');
  await expect(phrase).toBeHidden();
  await answers.press('Enter');
  await expect(answers).toHaveAttribute('aria-expanded', 'true');
  await expect(phrase).toBeVisible();
  const revealed = await savedSession(page);
  expect(revealed.supportExposures.filter((exposure: any) => exposure.id.startsWith('exp-suggestion-full_form-'))).toHaveLength(3);
  await expect(page.getByRole('button', { name: 'Listen: Een koffie met melk, alstublieft.', exact: true })).toBeDisabled();
  await phrase.click();
  await expect(page.getByRole('textbox').last()).toHaveValue('Een koffie met melk, alstublieft.');
  expect(actorCalls).toBe(0);
  const draft = await savedSession(page);
  expect(draft.supportExposures.some((exposure: any) => exposure.kind === 'typed_example' && exposure.targetPhraseId === 'phrase.nl-be.koffie_met_melk')).toBe(true);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Prima. Is het voor hier of om mee te nemen?', { exact: true })).toBeVisible();
  await expect(page.getByText('Een koffie met melk, alstublieft.', { exact: true }).first()).toBeVisible();
  expect(actorCalls).toBe(1);
  expect(speechCalls).toBe(0);
  await page.getByRole('button', { name: 'Show translation', exact: true }).click();
  await expect(page.getByText('Okay. Is it for here or to take away?', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Conversation options', exact: true }).click();
  await page.getByRole('button', { name: 'Freeze Scene', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Resume Scene', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Resume Scene', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Suggestions & help', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `docs/design-2026-10-09/conversation-${test.info().project.name}.png` });
  await page.getByRole('button', { name: 'Type instead of speaking', exact: true }).click();
  await page.getByRole('button', { name: 'End conversation', exact: true }).last().click();
  await expect(page).toHaveURL(/recap/);
  const completed = await savedSession(page);
  expect(completed.passages.some((passage: any) => passage.text === 'Een koffie met melk, alstublieft.')).toBe(true);
  expect(completed.sceneState.outcome).toBe('unknown');
});

for (const language of ['fr', 'nl'] as const) test(`320px ${language} useful replies use local labels and translations`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/**', route => {
    if (route.request().url().includes('/realtime/session')) return route.fulfill({ status: 503, json: { error: 'Test realtime unavailable' } });
    return route.fulfill({ json: route.request().url().includes('/guest/identity') ? { token: 'test' } : {} });
  });
  await prepare(page, language);
  const label = language === 'fr' ? 'Suggestions et aide' : 'Suggesties & hulp';
  await page.getByRole('button', { name: label, exact: true }).click();
  if (language === 'fr') await expect(page.getByText('Un café avec du lait, s’il vous plaît.', { exact: true })).toBeVisible();
  else await expect(page.getByText('A coffee with milk, please.', { exact: true })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('replay and phrase listening request the authored female nl-BE voice through the speech adapter', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const speech: any[] = [];
  // Small valid PCM silence exercises browser audio decoding without paid provider calls.
  const wave = Buffer.alloc(4044);
  wave.write('RIFF', 0); wave.writeUInt32LE(4036, 4); wave.write('WAVEfmt ', 8);
  wave.writeUInt32LE(16, 16); wave.writeUInt16LE(1, 20); wave.writeUInt16LE(1, 22);
  wave.writeUInt32LE(16000, 24); wave.writeUInt32LE(32000, 28);
  wave.writeUInt16LE(2, 32); wave.writeUInt16LE(16, 34); wave.write('data', 36); wave.writeUInt32LE(4000, 40);
  await page.route('**/api/**', async route => {
    const url = route.request().url();
    if (url.includes('/realtime/session')) return route.fulfill({ status: 503, json: { error: 'Test realtime unavailable' } });
    if (url.includes('/speech/synthesize')) {
      speech.push(route.request().postDataJSON());
      return route.fulfill({ json: { audio: { provider: 'gemini', base64: wave.toString('base64'), mimeType: 'audio/wav' }, fallback: 'none' } });
    }
    return route.fulfill({ json: url.includes('/guest/identity') ? { token: 'test' } : {} });
  });
  await prepare(page, 'en', true);
  await expect.poll(() => speech.length).toBeGreaterThan(0);
  const replay = page.getByRole('button', { name: 'Listen', exact: true });
  await expect(replay).toBeEnabled();
  await replay.click();
  await expect(replay).toBeEnabled();
  await page.getByRole('button', { name: 'Suggestions & help', exact: true }).click();
  await page.getByRole('button', { name: 'Listen: Een koffie met melk, alstublieft.', exact: true }).click();
  await expect.poll(() => speech.some(request => request.text === 'Een koffie met melk, alstublieft.')).toBe(true);
  expect(speech.every(request => request.locale === 'nl-BE' && request.language === 'nl' && request.voiceGender === 'female')).toBe(true);
  const session = await savedSession(page);
  expect(session.supportExposures.some((exposure: any) => exposure.kind === 'assistant_audio_replay')).toBe(true);
  expect(session.supportExposures.some((exposure: any) => exposure.kind === 'model_phrase_audio' && exposure.targetPhraseId === 'phrase.nl-be.koffie_met_melk')).toBe(true);
  await expect(page.getByRole('button', { name: 'Type instead of speaking', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Help', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'End conversation', exact: true })).toBeVisible();
});
