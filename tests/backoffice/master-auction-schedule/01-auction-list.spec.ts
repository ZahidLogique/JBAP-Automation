import { test, expect } from "@playwright/test";
import { AuctionSchedulePage } from "../../../pages/backoffice/AuctionSchedulePage";

test.describe("Master - Auction Schedule > List", () => {
  test.describe.configure({ mode: "serial" });

  test("AL-001: auction schedule list page loads correctly", async ({ page }) => {
    const list = new AuctionSchedulePage(page);

    await test.step("Given I navigate to the auction schedule page", async () => {
      await list.goto();
    });

    await test.step("Then the page heading should be Auction Schedule", async () => {
      await expect(page.locator("h1")).toContainText("Auction Schedule");
    });

    await test.step("And the auction table should be visible with data", async () => {
      await expect(list.table).toBeVisible();
      const rowCount = await list.getRowCount();
      expect(rowCount).toBeGreaterThan(0);
    });
  });

  test("AL-002: table shows expected columns", async ({ page }) => {
    const list = new AuctionSchedulePage(page);

    await test.step("Given I am on the auction schedule page", async () => {
      await list.goto();
    });

    await test.step("Then the table should have Location, Auction No, Start, End, and Action columns", async () => {
      const headers = await list.table.locator("thead th").allTextContents();
      const normalized = headers.map((h) => h.trim());
      expect(normalized).toEqual(
        expect.arrayContaining(["Location", "Auction No", "Auction Start Date/Time", "Auction End Date/Time", "Action"])
      );
    });
  });
});
