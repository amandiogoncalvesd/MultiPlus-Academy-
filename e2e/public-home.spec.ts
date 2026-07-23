import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('public home renders without critical accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#multiplus-portal-root')).toBeVisible();
  const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  expect(results.violations.filter((violation) => violation.impact === 'critical')).toEqual([]);
});

test.describe('isolated staging administrator flow', () => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, 'requires isolated staging administrator credentials');
  test('administrator can reach the operational dashboard in staging', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /aceder|iniciar sessão/i }).click();
    await page.getByLabel(/correio eletrónico/i).fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel(/palavra-passe/i).fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: /aceder|iniciar sessão/i }).click();
    await expect(page.getByText(/command center|visão geral/i)).toBeVisible();
  });
});
