/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/** Getting into the console, staying signed in, and reaching the fixture project. */

import { expect, test, type Locator, type Page } from '@playwright/test';
import { reseedSessionToken, waitForApiConfig } from './cloud-fixtures.js';
import { gotoOrgHome, openProject } from './console-nav.js';
import { dismissStrayDialog } from './journey-envcard.js';
import { PROJECT_REMOVAL_TIMEOUT_MS } from './journey-fixtures.js';
import { activeProject } from './journey-project.js';

/** Parked on config.json first: reseeding writes through the page, so it needs the console's origin. */
export async function refreshSession(page: Page): Promise<void> {
  if (!process.env.E2E_TOKEN_MODE) return;
  await page.goto('/config.json', { waitUntil: 'domcontentloaded' });
  await reseedSessionToken(page);
}

/** Tops the session up without leaving the page: a token expires inside this suite's longest waits. */
export async function reseedHere(page: Page): Promise<void> {
  if (!process.env.E2E_TOKEN_MODE) return;
  const here = page.url();
  await page.goto('/config.json', { waitUntil: 'domcontentloaded' });
  await reseedSessionToken(page);
  await page.goto(here, { waitUntil: 'domcontentloaded' });
}

/** A dead session should say so, not time out on content that will never render. */
export function assertSignedIn(page: Page): void {
  const url = page.url();
  if (/\/gate\/signin|platform-idp/.test(url)) {
    throw new Error(`the console redirected to the IdP sign-in page (${url}) — the session was rejected. In token mode this means the token expired and the reseed did not take.`);
  }
}

export async function enterOrgHome(page: Page, orgHandler: string): Promise<void> {
  await refreshSession(page);
  await page.goto(`/organizations/${orgHandler}/home`, { waitUntil: 'domcontentloaded' });
  assertSignedIn(page);
  await waitForApiConfig(page);
  await gotoOrgHome(page, orgHandler);
}

export async function enterProject(page: Page, orgHandler: string): Promise<void> {
  await enterOrgHome(page, orgHandler);
  await openProject(page, activeProject());
}

/** Narrows the org home to one project: the list pages at ten cards, in no order we control. */
export async function filterToProject(page: Page, name = activeProject()): Promise<void> {
  const search = page.getByPlaceholder('Search projects');
  if (!(await search.isVisible({ timeout: 15_000 }).catch(() => false))) return;
  await search.fill(name);
}

/** Present only on a card that is not being deleted — see ProjectCard in Projects.tsx. */
export function projectDeleteButton(page: Page, name = activeProject()): Locator {
  return page.getByRole('button', { name: `Delete ${name}`, exact: true }).first();
}

/**
 * Opens the delete dialog from the org's project list, the only place a project is deleted from.
 * The button stays disabled while the project holds integrations, so `emptyWithin` bounds the wait for them to go.
 */
export async function openProjectDeleteDialog(page: Page, orgHandler: string, name = activeProject(), emptyWithin = 60_000): Promise<Locator> {
  await enterOrgHome(page, orgHandler);
  await filterToProject(page, name);
  const button = projectDeleteButton(page, name);
  await expect(button, `${name} still holds integrations, so its delete button stayed disabled`).toBeEnabled({ timeout: emptyWithin });
  await button.click();
  const dialog = page.getByRole('dialog').filter({ hasText: 'Are you sure you want to remove the project' });
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  return dialog;
}

/** The dialog asks for the name only once the project is empty. */
export function projectDeleteConfirmField(dialog: Locator): Locator {
  return dialog.getByPlaceholder('Enter project name to confirm');
}

/** Confirms an open delete dialog; throws with the console's reason when the delete is refused. */
export async function confirmProjectDelete(dialog: Locator, name: string): Promise<void> {
  await projectDeleteConfirmField(dialog).fill(name);
  const confirm = dialog.getByRole('button', { name: 'Delete', exact: true });
  await expect(confirm, 'Delete stayed disabled after the name was typed').toBeEnabled({ timeout: 15_000 });
  await confirm.click();
  const rejected = dialog.getByRole('alert').filter({ hasText: /Failed to delete the project/i });
  await Promise.race([dialog.waitFor({ state: 'hidden', timeout: 60_000 }).catch(() => {}), rejected.waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {})]);
  if (await rejected.isVisible().catch(() => false)) throw new Error(`the console rejected the delete: ${(await rejected.textContent())?.trim()}`);
  await expect(dialog, 'the delete dialog neither closed nor reported an error').toBeHidden({ timeout: 30_000 });
}

/** Asked of the page, not remembered: a worker restart resets any flag and would skip every group. */
export async function enterProjectOrSkip(page: Page, orgHandler: string): Promise<void> {
  // Retried: an earlier failure leaves a modal or a lapsed session, and skipping silences every group after.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await dismissStrayDialog(page);
    await enterOrgHome(page, orgHandler);
    await filterToProject(page);
    // Not the card's name: a deleting project keeps its card but is hidden from the switcher.
    if (
      await projectDeleteButton(page)
        .isVisible({ timeout: 15_000 })
        .catch(() => false)
    ) {
      await openProject(page, activeProject());
      return;
    }
    await reseedHere(page);
  }
  test.skip(true, `${activeProject()} was not on the organization home after three attempts — group 01 did not create it, or it is being deleted`);
}

/** Waits out a project left mid-deletion by an earlier run: it can be neither reused nor recreated. */
export async function waitForStaleProjectRemoval(page: Page): Promise<void> {
  if (
    !(await page
      .getByText(activeProject(), { exact: true })
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false))
  )
    return;
  test.info().annotations.push({ type: 'fixture', description: `${activeProject()} was still being deleted; waited for it to disappear` });
  await expect(page.getByText(activeProject(), { exact: true }), `${activeProject()} is stuck mid-deletion on the org home`).toHaveCount(0, { timeout: PROJECT_REMOVAL_TIMEOUT_MS });
}
