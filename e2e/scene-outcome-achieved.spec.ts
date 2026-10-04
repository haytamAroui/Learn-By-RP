/**
 * Scene outcome separation, positive path (Phase 1G).
 *
 * The other session tests prove the scene is not credited when nothing achieved
 * it. This proves the converse: that a learner who really does carry the authored
 * scene to its goal gets that result recorded, and that the result comes from the
 * reducer rather than from finishing the session.
 *
 * The scene endpoints are answered with the real `reduceSceneAction`, so the
 * preconditions, the payload schemas and the completion predicates under test are
 * the authored ones. Only the model is mocked, because what the character says is
 * a provider's decision; what the world then records is not.
 */

import { expect, test } from '@playwright/test';
import { MISSION_CATALOG } from '../src/data/missions';
import { getScene } from '../src/content/scenes';
import {
  applyResult,
  createInitialScene,
  reduceSceneAction,
} from '../src/features/roleplay/runtime';
import type { SceneStateSnapshot } from '../src/contracts/scene';

const CONSENT_VERSION = '2026-09-30.1';
const MISSION_ID = 'mission-nl-be-apotheek';

/**
 * The pharmacy scene reaches `achieved` through four turns, one of them the
 * Director's own offer. Kept as data so the test reads as the scene does.
 */
const ACHIEVING_TURNS: Array<{ learner: string; action: string; payload?: Record<string, unknown> }> = [
  { learner: 'Waar staat de waarschuwing op de verpakking?', action: 'ask_specification', payload: { topic: 'waarschuwing' } },
  { learner: 'Kunnen we een andere verpakking vergelijken?', action: 'request_substitute', payload: {} },
  { learner: 'En welke verpakking kan ik daarvoor nemen?', action: 'offer_substitute', payload: { alternative: 'een tweede verpakking' } },
  { learner: 'Ja, laten we die verpakking bekijken.', action: 'confirm_selection', payload: { selection: 'de tweede verpakking' } },
];

interface Harness {
  states: Map<string, SceneStateSnapshot>;
  turnIndex: number;
  /** Typed entry is a toggle; clicking it per turn would switch it back off. */
  typedEntryEnabled: boolean;
}

async function mountMission(
  page: import('@playwright/test').Page,
  harness: Harness,
  turns: typeof ACHIEVING_TURNS,
  { savedAnalysis }: { savedAnalysis: boolean }
): Promise<void> {
  const mission = MISSION_CATALOG.find(candidate => candidate.id === MISSION_ID)!;
  const scene = getScene(mission.sceneId!)!;

  await page.route('**/v1/voice/**', async route => {
    const url = route.request().url();
    const method = route.request().method();
    const body = method === 'POST' ? route.request().postDataJSON() : {};
    const sessionId = url.includes('/sessions/') ? url.split('/sessions/')[1].split('/')[0] : body.sessionId;

    if (url.endsWith('/sessions')) {
      const state = harness.states.get(sessionId) ?? createInitialScene(scene, sessionId, body.attemptId);
      harness.states.set(sessionId, state);
      return route.fulfill({ json: { state } });
    }

    if (url.endsWith('/scene/action')) {
      const current = harness.states.get(sessionId) ?? createInitialScene(scene, sessionId, body.attemptId);
      const result = reduceSceneAction({ scene, state: current, proposal: body });
      if (result.accepted) harness.states.set(sessionId, applyResult(scene, current, result));
      return route.fulfill({ json: { result } });
    }

    if (url.endsWith('/scene')) {
      return route.fulfill({ json: { state: harness.states.get(sessionId) ?? null } });
    }

    return route.fulfill({ json: {} });
  });

  await page.route('**/api/**', async route => {
    const url = route.request().url();
    if (url.includes('/api/guest/identity')) {
      return route.fulfill({ json: { token: 'test-guest-token' } });
    }
    if (url.includes('/actor/respond')) {
      // One authored action per learner turn, in order. Past the end of the
      // script the actor simply answers, so an extra turn cannot manufacture a
      // result that the script did not earn.
      const turn = turns[harness.turnIndex];
      harness.turnIndex += 1;
      if (!turn) {
        return route.fulfill({
          json: { replyText: 'Zo ziet het eruit.', meaning: 'That is how it looks.', proposedAction: null },
        });
      }
      return route.fulfill({
        json: {
          replyText: 'Zeker, ga je gang.',
          meaning: 'Of course, go ahead.',
          proposedAction: { name: turn.action, payload: turn.payload ?? {} },
        },
      });
    }
    return route.fulfill({ json: {} });
  });

  await page.goto('/');
  await page.evaluate(
    async ([consentVersion, consent]) => {
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

      const analysisGranted = consent.savedAnalysis;
      const tx = db.transaction(['meta', 'consent'], 'readwrite');
      tx.objectStore('meta').put(
        {
          id: 'current',
          payload: {
            learningLanguage: 'nl-BE', explanationLanguage: 'en', comfortLevel: 'beginner',
            primaryGoal: 'everyday', modeDefault: 'guided', voiceProcessingConsent: false,
            savedAnalysisConsent: analysisGranted, audioPlaybackEnabled: false, autoPlaySpeech: false,
            speechRate: 1,
          },
        },
        'current'
      );
      const now = new Date().toISOString();
      for (const scope of ['voice', 'saved_analysis']) {
        tx.objectStore('consent').put(
          { id: scope, scope, granted: analysisGranted && scope === 'saved_analysis', version: consentVersion, decidedAt: now },
          scope
        );
      }
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    },
    [CONSENT_VERSION, { savedAnalysis }] as const
  );

  await page.reload();
  await page.goto(`/mission/${MISSION_ID}`);
  await page.getByRole('button', { name: /Start Mission Now/i }).click();
  await expect(page).toHaveURL(/session\//);
}

async function ensureTypedInput(page: import('@playwright/test').Page, harness: Harness): Promise<void> {
  if (harness.typedEntryEnabled) return;

  // Typed entry is often already on, because a session without voice consent
  // shows it automatically. Clicking in that state switches it back off, so the
  // control is given a moment to appear before the test decides anything.
  const input = page.getByRole('textbox').last();
  const alreadyAvailable = await input
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  if (!alreadyAvailable) {
    await page.getByRole('button', { name: /Type instead/i }).click();
    await expect(input).toBeVisible();
  }

  harness.typedEntryEnabled = true;
}

async function typeAndSend(page: import('@playwright/test').Page, text: string): Promise<void> {
  const input = page.getByRole('textbox').last();
  await input.scrollIntoViewIfNeeded();
  await input.fill(text);
  const send = page.getByRole('button', { name: 'Send', exact: true });
  await send.scrollIntoViewIfNeeded();
  await send.click();
  // Wait for the actor turn to land, so the next typed turn cannot overtake it.
  await expect(page.locator('body')).toContainText(text);
  await page.waitForTimeout(150);
}

async function readSession(page: import('@playwright/test').Page, sessionId: string) {
  return page.evaluate(async id => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mission-coach-archive', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const read = (store: string) =>
      new Promise<any>((resolve, reject) => {
        const request = db.transaction(store).objectStore(store).get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    const count = (store: string) =>
      new Promise<number>((resolve, reject) => {
        const request = db.transaction(store).objectStore(store).count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    const session = await read('sessions');
    const observations = await count('skill_observations');
    const lapses = await count('skill_lapses');
    db.close();
    return { session, observations, lapses };
  }, sessionId);
}

test('a learner who carries the authored scene to its goal gets that result recorded', async ({ page }) => {
  const harness: Harness = { states: new Map(), turnIndex: 0, typedEntryEnabled: false };
  await mountMission(page, harness, ACHIEVING_TURNS, { savedAnalysis: true });
  await ensureTypedInput(page, harness);

  for (const turn of ACHIEVING_TURNS) {
    await typeAndSend(page, turn.learner);
  }

  // The scene is finished, so the live screen offers its stopping point.
  const end = page.getByRole('button', { name: /End conversation/i }).last();
  await end.scrollIntoViewIfNeeded();
  await end.click();
  await expect(page).toHaveURL(/\/recap\/session-/);

  const sessionId = new URL(page.url()).pathname.split('/').at(-1)!;
  const { session, observations, lapses } = await readSession(page, sessionId);

  expect(session.sceneState.outcome).toBe('achieved');
  expect(session.sceneState.isFinished).toBe(true);
  expect(
    session.sceneState.checkpoints.map((checkpoint: any) => checkpoint.id)
  ).toContain('cp-nl-be-pharmacy-info');

  // The learner-facing receipt says the goal was met, in the learner's language
  // setting rather than in a value from the database.
  await expect(page.locator('body')).toContainText('The authored scene goal was achieved.');
});

test('an unfinished scene that is ended anyway is reported as partial, not achieved', async ({ page }) => {
  const harness: Harness = { states: new Map(), turnIndex: 0, typedEntryEnabled: false };
  // Stop after the first two turns: the reducer has facts for a partial result
  // and nothing for an achieved one.
  const partialTurns = ACHIEVING_TURNS.slice(0, 2);
  await mountMission(page, harness, partialTurns, { savedAnalysis: false });
  await ensureTypedInput(page, harness);

  for (const turn of partialTurns) {
    await typeAndSend(page, turn.learner);
  }

  const end = page.getByRole('button', { name: /End conversation/i }).last();
  await end.scrollIntoViewIfNeeded();
  await end.click();
  await expect(page).toHaveURL(/\/recap\/session-/);

  const sessionId = new URL(page.url()).pathname.split('/').at(-1)!;
  const { session, observations, lapses } = await readSession(page, sessionId);

  expect(session.sceneState.outcome).toBe('partial');
  // The full sentences, because the partial copy contains the achieved copy as a
  // substring and a looser match would pass on the wrong result.
  await expect(page.locator('body')).not.toContainText('The authored scene goal was achieved.');
  await expect(page.locator('body')).toContainText('Part of the authored scene goal was achieved.');

  // Scene result and language evidence are separate facts: a partial world with
  // no analysis consent yields neither progress nor a weakness signal.
  expect(observations).toBe(0);
  expect(lapses).toBe(0);
});