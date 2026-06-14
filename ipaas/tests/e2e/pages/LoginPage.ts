import { type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  signInWithEmailButton() {
    return this.page.getByRole('button', { name: 'Sign in with Email' });
  }

  signInWithGoogleButton() {
    return this.page.getByRole('button', { name: 'Continue with Google' });
  }

  signInWithGitHubButton() {
    return this.page.getByRole('button', { name: 'Continue with GitHub' });
  }

  async clickSignInWithEmail() {
    await this.signInWithEmailButton().click();
  }
}
