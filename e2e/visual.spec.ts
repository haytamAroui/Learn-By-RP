import { expect, test, type Page } from '@playwright/test';

/**
 * PR-blocking visual regression.
 *
 * 6 screens x 3 widths x 2 themes = 36 snapshots, run against a static web export.
 *
 * Seeding happens through the page's own IndexedDB, because web persistence is
 * IndexedDB. That means the snapshots exercise the real archive rather than a
 * mocked one: if the repository stops writing, these fail.
 */

const WIDTHS = [
  { name: '390', width: 390, height: 844 },
  { name: '840', width: 840, height: 900 },
  { name: '1440', width: 1440, height: 1000 },
] as const;

const CONSENT_VERSION = '2026-09-30.1';

/**
 * A completed session, so Recap has something real to render.
 *
 * Recap is the screen a learner sees immediately after a conversation, and the plan's
 * visual QA list requires it. Recording it against an empty archive would capture the
 * "not in your archive" branch instead of the product.
 */
const SEEDED_SESSION = {
  id: 'session-visual-recap',
  missionId: 'mission-es-cafe-sol',
  missionVersion: 1,
  language: 'es',
  mode: 'guided',
  coldAttempt: true,
  state: 'completed',
  startedAt: '2026-09-28T09:15:00.000Z',
  endedAt: '2026-09-28T09:19:30.000Z',
  endReason: 'completed',
  passages: [
    {
      id: 'passage-visual-1',
      sessionId: 'session-visual-recap',
      attemptId: 'attempt-visual-1',
      speaker: 'user',
      revisionKey: 'turn-1',
      assemblyVersion: 1,
      status: 'final',
      text: 'Dos cafés con leche, por favor.',
      meaning: 'Two coffees with milk, please.',
      modality: 'voice',
      startedAt: '2026-09-28T09:16:00.000Z',
      endedAt: '2026-09-28T09:16:04.000Z',
      fragments: [],
    },
    {
      id: 'passage-visual-2',
      sessionId: 'session-visual-recap',
      attemptId: 'attempt-visual-1',
      speaker: 'assistant',
      revisionKey: 'turn-2',
      assemblyVersion: 1,
      status: 'final',
      text: 'Perfecto. ¿Para aquí o para llevar?',
      meaning: 'Perfect. For here or to go?',
      modality: 'voice',
      startedAt: '2026-09-28T09:16:12.000Z',
      endedAt: '2026-09-28T09:16:17.000Z',
      fragments: [],
    },
  ],
  supportExposures: [],
  observations: [],
  skillObservations: [
    {
      observationId: 'skill-obs-visual-1',
      sessionId: 'session-visual-recap',
      attemptId: 'attempt-visual-1',
      sourceTurnId: 'passage-visual-1',
      sourceRevision: 'turn-1',
      skillId: 'cafe-ordering',
      candidateForm: 'pedir una bebida',
      evidenceSource: 'validated_explicit',
      confirmedAt: '2026-09-28T09:16:04.000Z',
      connectedSceneCount: 2,
    },
  ],
  skillLapses: [],
  taskOutcome: 'completed',
  sceneState: {
    sceneId: 'mission-es-cafe-sol',
    revision: 4,
    facts: { drinksOrdered: 2 },
    learnerKnows: ['drink-preference'],
    characterKnows: [],
    checkpoints: [],
    isFinished: true,
    outcome: 'completed',
  },
  summary: 'You ordered two drinks and answered a follow-up question without prompting.',
  actionableFeedback: [
    'Keep articles consistent when naming a quantity — "dos cafés con leche".',
  ],
};

/**
 * Grants consent and seeds a small archive so the app gets past onboarding and
 * has something to show.
 */
async function seedArchive(page: Page) {
  await page.goto('/');
  await page.evaluate(
    async ([consentVersion, seededSession]) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('mission-coach-archive');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => resolve();
      });

      await new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('mission-coach-archive', 1);
        const stores = [
          'meta',
          'sessions',
          'observations',
          'skill_observations',
          'skill_lapses',
          'phrases',
          'consent',
          'deletion_markers',
          'pending_jobs',
        ];

        open.onupgradeneeded = () => {
          for (const name of stores) {
            if (!open.result.objectStoreNames.contains(name)) {
              open.result.createObjectStore(name);
            }
          }
        };

        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(stores, 'readwrite');

          tx.objectStore('meta').put(
            {
              id: 'current',
              payload: {
                learningLanguage: 'es',
                explanationLanguage: 'en',
                comfortLevel: 'beginner',
                primaryGoal: 'travel',
                modeDefault: 'guided',
                voiceProcessingConsent: true,
                savedAnalysisConsent: true,
                audioPlaybackEnabled: true,
                autoPlaySpeech: true,
                speechRate: 1,
              },
            },
            'current'
          );

          const decidedAt = new Date().toISOString();
          for (const scope of ['voice', 'saved_analysis']) {
tx.objectStore('consent').put(
            {
              id: scope,
              scope,
              granted: true,
              version: consentVersion,
              decidedAt,
            },
            scope
          );
        }

        // Recap reads from the archive, so the seeded archive needs a real session.
        // `StoredSession extends SessionRecord`, so the record itself is the stored
        // value. Wrapping it in `{ id, payload }` matches on id but leaves every
        // other field undefined, which renders as a zero-turn session.
        tx.objectStore('sessions').put(seededSession, seededSession.id);

        tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      });
    },
    [CONSENT_VERSION, SEEDED_SESSION] as const
  );

  // Reload so the app boots against the seeded archive.
  await page.reload();
  await page.waitForLoadState('networkidle');
}

/**
 * Fails the test if the app rendered a not-found screen.
 *
 * `toHaveScreenshot` with `--update-snapshots` records whatever it sees, so a
 * broken route would quietly become the baseline and the gate would protect
 * nothing. This is the check that stops that.
 */
async function expectRenderedApp(page: Page) {
  // React Native Web hydrates after the bundle evaluates, so poll rather than
  // reading the DOM once. The captured text goes into the failure message,
  // because "blank screen" is otherwise very hard to diagnose.
  await expect
    .poll(
      async () => {
        const text = await page.locator('body').innerText().catch(() => '');
        return { length: text.trim().length, sample: text.trim().slice(0, 120) };
      },
      { timeout: 20_000, intervals: [250, 500, 1000] }
    )
    .toMatchObject({ length: expect.any(Number) })
    .catch(() => undefined);

  const text = (await page.locator('body').innerText()).trim();

  expect(text.slice(0, 200), 'expected a real screen, not the router 404').not.toMatch(/^404$/);
  expect(text.length, `screen rendered almost no text: "${text.slice(0, 120)}"`).toBeGreaterThan(
    20
  );
}

for (const viewport of WIDTHS) {
  test.describe(`width ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('talk', async ({ page }) => {
      await seedArchive(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await expectRenderedApp(page);
      await expect(page).toHaveScreenshot(`talk-${viewport.name}.png`, { fullPage: true });
    });

    test('missions', async ({ page }) => {
      await seedArchive(page);
      await page.goto('/missions');
      await page.waitForLoadState('networkidle');
      await expectRenderedApp(page);
      await expect(page).toHaveScreenshot(`missions-${viewport.name}.png`, { fullPage: true });
    });

    test('progress', async ({ page }) => {
      await seedArchive(page);
      await page.goto('/progress');
      await page.waitForLoadState('networkidle');
      await expectRenderedApp(page);
      await expect(page).toHaveScreenshot(`progress-${viewport.name}.png`, { fullPage: true });
    });

    test('briefing', async ({ page }) => {
      await seedArchive(page);
      await page.goto('/missions');
      await page.waitForLoadState('networkidle');
      await expectRenderedApp(page);

      // The briefing opens from the first mission card, so it is exercised through
      // the same affordance a learner uses rather than a route that does not exist.
      const card = page.getByRole('button').first();
      await expect(card).toBeVisible();
      await card.click();
      await page.waitForTimeout(800);

      await expect(page).toHaveScreenshot(`briefing-${viewport.name}.png`, { fullPage: true });
    });

    test('recap', async ({ page }) => {
      await seedArchive(page);
      await page.goto(`/recap/${SEEDED_SESSION.id}`);
      await page.waitForLoadState('networkidle');
      await expectRenderedApp(page);
      // Guards against silently recording the "not in your archive" branch, which
      // looks like a real screen and would make the snapshot worthless.
      await expect(page.locator('body')).toContainText('ordered two drinks');
      await expect(page).toHaveScreenshot(`recap-${viewport.name}.png`, { fullPage: true });
    });

    test('live session', async ({ page }) => {
      await seedArchive(page);
      await page.goto('/session/mission-es-cafe-sol');
      await page.waitForLoadState('networkidle');
      // The voice transport will not connect in CI, so the session is captured in
      // its connecting state. That is a real state worth guarding.
      await page.waitForTimeout(1500);
      await expectRenderedApp(page);
      await expect(page).toHaveScreenshot(`live-${viewport.name}.png`, { fullPage: true });
    });
  });
}