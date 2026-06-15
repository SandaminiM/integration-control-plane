import { type Page, expect } from '@playwright/test';

export class IntegrationOptionsPage {
  constructor(private readonly page: Page) {}

  async goto(orgHandler: string, projectHandler: string) {
    await this.page.goto(`/organizations/${orgHandler}/projects/${projectHandler}/components/new`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  createFromScratchOption() {
    return this.page.getByRole('button', { name: /from scratch|blank/i });
  }

  browseSamplesOption() {
    return this.page.getByRole('button', { name: /samples/i });
  }

  importFromGitOption() {
    return this.page.getByRole('button', { name: /import|git/i });
  }

  async expectOptionsVisible() {
    await expect(this.page).toHaveURL(/\/components\/new/);
    // At least one of the creation options must be visible.
    await expect(this.page.getByRole('button', { name: /scratch|blank|samples|import/i })).toBeVisible();
  }
}
