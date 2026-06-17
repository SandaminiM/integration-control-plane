import { expect, test } from '@playwright/test';
import { getAuthContext } from '../../helpers/auth-context.js';
import { TopNav } from '../../pages/TopNav';

test.describe('top nav @smoke', () => {
  let orgHandler: string;
  let projectHandler: string;

  test.beforeEach(() => {
    const ctx = getAuthContext();
    orgHandler = ctx.orgHandler;
    if (!ctx.projectHandler) throw new Error('No projectHandler in auth context — re-run setup');
    projectHandler = ctx.projectHandler;
  });

  // -------------------------------------------------------------------------
  // Project picker — navigate to project home from org overview
  // -------------------------------------------------------------------------

  test('project picker caret opens project home', async ({ page }) => {
    await page.goto(`/organizations/${orgHandler}/home`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'All Projects' })).toBeVisible();

    const nav = new TopNav(page);
    await nav.openProjectPicker();
    await nav.selectProject(projectHandler);

    await expect(page).toHaveURL(/\/projects\/[^/]+\/home/);
  });

  // -------------------------------------------------------------------------
  // Sign out
  // -------------------------------------------------------------------------

  test('sign out redirects to login page', async ({ page }) => {
    await page.goto(`/organizations/${orgHandler}/projects/${projectHandler}/home`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/projects\/[^/]+\/home/, { timeout: 30_000 });

    const nav = new TopNav(page);
    await nav.openUserMenu();
    await nav.clickSignOut();

    await expect(page.getByRole('dialog')).toBeVisible();
    await nav.confirmSignOut();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Sign in with Email' })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Org card dropdown — TODO
  // -------------------------------------------------------------------------

  test.skip('org card dropdown opens organization switcher', async () => {
    // TODO: the ▼ caret on the org card opens an org switcher — not yet tested.
  });
});
