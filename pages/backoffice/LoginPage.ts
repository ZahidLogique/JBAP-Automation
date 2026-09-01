import { Page } from "@playwright/test";

export class BackofficeLoginPage {
  constructor(private page: Page) {}

  async login(username: string, password: string) {
    await this.page.locator("#user_login").fill(username);
    await this.page.locator("#user_pass").fill(password);
    await this.page.getByRole("button", { name: "Sign In" }).click();
  }
}
