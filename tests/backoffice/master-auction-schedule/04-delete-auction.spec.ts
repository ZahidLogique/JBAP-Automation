import { test, expect } from "@playwright/test";
import { AuctionSchedulePage } from "../../../pages/backoffice/AuctionSchedulePage";
import { loadState } from "../../../fixtures/test-state";

test.describe("Master - Auction Schedule > Delete", () => {
  test.describe.configure({ mode: "serial" });

  test("AD-001: delete the auction created by this run and confirm success", async ({ page }) => {
    test.setTimeout(60000);
    const { createdAuctionNo } = loadState();
    test.skip(!createdAuctionNo, "No created auction available");

    await test.step("Given I search for the created auction", async () => {
      const list = new AuctionSchedulePage(page);
      await list.goto();
      await list.search(createdAuctionNo);
    });

    await test.step("When I delete the auction and confirm", async () => {
      const list = new AuctionSchedulePage(page);
      const rowIndex = await list.findRowIndexByAuctionNo(createdAuctionNo);
      expect(rowIndex).toBeGreaterThanOrEqual(0);
      const result = await list.deleteRowAndConfirm(rowIndex);

      await test.step("Then the deletion should be successful", async () => {
        expect(result.success).toBeTruthy();
      });
    });
  });

  test("AD-002: verify the deleted auction no longer appears in the list", async ({ page }) => {
    const { createdAuctionNo } = loadState();
    test.skip(!createdAuctionNo, "No created auction available");

    await test.step("Given I am on the auction schedule page", async () => {
      const list = new AuctionSchedulePage(page);
      await list.goto();
    });

    await test.step("When I search for the deleted auction number", async () => {
      const list = new AuctionSchedulePage(page);
      await list.search(createdAuctionNo);
    });

    await test.step("Then the auction should not be found in the list", async () => {
      const list = new AuctionSchedulePage(page);
      const rowIndex = await list.findRowIndexByAuctionNo(createdAuctionNo);
      expect(rowIndex).toBe(-1);
    });
  });
});
