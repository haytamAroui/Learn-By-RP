import { defineConfig, devices } from '@playwright/test';

/**
 * Visual regression gate.
 *
 * The requirement is 6 screens x 3 widths x 2 themes = 36 snapshots, small
 * enough to actually run on every change. The previous proposal was 1,120
 * screenshots per PR, which is the same as not having a gate.
 *
 * Runs against a static export rather than the dev server, so what is captured is
 * what would ship. The web build is the only platform that can be compared
 * automatically; native is covered by device QA.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  expect: {
    // Small, deliberate diffs only. A layout shift is a change worth seeing.
    toHaveScreenshot: {
      /*
        Tight on purpose.
        At 0.01 a 780x1688 baseline tolerates ~13,000 differing pixels, and a full
        page has plenty of room to absorb them. Rewriting all three Progress tab
        labels to short forms changed less than that and the gate passed with the
        old labels still on screen. A tolerance is only useful for noise; anything
        larger stops the gate from seeing real changes.
      */
      maxDiffPixelRatio: 0.002,
      threshold: 0.1,
      animations: 'disabled',
      caret: 'hide',
      /*
        `toHaveScreenshot` defaults to `scale: 'css'`, which captures one pixel per
        CSS pixel and silently discards deviceScaleFactor. Set to 'device' or the 2x
        below has no effect at all.
      */
      scale: 'device',
    },
  },

  use: {
    baseURL: 'http://127.0.0.1:4321',
    // Deterministic output: no locale drift, no timezone drift, stable fonts.
    locale: 'en-GB',
    timezoneId: 'UTC',
    colorScheme: 'light',
  },

  /*
    Captured at 2x.

    At 1x a lucide icon is a 2px stroke, and a 390px-wide page scaled down for
    review renders it as almost nothing. That is not a cosmetic concern: it means a
    broken icon can look identical to a working one, in the baseline and in review.
    A whole session was spent chasing an "invisible" nav bar that was in fact fine,
    because the evidence being looked at was too coarse to tell.
  */
  projects: [
    {
      name: 'light',
      use: { ...devices['Desktop Chrome'], colorScheme: 'light', deviceScaleFactor: 2 },
    },
    {
      name: 'dark',
      use: { ...devices['Desktop Chrome'], colorScheme: 'dark', deviceScaleFactor: 2 },
    },
  ],

  webServer: {
    // `--single` is required. A static Expo export has no server-side routes, so
    // without SPA fallback a full page load of /missions returns 404. Without this
    // flag the snapshots would be pictures of the not-found screen, recorded as if
    // they were the app.
    command: 'npx serve web-build -l 4321 --single --no-clipboard',
    url: 'http://127.0.0.1:4321',
    /*
      Always start a fresh server. Reusing one let a stale `serve` process answer
      with cached assets, so a real UI change was compared against the baseline that
      had been captured from those same stale assets, matched byte for byte, and
      reported as passing. A gate that cannot fail is worse than no gate.
    */
    reuseExistingServer: false,
    timeout: 120_000,
  },
});