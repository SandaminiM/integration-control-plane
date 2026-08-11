import { expect, test } from '@playwright/test';
import { getAuthContext } from '../../helpers/auth-context.js';

/**
 * Verifies that a project with no integrations shows the empty project home view
 * at /organizations/:org/projects/default/home.
 *
 * The `default` project is provisioned during onboarding with no integrations,
 * so it reliably exercises the isEmpty === true branch of the Project page.
 */
test.describe('empty project home @smoke', () => {
  let orgHandler: string;

  test.beforeEach(async ({ page }) => {
    orgHandler = getAuthContext().orgHandler;
    await page.goto(`/organizations/${orgHandler}/projects/default/home`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/projects\/default\/home/, { timeout: 30_000 });
    // Fail fast with a clear signal if the session died and we got bounced to login,
    // instead of letting downstream assertions time out on a page that was never reached.
    await expect(page.getByRole('heading', { name: 'Sign In' })).not.toBeVisible();
  });

  test('URL resolves to the default project home', async ({ page }) => {
    await expect(page).toHaveURL(/\/organizations\/[^/]+\/projects\/default\/home/);
  });

  test('shows the Create an Integration card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create an Integration' })).toBeVisible({ timeout: 30_000 });
  });

  test('shows the Import an Integration card', async ({ page }) => {
    await expect(page.getByText('Import an Integration')).toBeVisible({ timeout: 30_000 });
  });

  test('shows the Get Started Quickly panel with Prebuilt Integrations and Samples tabs', async ({ page }) => {
    await expect(page.getByText('Get Started Quickly')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('tab', { name: 'Prebuilt Integrations' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Samples' })).toBeVisible();
  });

  test('does not show the integrations table', async ({ page }) => {
    // Wait for the page to finish loading so we can be confident the table is absent
    await page.getByRole('heading', { name: 'Create an Integration' }).waitFor({ timeout: 30_000 });
    await expect(page.getByRole('table')).not.toBeVisible();
  });
});
