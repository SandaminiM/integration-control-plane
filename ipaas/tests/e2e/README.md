# WIP E2E Test Suite

Playwright-based smoke tests for the WIP (formerly Devant) product, targeting `https://preview-o2-dev.devant.dev`.

---

## Structure

```
tests/e2e/
  global.setup.ts          # Logs in once via WSO2 Identity Platform, saves auth state to .auth/user.json
  pages/                   # Page-object models (one file per page)
    LoginPage.ts
    OrgHomePage.ts
    ProjectsPage.ts
    CreateProjectPage.ts
    IntegrationOptionsPage.ts
  specs/
    smoke/                 # Fast smoke suite — runs on every nightly build
      auth.spec.ts         # Login, auth redirect, login page options
      projects.spec.ts     # Projects list, create project flow
      integrations.spec.ts # Integration creation options, samples, prebuilt
```

---

## Prerequisites

1. **Install dependencies**
   ```bash
   cd ipaas
   pnpm install
   pnpm exec playwright install --with-deps chromium
   ```

2. **Test user account**

   You need a dedicated WSO2 Identity Platform account for tests — never use a personal account.

   | What | Value |
   |------|-------|
   | Email | `wip-e2e@wso2.com` (or any shared team mailbox) |
   | Org | Pre-create one org manually after first sign-up |
   | GitHub | Create a `wip-e2e-bot` GitHub account for integration tests (future) |

   Sign up at `https://preview-o2-dev.devant.dev` and complete email verification once. After that, the tests log in and reuse the session.

3. **Credentials file**

   Copy the example file and fill in real values:
   ```bash
   cp .env.test.example .env.test
   # then edit .env.test with your credentials
   ```

   `.env.test` is gitignored — never commit it. `.env.test.example` is the committed template.

   ```
   E2E_USERNAME=wip-e2e@wso2.com
   E2E_PASSWORD=your-password-here

   # Optional — defaults to https://preview-o2-dev.devant.dev
   # E2E_BASE_URL=https://preview-o2-dev.devant.dev
   ```

---

## Running locally

```bash
# Run all smoke tests (reads credentials from .env.test automatically)
pnpm test:e2e

# Run with browser visible (useful for debugging)
pnpm test:e2e --headed

# Run interactive UI mode (Playwright's test explorer)
pnpm test:e2e:ui

# Run a specific spec file
pnpm test:e2e tests/e2e/specs/smoke/auth.spec.ts

# Open the last HTML report
pnpm test:e2e:report
```

---

## Nightly CI

The workflow at `.github/workflows/e2e-nightly.yml`:

- Runs automatically at **2 AM UTC** every day against `devant-migration` branch
- Can be triggered manually via **Actions → E2E Nightly (WIP) → Run workflow**
- Lets you pick any branch and target URL at trigger time

### Required GitHub Actions secrets

The workflow uses secrets instead of `.env.test` (which is local-only and never committed).

Set these at `https://github.com/sm1990/integration-control-plane/settings/secrets/actions`:

| Secret | Description |
|--------|-------------|
| `E2E_USERNAME` | Test user email (same value as in your `.env.test`) |
| `E2E_PASSWORD` | Test user password (same value as in your `.env.test`) |
| `E2E_SLACK_WEBHOOK_URL` | (Optional) Slack webhook for failure notifications |

### Enabling the workflow on a fork

GitHub disables scheduled workflows on forks by default. After pushing:
1. Go to `https://github.com/sm1990/integration-control-plane/actions`
2. Find **E2E Nightly (WIP)**
3. Click **Enable workflow** if shown

---

## Adding new tests

1. **Add a page object** in `tests/e2e/pages/` if you need to interact with a new page.
   - Name it after the page (e.g. `EnvironmentsPage.ts`)
   - Use `getByRole`, `getByLabel`, `getByText` — avoid CSS selectors where possible
   - Keep assertions in spec files, not page objects

2. **Add a spec** in `tests/e2e/specs/smoke/` for smoke-level coverage, or create a new subdirectory (e.g. `specs/regression/`) for deeper flows.

3. **Test naming convention**
   - Smoke tests: tag with `@smoke` in `test.describe`
   - Use unique resource names: `e2e-<purpose>-${Date.now()}`

4. **Parallel safety**
   - Tests run with `fullyParallel: true` — never share mutable state between tests
   - Each test or suite creates its own resources

---

## Troubleshooting

**`E2E_USERNAME and E2E_PASSWORD must be set`**
→ You haven't created `.env.test` yet. Run `cp .env.test.example .env.test` and fill in your credentials.

**`Not on an org page` error in OrgHomePage**
→ The test user has no org yet. Sign in manually at the app and create one.

**WSO2 Identity Platform login selectors fail in `global.setup.ts`**
→ Run with `--headed` and watch the WSO2 Identity Platform login page. Inspect the username/password field IDs and update the locator strings in `global.setup.ts` lines ~20–26.

**Tests pass locally but fail in CI**
→ Check the uploaded `playwright-report` artifact in the GitHub Actions run. Traces and videos are saved on failure.

**`Schedule` trigger not firing**
→ GitHub only runs scheduled workflows from the repository's **default branch**. Make sure the workflow file is merged to `main`.
