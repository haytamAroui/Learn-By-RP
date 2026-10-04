import { expect, test, type Page } from '@playwright/test';
import { MISSION_CATALOG } from '../src/data/missions';
import type { SessionRecord } from '../src/types';

/**
 * The mission the briefing snapshot opens.
 *
 * Resolved from the catalog rather than typed into the locator. The card is labelled
 * by `mission.title` (MissionsScreen.tsx:217), and this test used to find it with
 * `/Level A\d/` against text that no longer exists anywhere in `src` - the card now
 * prints the bare `levelRange`, so the locator matched nothing, `toBeVisible` threw,
 * and all six briefing snapshots sat unmaintained behind a test that could not reach
 * its screenshot. Deriving the name from the same catalog the screen renders from is
 * what stops that rotting again.
 */
const CAFE_MISSION = MISSION_CATALOG.find(mission => mission.id === 'mission-es-cafe-sol');
if (!CAFE_MISSION) throw new Error('mission-es-cafe-sol is missing from MISSION_CATALOG');

/** Escapes a mission title for use inside a RegExp. Titles contain `:` and `.`. */
function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
 *
 * Typed as `SessionRecord` on purpose. This object is handed to `page.evaluate` and
 * written straight into IndexedDB, so TypeScript cannot see it, and an out-of-vocabulary
 * value fails silently: `sceneState.outcome` was seeded as `'completed'` — a `taskOutcome`
 * value, not a scene outcome — and Recap correctly refused to claim a scene result it
 * could not establish, rendering "The scene result could not be established." for a
 * session that plainly succeeded. The snapshot recorded that wrong state and the gate
 * went red for a reason that had nothing to do with the screens under test.
 *
 * Scene outcomes and task outcomes are separate vocabularies bridged by
 * `sessionOutcomeFromScene`: achieved -> completed, partial -> partly_completed,
 * not_achieved -> changed_direction. A scene that reached its authored goal is
 * `achieved` here, which is what derives the `completed` task outcome below.
 */
const SEEDED_SESSION: SessionRecord = {
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
    outcome: 'achieved',
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

/**
 * Total height of everything the page wants to show, in CSS pixels.
 *
 * `document.scrollHeight` is useless here: the shell locks `body` to the viewport with
 * `overflow: hidden`, so the document is exactly one viewport tall no matter how much
 * content exists. The real extent lives on the inner scroll container, as
 * `scrollHeight`. Small elements also report `scrollHeight > clientHeight` because
 * `overflow: clip` trims descenders and line boxes, so the height filter keeps those
 * out of the measurement.
 */
async function scrollableContentHeight(page: Page): Promise<number> {
  return page.evaluate(() => {
    let total = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    for (const element of Array.from(document.querySelectorAll('*'))) {
      if (element.scrollHeight <= element.clientHeight + 4) continue;
      if (element.clientHeight <= 40) continue;
      const rect = element.getBoundingClientRect();
      total = Math.max(total, rect.top + window.scrollY + element.scrollHeight);
    }
    return Math.ceil(total);
  });
}

/**
 * Captures the whole screen, not just the first viewport.
 *
 * `fullPage: true` measures the document, and in this app the document never scrolls:
 * `body` is pinned to the viewport and content scrolls inside an inner React Native
 * ScrollView. So `fullPage` silently captured one viewport while reporting full-page
 * coverage. At 1440px, Progress had 1574px of content behind a 930px window, leaving
 * 41% of the screen permanently uncompared - and the 16 baselines that predate the
 * fixed shell are taller than any viewport, which is the same defect showing up as a
 * dimension mismatch.
 *
 * Growing the viewport is the reliable fix, because the shell is viewport-sized by
 * construction: make the window tall enough and nothing is clipped and nothing scrolls,
 * so the ordinary capture sees everything. Width is never changed, so width-based
 * breakpoints and the 2x device scale factor behave exactly as before.
 *
 * The height is capped because the capture is taken at 2x: past roughly 8000 CSS px the
 * image exceeds what the browser will rasterise, and a silently truncated baseline is
 * worse than a loud failure.
 */
async function expectFullScreenScreenshot(page: Page, name: string) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('expected an explicit viewport');

  const contentHeight = await scrollableContentHeight(page);
  const MAX_CAPTURE_HEIGHT = 8_000;
  expect(
    contentHeight,
    `measured content height ${contentHeight}px exceeds the ${MAX_CAPTURE_HEIGHT}px capture limit`
  ).toBeLessThanOrEqual(MAX_CAPTURE_HEIGHT);

  if (contentHeight > viewport.height) {
    await page.setViewportSize({ width: viewport.width, height: contentHeight });
    // The shell re-lays out against the new viewport height; give it a frame before
    // measuring or asserting, or the capture can race the resize.
    await page.waitForTimeout(250);
  }

  try {
    await expectRenderedApp(page);
    await expect(page).toHaveScreenshot(name, { fullPage: true });
  } finally {
    await page.setViewportSize(viewport);
  }
}

for (const viewport of WIDTHS) {
  test.describe(`width ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('talk', async ({ page }) => {
      await seedArchive(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await expectRenderedApp(page);
      await expectFullScreenScreenshot(page, `talk-${viewport.name}.png`);
    });

    test('missions', async ({ page }) => {
      await seedArchive(page);
      await page.goto('/missions');
      await page.waitForLoadState('networkidle');
      await expectRenderedApp(page);

      /*
        Mission discovery must answer what the situation is, what the learner has to
        accomplish, and who they are speaking with.

        These assertions exist because all three were silently dropped once already: the
        row showed `mission.setting`, a description of the place rather than of the task,
        truncated to one line. Nothing failed. A redesign that removed the communicative
        job looked exactly like a redesign that changed some styling, and the only
        symptom was a red gate pointing at a stale baseline.
      */
      const card = page.getByRole('button', {
        name: new RegExp(escapeForRegex(CAFE_MISSION.title)),
      });
      await expect(card).toBeVisible();
      await expect(card).toContainText(CAFE_MISSION.learnerGoal);
      await expect(card).toContainText(CAFE_MISSION.character.name);

      /*
        The goal has to reach assistive technology, not only sighted users.
        `accessibilityLabel` replaces a card's inner text for screen readers, and
        react-native-web discards `accessibilityHint` outright, so an `aria-label` of
        just the title hides the task completely. Asserting the name is what keeps the
        visible copy and the announced copy from drifting apart.
      */
      await expect(card).toHaveAttribute('aria-label', new RegExp(escapeForRegex(CAFE_MISSION.learnerGoal.slice(0, 40))));

      await expectFullScreenScreenshot(page, `missions-${viewport.name}.png`);
    });

    test('progress', async ({ page }) => {
      await seedArchive(page);
      await page.goto('/progress');
      await page.waitForLoadState('networkidle');
      await expectRenderedApp(page);
      await expectFullScreenScreenshot(page, `progress-${viewport.name}.png`);
    });

    test('briefing', async ({ page }) => {
      await seedArchive(page);
      await page.goto('/missions');
      await page.waitForLoadState('networkidle');
      await expectRenderedApp(page);

      /*
        The briefing opens from a mission card, so it is exercised through the same
        affordance a learner uses rather than a route that does not exist.

        Scoped by accessible name and count, not by "first button": navigation is also
        a set of buttons, so `first()` silently changed meaning whenever navigation
        changed - it was clicking a tab, not a mission.

        Matched by regex rather than `exact: true`. The card's accessible name is
        `title. character, role. goal` - it has to carry the communicative job, because
        react-native-web drops `accessibilityHint` and an exact title match would
        therefore be asserting that the task is hidden from assistive technology.
        Titles are unique across the catalogue, so an unanchored match stays unambiguous.

        `click({ force: true })` because the card sits inside a scroll view whose
        container can report a pointer-event interception on web that does not exist
        for a real user.
      */
      const card = page.getByRole('button', {
        name: new RegExp(escapeForRegex(CAFE_MISSION.title)),
      });
      await expect(card).toBeVisible();
      await card.click({ force: true });
      await page.waitForTimeout(800);

      // Confirm the briefing actually opened, so a click that lands somewhere else
      // cannot be recorded as the briefing.
      await expect(page.locator('body')).toContainText(/Briefing|roleplay|scene/i);
      await expectFullScreenScreenshot(page, `briefing-${viewport.name}.png`);
    });

    test('recap', async ({ page }) => {
      await seedArchive(page);
      await page.goto(`/recap/${SEEDED_SESSION.id}`);
      await page.waitForLoadState('networkidle');
      await expectRenderedApp(page);
      // Guards against silently recording the "not in your archive" branch, which
      // looks like a real screen and would make the snapshot worthless.
      await expect(page.locator('body')).toContainText('ordered two drinks');
      /*
        Guards the scene result, which is separate from the summary above.
        
        `toHaveScreenshot` records whatever it is shown, so a scene result the receipt
        could not establish was captured as a baseline for a session that plainly
        succeeded, and the only symptom was a red gate pointing at the wrong screen.
        Asserting the fail-closed copy is absent keeps a malformed scene outcome a test
        failure rather than a picture.
      */
      await expect(page.locator('body')).not.toContainText(
        /scene result could not be established/i
      );
      await expectFullScreenScreenshot(page, `recap-${viewport.name}.png`);
    });

    test('live session', async ({ page }) => {
      await seedArchive(page);
      /*
        The route takes the session id in the path and the mission id as a query
        parameter. This test used to pass `/session/mission-es-cafe-sol`, which put a
        mission id where a session id was expected, so the mission never resolved and
        the snapshot recorded "That mission is no longer available." For months the
        gate protected a dead-end screen and called it the live session.

        The assertion below is what makes that failure mode impossible: a baseline of
        an error screen is worse than no baseline, because it reports green.
      */
      await page.goto(
        `/session/${SEEDED_SESSION.id}?missionId=mission-es-cafe-sol&mode=guided&coldAttempt=true`
      );
      await page.waitForLoadState('networkidle');
      // The voice transport will not connect in CI, so the session is captured in
      // its connecting state. That is a real state worth guarding.
      await page.waitForTimeout(1500);
      await expectRenderedApp(page);
      await expect(page.locator('body')).not.toContainText('no longer available');
      await expectFullScreenScreenshot(page, `live-${viewport.name}.png`);
    });
  });
}