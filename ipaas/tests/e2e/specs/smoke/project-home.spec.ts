import { expect, test } from '@playwright/test';
import { getAuthContext } from '../../helpers/auth-context.js';

test.describe('project home @smoke', () => {
  let orgHandler: string;
  let projectHandler: string;

  test.beforeEach(async ({ page }) => {
    const ctx = getAuthContext();
    orgHandler = ctx.orgHandler;
    if (!ctx.projectHandler) throw new Error('No projectHandler in auth context — re-run setup');
    projectHandler = ctx.projectHandler;

    await page.goto(`/organizations/${orgHandler}/projects/${projectHandler}/home`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/projects\/[^/]+\/home/, { timeout: 30_000 });
  });

  // -------------------------------------------------------------------------
  // Page loads
  // -------------------------------------------------------------------------

  test('project home page loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/organizations\/[^/]+\/projects\/[^/]+\/home/);
  });

  // -------------------------------------------------------------------------
  // Top nav breadcrumb
  // -------------------------------------------------------------------------

  test('top nav shows organization and project breadcrumbs', async ({ page }) => {
    await expect(page.getByRole('combobox', { name: 'Select organization' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Select project' })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Page content
  // -------------------------------------------------------------------------

  test('Create an Integration card is visible', async ({ page }) => {
    await expect(page.getByText('Create an Integration')).toBeVisible({ timeout: 30_000 });
  });

  test('Import an Integration card is visible', async ({ page }) => {
    await expect(page.getByText('Import an Integration')).toBeVisible({ timeout: 30_000 });
  });

  test('Get Started Quickly panel shows Prebuilt Integrations and Samples tabs', async ({ page }) => {
    await expect(page.getByText('Get Started Quickly')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('tab', { name: 'Prebuilt Integrations' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Samples' })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Create integration flow — TODO
  // -------------------------------------------------------------------------

  test.skip('clicking Create an Integration opens the editor', async () => {
    // TODO: "Create an Integration" now opens the Cloud Editor instead of navigating
    // to /components/new — re-enable once the navigation flow is finalized.
  });
});
