import { expect, test } from '@playwright/test';

const CONSENT_VERSION = '2026-09-30.1';

async function seedArchive(page: any) {
  await page.goto('/');
  await page.evaluate(
    async (consentVersion: string) => {
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

          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      });
    },
    CONSENT_VERSION
  );

  await page.reload();
  await page.waitForLoadState('networkidle');
}

test.describe('Transcript survival across dropped connection mid-turn', () => {
  test('retains user passage in transcript, restores typed text in input box, and recovers', async ({ page }) => {
    await seedArchive(page);

    await page.goto(
      '/session/test-session-drop?missionId=mission-es-cafe-sol&mode=guided&coldAttempt=true'
    );
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open typed input
    const typeButton = page.getByRole('button', { name: /Type instead/i });
    await expect(typeButton).toBeVisible();
    await typeButton.click();

    const inputField = page.getByPlaceholder(/Type your response/i);
    await expect(inputField).toBeVisible();

    const testSentence = 'Un café con leche y un croissant, por favor.';
    await inputField.fill(testSentence);

    // Simulate dropped connection / network cut on the actor response endpoint
    await page.route('**/api/actor/respond', async (route) => {
      await route.abort('failed');
    });

    const sendButton = page.getByRole('button', { name: 'Send' });
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // 1. Verify user's sentence is recorded in the transcript
    const transcriptPassage = page.locator('text="' + testSentence + '"');
    await expect(transcriptPassage).toBeVisible({ timeout: 5000 });

    // 2. Verify sentence returns to the input field so the learner does not lose it
    await expect(inputField).toHaveValue(testSentence);

    // 3. Verify error banner surfaces the non-leaking message and retry button
    const errorBanner = page.getByText(/The connection dropped\. Retrying\./i);
    await expect(errorBanner).toBeVisible();

    const retryButton = page.getByRole('button', { name: /Retry connection/i });
    await expect(retryButton).toBeVisible();

    // 4. Test recovery: unroute and mock successful server response on retry
    await page.unroute('**/api/actor/respond');
    await page.route('**/api/actor/respond', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          replyText: '¡Por supuesto! Enseguida se lo traigo.',
          meaning: 'Of course! I will bring it right away.',
          proposedAction: null,
        }),
      });
    });

    await retryButton.click();

    // 5. Verify the assistant's reply arrives and joins the transcript
    const assistantReply = page.locator('text="¡Por supuesto! Enseguida se lo traigo."');
    await expect(assistantReply).toBeVisible({ timeout: 5000 });

    // 6. Verify user's sentence is STILL in the transcript (transcript survived!)
    await expect(transcriptPassage).toBeVisible();

    // 7. Verify the input field is now cleared after successful delivery
    await expect(inputField).toHaveValue('');

    // 8. Verify the error banner is gone
    await expect(errorBanner).not.toBeVisible();
  });
});
