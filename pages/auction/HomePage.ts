import { Page, Locator } from "@playwright/test";

export class HomePage {
  readonly buyerLoginButton: Locator;
  readonly allListingButton: Locator;
  readonly mainMenuButton: Locator;

  constructor(private page: Page) {
    this.buyerLoginButton = page.locator("button").filter({ hasText: "BUYER" }).first();
    this.allListingButton = page.locator("button, a").filter({ hasText: "ALL LISTING" }).first();
    this.mainMenuButton = page.locator("button, a").filter({ hasText: "MAIN MENU" }).first();
  }

  async goto() {
    await this.page.goto("/", { timeout: 60000 });
    await this.page.waitForLoadState("networkidle", { timeout: 60000 });
  }

  async clickBuyerLogin() {
    await this.buyerLoginButton.click();
    await this.page.waitForTimeout(1000);
  }
}
