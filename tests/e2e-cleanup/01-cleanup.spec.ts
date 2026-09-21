import { test, expect } from "../../fixtures/base";
import { AuctionSchedulePage } from "../../pages/backoffice/AuctionSchedulePage";
import { loadState } from "../../fixtures/test-state";

test.describe("E2E Cleanup", () => {
  test.describe.configure({ mode: "serial" });

  test("E2E-CLEANUP-001: delete master auction schedule", async ({ page }) => {
    test.setTimeout(60000);
    const state = loadState();
    test.skip(!state.e2eAuctionNo, "No master auction to clean up");

    const list = new AuctionSchedulePage(page);

    await test.step("Given I navigate to the Master Auction Schedule page", async () => {
      await list.goto();
    });

    await test.step("When I search for the created auction", async () => {
      await list.search(state.e2eAuctionNo);
    });

    await test.step("And I delete the auction", async () => {
      const rowIndex = await list.findRowIndexByAuctionNo(state.e2eAuctionNo);
      expect(rowIndex).toBeGreaterThanOrEqual(0);
      const result = await list.deleteRowAndConfirm(rowIndex);
      expect(result.success).toBeTruthy();
    });

    await test.step("Then the auction should no longer appear in the list", async () => {
      await list.search(state.e2eAuctionNo);
      const rowIndex = await list.findRowIndexByAuctionNo(state.e2eAuctionNo);
      expect(rowIndex).toBe(-1);
    });
  });
});
