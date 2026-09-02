import { test, expect } from "@playwright/test";
import { CarListPage } from "../../../pages/backoffice/CarListPage";

test.describe("Cars > Change History", () => {
  test.describe.configure({ mode: "serial" });

  test("CH-001: change history modal opens from car list", async ({ page }) => {
    const carList = new CarListPage(page);

    await test.step("Given I am on the car list page", async () => {
      await carList.goto();
    });

    await test.step("When I click Change History on the first row", async () => {
      await carList.clickChangeHistoryOnRow(0);
    });

    await test.step("Then the change history modal should be visible", async () => {
      const modal = page.locator("#myModal, .modal.show, .modal.in").first();
      await expect(modal).toBeVisible({ timeout: 10000 });
    });
  });

  test("CH-002: history displays change details", async ({ page }) => {
    const carList = new CarListPage(page);

    await test.step("Given I open the change history modal", async () => {
      await carList.goto();
      await carList.clickChangeHistoryOnRow(0);
    });

    await test.step("Then the modal should display Field, Old Value, and New Value columns", async () => {
      const modal = page.locator("#myModal, .modal.show, .modal.in").first();
      await expect(modal).toBeVisible({ timeout: 10000 });
      await expect(modal.locator("text=Field")).toBeVisible();
      await expect(modal.locator("text=Old Value")).toBeVisible();
      await expect(modal.locator("text=New Value")).toBeVisible();
    });
  });

  test("CH-004: modal can be closed", async ({ page }) => {
    const carList = new CarListPage(page);

    await test.step("Given the change history modal is open", async () => {
      await carList.goto();
      await carList.clickChangeHistoryOnRow(0);
      const modal = page.locator("#myModal, .modal.show, .modal.in").first();
      await expect(modal).toBeVisible({ timeout: 10000 });
    });

    await test.step("When I close the modal", async () => {
      const modal = page.locator("#myModal, .modal.show, .modal.in").first();
      const closeButton = modal.locator("button:has-text('Close'), button.close, [aria-label='Close']").first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        await page.keyboard.press("Escape");
      }
    });

    await test.step("Then the modal should no longer be visible", async () => {
      const modal = page.locator("#myModal, .modal.show, .modal.in").first();
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    });
  });
});
