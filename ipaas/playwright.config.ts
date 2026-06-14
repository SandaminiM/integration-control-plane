import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://preview-o2-dev.devant.dev',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: 'setup',
      testDir: './tests/e2e',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'wip',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
        launchOptions: {
          args: ['--incognito'],
        },
      },
      dependencies: ['setup'],
    },
  ],
  outputDir: 'test-results/',
});
