import { Locator, Page } from "@playwright/test";

export class OtpVerificationPage {
  readonly proceedButton: Locator;

  constructor(private page: Page) {
    this.proceedButton = page.getByRole("button", { name: "Proceed" }).last();
  }

  async fillOtp(otpCode: string) {
    // Click the OTP area to focus, then type all digits
    const otpContainer = this.page.getByText("OTP Verification").last();
    await otpContainer.click({ force: true });
    await this.page.waitForTimeout(300);
    await this.page.keyboard.press("Tab");
    await this.page.keyboard.type(otpCode, { delay: 100 });
  }

  async clickProceed() {
    await this.proceedButton.click({ force: true });
  }
}
