import { expect, test } from '@playwright/test';
import { TRANSLATIONS } from '../src/features/i18n/translations';

test('reference styling reaches onboarding, program, settings, privacy, phrase detail, and recovery', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/**', route => route.fulfill({ json: route.request().url().includes('/guest/identity') ? { token: 'test' } : {} }));
  await page.goto('/onboarding');
  await expect(page.getByRole('button', { name: 'Show my learning path', exact: true })).toBeVisible();
  await page.screenshot({ path: `docs/design-2026-10-09/lingo-onboarding-${test.info().project.name}.png` });
  await page.getByRole('button', { name: 'Show my learning path', exact: true }).click();
  await expect(page).toHaveURL(/program\//);
  await expect(page.getByRole('button', { name: 'Koffiebar: Ontbijt onderweg', exact: true })).toBeVisible();
  await page.screenshot({ path: `docs/design-2026-10-09/lingo-program-${test.info().project.name}.png` });

  await page.getByRole('button', { name: 'Koffiebar: Ontbijt onderweg', exact: true }).click();
  await expect(page).toHaveURL(/mission\/mission-nl-be-koffiebar/);
  for (const [route, visible] of [['/settings', TRANSLATIONS.en.settings.title], ['/settings/privacy', TRANSLATIONS.en.settings.privacyTitle]] as const) {
    await page.goto(route);
    await expect(page.getByText(visible, { exact: true }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `docs/design-2026-10-09/lingo-${route.replaceAll('/', '-')}-${test.info().project.name}.png` });
  }
  await page.goto('/phrase/phrase.nl-be.koffie_met_melk');
  await expect(page.getByText('Target phrase', { exact: true })).toBeVisible();
  await expect(page.getByText('"Een koffie met melk, alstublieft."', { exact: true })).toBeVisible();
  await page.screenshot({ path: `docs/design-2026-10-09/lingo-phrase-${test.info().project.name}.png` });
  await page.goto('/recovery');
  await expect(page.getByText('Nothing was left unfinished.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeVisible();
  await page.goto('/');
  await expect(page.getByText('Quick practice', { exact: true })).toBeVisible();
  await expect(page.locator('#learnbyrp-reference-fonts')).toHaveAttribute('href', /Bricolage/);
  await expect(page.getByText('Ready for today?', { exact: true })).toHaveCSS('font-family', /Bricolage Grotesque/);
});
