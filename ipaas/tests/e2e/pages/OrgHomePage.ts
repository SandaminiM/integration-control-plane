import { type Page, expect } from '@playwright/test';

export class OrgHomePage {
  constructor(private readonly page: Page) {}

  async waitForLoad() {
    await this.page.waitForURL(/\/organizations\/[^/]+/, { timeout: 60_000 });
  }

  getOrgHandler(): string {
    const match = this.page.url().match(/\/organizations\/([^/]+)/);
    if (!match) throw new Error(`Not on an org page. Current URL: ${this.page.url()}`);
    return match[1];
  }

  async gotoProjects() {
    await this.page.goto(`/organizations/${this.getOrgHandler()}/projects/redirect`);
  }

  async expectVisible() {
    // The sidebar / main nav should be present for an authenticated org view.
    await expect(this.page).toHaveURL(/\/organizations\/[^/]+/);
  }
}
