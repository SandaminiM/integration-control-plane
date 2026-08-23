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
