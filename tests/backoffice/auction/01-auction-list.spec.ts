import { test, expect } from "@playwright/test";
import { AuctionSchedulePage } from "../../../pages/backoffice/AuctionSchedulePage";

test.describe("Auction Schedule List", () => {
  test.describe.configure({ mode: "serial" });

  test("AL-001: auction schedule list page loads correctly", async ({ page }) => {
    const list = new AuctionSchedulePage(page);
    await list.goto();

    await expect(page.locator("h1")).toContainText("Auction Schedule");
    await expect(list.table).toBeVisible();

    const rowCount = await list.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test("AL-002: table shows expected columns", async ({ page }) => {
    const list = new AuctionSchedulePage(page);
    await list.goto();

    const headers = await list.table.locator("thead th").allTextContents();
    const normalized = headers.map((h) => h.trim());

    expect(normalized).toEqual(
      expect.arrayContaining(["Location", "Auction No", "Auction Start Date/Time", "Auction End Date/Time", "Action"])
    );
  });
});
