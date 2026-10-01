import { expect, test, type Page } from '@playwright/test';

const CONSENT_VERSION = '2026-09-30.1';
const SESSION_ID = 'session-mobile-v3-smoke';

const SEEDED_SESSION = {
  id: SESSION_ID,
  missionId: 'mission-es-cafe-sol',
  missionVersion: 1,
  language: 'es',
  mode: 'guided',
  coldAttempt: true,
  state: 'recap_ready',
  startedAt: '2026-10-01T10:00:00.000Z',
  endedAt: '2026-10-01T10:04:00.000Z',
  endReason: 'completed',
  passages: [
    {
      id: 'passage-smoke-user',
      sessionId: SESSION_ID,
      attemptId: 'attempt-1',
      speaker: 'user',
      revisionKey: 'rev-1',
      assemblyVersion: 1,
      status: 'final',
      text: 'Un café con leche, por favor.',
      meaning: 'A coffee with milk, please.',
      modality: 'typed',
      startedAt: '2026-10-01T10:01:00.000Z',
      endedAt: '2026-10-01T10:01:03.000Z',
      fragments: [],
    },
    {
      id: 'passage-smoke-assistant',
      sessionId: SESSION_ID,
      attemptId: 'attempt-1',
      speaker: 'assistant',
      revisionKey: 'rev-1',
      assemblyVersion: 1,
      status: 'final',
      text: 'Perfecto. ¿Para aquí o para llevar?',
      meaning: 'Perfect. For here or to go?',
      modality: 'typed',
      startedAt: '2026-10-01T10:01:05.000Z',
      endedAt: '2026-10-01T10:01:08.000Z',
      fragments: [],
    },
  ],
  supportExposures: [],
  observations: [],
  skillObservations: [],
  skillLapses: [],
  taskOutcome: 'completed',
  sceneState: {
    sceneId: 'mission-es-cafe-sol',
    revision: 1,
    facts: {},
    learnerKnows: [],
    characterKnows: [],
    checkpoints: [],
    isFinished: true,
    outcome: 'achieved',
  },
  summary: 'You ordered a coffee and answered the follow-up.',
  actionableFeedback: ['Keep practising the takeaway request in a new situation.'],
};

async function seedArchive(page: Page) {
  await page.goto('/');

  await page.evaluate(
    async ([consentVersion, session]) => {
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
                audioPlaybackEnabled: false,
                autoPlaySpeech: false,
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

          tx.objectStore('sessions').put(session, session.id);

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

  await page.reload();
  await page.waitForLoadState('networkidle');
}

async function expectMobileScreen(page: Page, expected: RegExp) {
  await expect(page.locator('body')).toContainText(expected, { timeout: 20_000 });

  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));

  expect(metrics.viewport).toBe(390);
  expect(metrics.documentWidth).toBeLessThanOrEqual(391);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(391);
}

test.describe('mobile-first v3 smoke at 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Talk → Missions → Briefing → Live → Recap → Progress all render without horizontal overflow', async ({
    page,
  }) => {
    await seedArchive(page);

    await page.goto('/');
    await expectMobileScreen(page, /LearnByRP/i);

    await page.goto('/missions');
    await expectMobileScreen(page, /Missions/i);

    await page.goto('/mission/mission-es-cafe-sol');
    await expectMobileScreen(page, /Café Sol: Breakfast Before the Train/i);
    await expect(page.getByRole('button', { name: /Start/i })).toBeVisible();

    await page.goto(
      `/session/${SESSION_ID}?missionId=mission-es-cafe-sol&mode=guided&coldAttempt=true`
    );
    await expectMobileScreen(page, /Mateo/i);
    await expect(page.locator('body')).not.toContainText('no longer available');

    await page.goto(`/recap/${SESSION_ID}`);
    await expectMobileScreen(page, /ordered a coffee/i);

    await page.goto('/progress');
    await expectMobileScreen(page, /Skills|Phrases|History/i);
  });
});
