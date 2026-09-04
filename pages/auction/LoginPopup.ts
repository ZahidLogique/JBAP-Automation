import { Locator, Page } from "@playwright/test";

export class LoginPopup {
  readonly buyerIdInput: Locator;
  readonly loginButton: Locator;

  constructor(private page: Page) {
    this.buyerIdInput = page.getByRole("textbox", { name: "Buyer ID" }).last();
    this.loginButton = page.locator(".ReactModalPortal button").filter({ hasText: "Login" }).last();
  }

  async fillBuyerId(buyerId: string) {
    await this.buyerIdInput.fill(buyerId);
  }

  async clickLogin() {
    await this.buyerIdInput.press("Enter");
  }

  async login(buyerId: string) {
    await this.fillBuyerId(buyerId);
    await this.clickLogin();
  }
}
