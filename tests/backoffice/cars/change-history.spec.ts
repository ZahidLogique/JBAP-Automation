import { test, expect } from "@playwright/test";
import { CarListPage } from "../../../pages/backoffice/CarListPage";

test.describe("Change history", () => {
  test("CH-001: change history modal opens from car list", async ({ page }) => {
    const carList = new CarListPage(page);
    await carList.goto();

    await carList.clickChangeHistoryOnRow(0);

    const modal = page.locator("#myModal, .modal.show, .modal.in").first();
    await expect(modal).toBeVisible({ timeout: 10000 });
  });

  test("CH-002: history displays change details", async ({ page }) => {
    const carList = new CarListPage(page);
    await carList.goto();

    await carList.clickChangeHistoryOnRow(0);

    const modal = page.locator("#myModal, .modal.show, .modal.in").first();
    await expect(modal).toBeVisible({ timeout: 10000 });

    await expect(modal.locator("text=Field")).toBeVisible();
    await expect(modal.locator("text=Old Value")).toBeVisible();
    await expect(modal.locator("text=New Value")).toBeVisible();
  });

  test("CH-004: modal can be closed", async ({ page }) => {
    const carList = new CarListPage(page);
    await carList.goto();

    await carList.clickChangeHistoryOnRow(0);

    const modal = page.locator("#myModal, .modal.show, .modal.in").first();
    await expect(modal).toBeVisible({ timeout: 10000 });

    const closeButton = modal.locator("button:has-text('Close'), button.close, [aria-label='Close']").first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      await page.keyboard.press("Escape");
    }

    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });
});
