import { test, expect } from "@playwright/test";
import { HomePage } from "../../pages/auction/HomePage";
import { LoginPopup } from "../../pages/auction/LoginPopup";
import { OtpVerificationPage } from "../../pages/auction/OtpVerificationPage";

test.describe("E2E Auction Flow: Buyer Login & Bid", () => {
  test.describe.configure({ mode: "serial" });

  test("E2E-BUY-001: buyer site homepage loads correctly", async ({ page }) => {
    const home = new HomePage(page);

    await test.step("Given I navigate to the JBAP auction homepage", async () => {
      await home.goto();
    });

    await test.step("Then the Buyer's Login button should be visible", async () => {
      await expect(home.buyerLoginButton).toBeVisible();
    });
  });

  test("E2E-BUY-002: buyer login with OTP and check listing", async ({ page }) => {
    test.setTimeout(120000);
    const home = new HomePage(page);
    const popup = new LoginPopup(page);
    const otp = new OtpVerificationPage(page);

    // --- Login flow ---
    await test.step("Given I navigate to the homepage and open Buyer Login", async () => {
      await home.goto();
      await home.clickBuyerLogin();
      await expect(popup.buyerIdInput).toBeVisible({ timeout: 10000 });
    });

    await test.step("When I fill Buyer ID 'B1060' and click Login", async () => {
      await popup.fillBuyerId("B1060");
      await expect(popup.buyerIdInput).toHaveValue("B1060");
    });

    let otpCode = "";
    await test.step("And I intercept the signin response to get OTP", async () => {
      const responsePromise = page.waitForResponse(
        (res) => res.url().includes("signin") && res.status() === 200
      );
      await popup.clickLogin();
      const response = await responsePromise;
      const body = await response.json();
      otpCode = String(body.data.otp_code);
      expect(otpCode).toHaveLength(6);
    });

    await test.step("Then the OTP Verification page should appear", async () => {
      await expect(page.getByText("OTP Verification").last()).toBeVisible({ timeout: 10000 });
    });

    await test.step("When I fill the OTP code and click Proceed", async () => {
      await otp.fillOtp(otpCode);
      await page.waitForTimeout(500);
      await otp.clickProceed();
      await page.waitForTimeout(3000);
    });

    await test.step("Then the Terms of Conditions should appear", async () => {
      await expect(page.getByText("Terms of Conditions").last()).toBeVisible({ timeout: 10000 });
    });

    await test.step("When I scroll Terms to bottom and click Agree", async () => {
      await page.evaluate(() => {
        const elements = document.querySelectorAll("*");
        for (const el of elements) {
          if (el.scrollHeight > el.clientHeight && el.clientHeight > 100 && el.clientHeight < 500) {
            const text = el.textContent || "";
            if (text.includes("Terms and Conditions")) {
              el.scrollTop = el.scrollHeight;
              break;
            }
          }
        }
      });
      await page.waitForTimeout(1000);
      await page.getByRole("button", { name: "Agree" }).last().click({ force: true });
      await page.waitForTimeout(3000);
    });

    await test.step("Then the buyer should be logged in with buyer menu visible", async () => {
      await expect(page.getByText("Buyer's Page").last()).toBeVisible({ timeout: 10000 });
    });

    // --- Check listing ---
    await test.step("When I click ALL LISTING", async () => {
      await page.locator("a[href*='all-listing']").last().click();
      await page.waitForLoadState("networkidle", { timeout: 30000 });
    });

    await test.step("Then the auction listing page should load", async () => {
      await expect(page).toHaveURL(/all-listing/, { timeout: 10000 });
      await page.screenshot({ path: "test-results/auction-listing.png" });
    });
  });
});
