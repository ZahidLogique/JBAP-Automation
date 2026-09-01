import { test, expect } from "@playwright/test";
import { AuctionSchedulePage } from "../../../pages/backoffice/AuctionSchedulePage";
import { loadState } from "../../../fixtures/test-state";

test.describe("Delete Auction", () => {
  test.describe.configure({ mode: "serial" });

  test("AD-001: delete the auction created by this run and confirm success", async ({ page }) => {
    test.setTimeout(60000);
    const { createdAuctionNo } = loadState();
    test.skip(!createdAuctionNo, "No created auction available");

    const list = new AuctionSchedulePage(page);
    await list.goto();
    await list.search(createdAuctionNo);
    const rowIndex = await list.findRowIndexByAuctionNo(createdAuctionNo);
    expect(rowIndex).toBeGreaterThanOrEqual(0);

    const result = await list.deleteRowAndConfirm(rowIndex);
    expect(result.success).toBeTruthy();
  });

  test("AD-002: verify the deleted auction no longer appears in the list", async ({ page }) => {
    const { createdAuctionNo } = loadState();
    test.skip(!createdAuctionNo, "No created auction available");

    const list = new AuctionSchedulePage(page);
    await list.goto();
    await list.search(createdAuctionNo);
    const rowIndex = await list.findRowIndexByAuctionNo(createdAuctionNo);

    expect(rowIndex).toBe(-1);
  });
});
