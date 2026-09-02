import { test, expect } from "@playwright/test";
import { CarListPage } from "../../../pages/backoffice/CarListPage";

test.describe("Cars > List", () => {
  test.describe.configure({ mode: "serial" });

  test("CL-001: car list page loads correctly", async ({ page }) => {
    const carList = new CarListPage(page);

    await test.step("Given I navigate to the car list page", async () => {
      await carList.goto();
    });

    await test.step("Then the page title should be CDMS Dashboard", async () => {
      await expect(page).toHaveTitle("CDMS Dashboard");
    });

    await test.step("And the car table should be visible with data", async () => {
      await expect(carList.table).toBeVisible();
      const rowCount = await carList.getRowCount();
      expect(rowCount).toBeGreaterThan(0);
    });

    await test.step("And the table headers should contain expected columns", async () => {
      const headerRow = carList.table.locator("thead tr").first();
      await expect(headerRow).toContainText("Vehicle Control No");
      await expect(headerRow).toContainText("Make");
    });
  });

  test("CL-002: filter by keyword", async ({ page }) => {
    const carList = new CarListPage(page);

    await test.step("Given I am on the car list page", async () => {
      await carList.goto();
    });

    let firstVcn = "";
    await test.step("When I search by the first car VCN", async () => {
      firstVcn = await carList.getFirstRowVehicleControlNo();
      await carList.searchByKeyword(firstVcn);
    });

    await test.step("Then the search result should contain the searched VCN", async () => {
      const rowCount = await carList.getRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(1);
      const resultVcn = await carList.getFirstRowVehicleControlNo();
      expect(resultVcn).toContain(firstVcn);
    });
  });

  test("CL-007: pagination works", async ({ page }) => {
    const carList = new CarListPage(page);

    let firstPageFirstVcn = "";
    await test.step("Given I am on the car list page", async () => {
      await carList.goto();
      firstPageFirstVcn = await carList.getFirstRowVehicleControlNo();
    });

    await test.step("When I click page 2, Then the data should be different", async () => {
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
});
