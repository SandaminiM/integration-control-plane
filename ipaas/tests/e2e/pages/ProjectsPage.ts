import { type Page, expect } from '@playwright/test';

export class ProjectsPage {
  constructor(private readonly page: Page) {}

  async goto(orgHandler: string) {
    await this.page.goto(`/organizations/${orgHandler}/projects/redirect`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForLoad() {
    await this.page.waitForURL(/\/organizations\/[^/]+\/projects/);
    await this.page.waitForLoadState('domcontentloaded');
  }

  createProjectButton() {
    return this.page.getByRole('button', { name: /create project/i });
  }

  async expectPageLoaded() {
    await expect(this.page).toHaveURL(/\/organizations\/[^/]+\/projects/);
  }

  getProjectHandlerFromUrl(): string {
    const match = this.page.url().match(/\/projects\/([^/]+)/);
    if (!match) throw new Error(`No project handler in URL: ${this.page.url()}`);
    return match[1];
  }
}
