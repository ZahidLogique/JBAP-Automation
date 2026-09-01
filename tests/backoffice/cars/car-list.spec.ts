import { test, expect } from "@playwright/test";
import { CarListPage } from "../../../pages/backoffice/CarListPage";

test.describe("Car list", () => {
  let carList: CarListPage;

  test.beforeEach(async ({ page }) => {
    carList = new CarListPage(page);
    await carList.goto();
  });

  test("CL-001: car list page loads correctly", async ({ page }) => {
    await expect(page).toHaveTitle("CDMS Dashboard");
    await expect(carList.table).toBeVisible();

    const rowCount = await carList.getRowCount();
    expect(rowCount).toBeGreaterThan(0);

    const headerRow = carList.table.locator("thead tr").first();
    await expect(headerRow).toContainText("Vehicle Control No");
    await expect(headerRow).toContainText("Make");
  });

  test("CL-002: filter by keyword", async ({ page }) => {
    const firstVcn = await carList.getFirstRowVehicleControlNo();

    await carList.searchByKeyword(firstVcn);

    const rowCount = await carList.getRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    const resultVcn = await carList.getFirstRowVehicleControlNo();
    expect(resultVcn).toContain(firstVcn);
  });

  test("CL-007: pagination works", async ({ page }) => {
    const firstPageFirstVcn = await carList.getFirstRowVehicleControlNo();

    const page2Button = page.locator("a").filter({ hasText: /^2$/ }).first();
    if (await page2Button.isVisible()) {
      await page2Button.click();
      await page.locator("text=Processing").waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);

      const secondPageFirstVcn = await carList.getFirstRowVehicleControlNo();
      expect(secondPageFirstVcn).not.toBe(firstPageFirstVcn);
    }
  });
});
