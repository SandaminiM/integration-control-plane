import { expect, test as setup } from '@playwright/test';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { waitForOTP } from './helpers/gmail.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, '../../.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');
const CONTEXT_FILE = path.join(AUTH_DIR, 'context.json');

await mkdir(AUTH_DIR, { recursive: true });

// The full flow involves multiple cross-domain redirects. Allow extra time for slow staging servers.
setup.setTimeout(180_000);

setup('authenticate', async ({ page }) => {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!username) {
    throw new Error('E2E_USERNAME must be set');
  }

  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.getByRole('button', { name: 'Sign in with Email' })).toBeVisible();

  // Record time before triggering sign-in so we only read OTPs that arrive after this point.
  const beforeSignIn = Date.now();

  // Wait until we reach WSO2 Identity Platform — its URL also contains "/login" so we can't match on pathname.
  await Promise.all([
    page.waitForURL((url) => url.hostname.includes('asgardeo.io'), {
      timeout: 30_000,
      waitUntil: 'domcontentloaded',
    }),
    page.getByRole('button', { name: 'Sign in with Email' }).click(),
  ]);

  // WSO2 Identity Platform identifier-first flow: enter email → Continue
  await page.getByPlaceholder('Enter your email').waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByPlaceholder('Enter your email').fill(username);
  await page.getByRole('button', { name: 'Continue' }).click();

  // After Continue, WSO2 Identity Platform either navigates to email_otp.do or stays on login.do with a password field.
  // We cannot use url.includes('login.do') as a condition — it resolves immediately since we're already there.
  const wentToOTP = await page
    .waitForURL((url) => url.pathname.includes('email_otp'), {
      timeout: 10_000,
      waitUntil: 'domcontentloaded',
    })
    .then(() => true)
    .catch(() => false);

  if (wentToOTP) {
    const otp = await waitForOTP({
      subjectPattern: /email OTP|one.time passcode|verification|otp/i,
      afterMs: beforeSignIn,
      timeoutMs: 30_000,
    });
    await page.getByRole('textbox').fill(otp);
    await page.getByRole('button', { name: 'Continue' }).click();
  } else {
    // Password screen
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 15_000 });
    await passwordInput.fill(password);
    await page.locator('#loginButton, button[type="submit"], input[type="submit"]').first().click();
  }

  // WSO2 Identity Platform → app /signin callback → org page.
  // New users land on /account-register first; existing users go straight to /organizations/...
  await page.waitForURL(/account-register|\/organizations\/[^/]+/, {
    timeout: 90_000,
    waitUntil: 'domcontentloaded',
  });

  if (page.url().includes('/account-register')) {
    const orgName = `e2e-org-${Date.now()}`;
    await page.getByLabel('Organization Name').fill(orgName);

    await expect(page.getByRole('button', { name: 'Create Organization' })).toBeEnabled({
      timeout: 10_000,
    });

    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Create Organization' }).click();

    await page.waitForURL(/\/organizations\/[^/]+/, {
      timeout: 30_000,
      waitUntil: 'domcontentloaded',
    });
  }

  // Extract handlers from the post-login URL before navigating away.
  const orgMatch = page.url().match(/\/organizations\/([^/]+)/);
  const projectMatch = page.url().match(/\/projects\/([^/]+)/);
  if (!orgMatch) throw new Error(`Could not extract org handler from URL: ${page.url()}`);

  // Navigate to org overview and complete the onboarding flow if it appears on first visit.
  // This ensures saved storage state never triggers onboarding screens in tests.
  await page.goto(`/organizations/${orgMatch[1]}/home`, { waitUntil: 'domcontentloaded' });

  // Persona selection has been removed from onboarding (the choice wasn't persisted anywhere),
  // so new users land straight on the region step — check for that directly rather than gating
  // on a persona step that no longer appears.
  const regionStepVisible = await page
    .getByRole('heading', { name: 'Select Your Region' })
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

  if (regionStepVisible) {
    // Region defaults to US already — no need to touch the dropdown.
    await page.getByRole('button', { name: 'Get Started' }).click();

    // "Get Started" provisions the org + default project then navigates to that project's
    // own home page (Project.tsx) — not the org-level "All Projects" list. Check for a
    // submission error first so a real setup failure (e.g. a scope/permission error from
    // the backend) fails fast with its actual message instead of a generic 30s timeout.
    // The static info banner above the form is also role="alert", so it's excluded by text.
    const errorAlert = page.getByRole('alert').filter({ hasNotText: 'You can start with the default Cloud Data Plane' });
    const setupFailed = await errorAlert
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (setupFailed) {
      const message = await errorAlert.innerText();
      throw new Error(`Onboarding "Get Started" failed: ${message}`);
    }

    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible', timeout: 30_000 });
  }

  // Save auth state after onboarding has been completed.
  await page.context().storageState({ path: AUTH_FILE });

  await writeFile(
    CONTEXT_FILE,
    JSON.stringify({
      orgHandler: orgMatch[1],
      projectHandler: projectMatch?.[1] ?? null,
    }),
  );
});
