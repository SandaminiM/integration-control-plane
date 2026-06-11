import { test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, '../../.auth/google-session.json');

// One-time script — run manually whenever your Google session expires (~weeks/months):
//   pnpm test:e2e:save-google-auth
//
// Opens a real Chrome window. Sign in to the test Google account in that window.
// Once you land on myaccount.google.com the session is saved automatically.

test.setTimeout(120_000);

test('save Google session', async ({ page, context }) => {
  await page.goto('https://accounts.google.com');

  console.log('\n================================================');
  console.log('Sign in to the TEST Google account in the browser window.');
  console.log('This script will save the session once you are signed in.');
  console.log('================================================\n');

  await page.waitForURL(/myaccount\.google\.com/, { timeout: 110_000 });
  await context.storageState({ path: AUTH_FILE });

  console.log(`\n✓ Google session saved to ${AUTH_FILE}`);
  console.log('You can now run: pnpm test:e2e:setup\n');
});
