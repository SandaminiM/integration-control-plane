import { type Page } from '@playwright/test';

/**
 * Represents the top navigation bar present on all authenticated pages.
 */
export class TopNav {
  constructor(private readonly page: Page) {}

  /** Clicks the org name combobox — navigates to /organizations/:org/home. */
  async clickOrg() {
    await this.page.getByRole('combobox', { name: /organization/i }).click();
  }

  /** Clicks the X on the project chip — dismisses the project and navigates to org home. */
  async closeProjectChip() {
    await this.page.getByRole('button', { name: 'Clear project', exact: true }).click();
  }

  /**
   * Clicks the ChevronRight caret next to the org card (visible when no project is selected).
   * Opens the project picker popover.
   */
  async openProjectPicker() {
    await this.page.getByRole('button', { name: 'Select project' }).click();
  }

  /** Selects a project from the project picker popover by its handle. */
  async selectProject(projectHandle: string) {
    await this.page.getByRole('menuitem', { name: projectHandle }).click();
  }

  /** Opens the user menu by clicking the profile avatar button. */
  async openUserMenu() {
    await this.page.getByRole('button', { name: 'Account' }).click();
  }

  /** Clicks Sign Out in the user menu — opens the confirmation dialog. */
  async clickSignOut() {
    await this.page.getByRole('menuitem', { name: 'Sign Out' }).click();
  }

  /** Confirms sign out in the confirmation dialog. */
  async confirmSignOut() {
    await this.page.getByRole('button', { name: 'Sign Out' }).click();
  }
}
