import { test, expect } from "@playwright/test";
import { AuctionSchedulePage } from "../../../pages/backoffice/AuctionSchedulePage";
import { AuctionFormPage } from "../../../pages/backoffice/AuctionFormPage";
import { nextValidEditEnd } from "../../../fixtures/auction-data";
import { loadState, saveState } from "../../../fixtures/test-state";

test.describe("Master - Auction Schedule > Edit", () => {
  test.describe.configure({ mode: "serial" });

  let auctionNo: string;

  test.beforeEach(() => {
    auctionNo = loadState().createdAuctionNo ?? "";
  });

  test("AE-001: edit modal opens with existing auction data", async ({ page }) => {
    test.skip(!auctionNo, "No created auction available");

    await test.step("Given I search for the created auction", async () => {
      const list = new AuctionSchedulePage(page);
      await list.goto();
      await list.search(auctionNo);
    });

    await test.step("When I click Edit on the auction row", async () => {
      const list = new AuctionSchedulePage(page);
      const rowIndex = await list.findRowIndexByAuctionNo(auctionNo);
      expect(rowIndex).toBeGreaterThanOrEqual(0);
      await list.clickEditOnRow(rowIndex);
    });

    await test.step("Then the edit form should show existing data with auction no readonly", async () => {
      const form = new AuctionFormPage(page);
      await expect(page.locator("#form-lelang")).toBeVisible();
      await expect(form.noInput).toHaveValue(auctionNo);
      await expect(form.noInput).toHaveAttribute("readonly", "");
      const startValue = await form.startInput.inputValue();
      expect(startValue).toBeTruthy();
    });
  });

  test("AE-002: edit end date and verify it actually persisted", async ({ page }) => {
    test.setTimeout(60000);
    const { createdAuctionNo, createdAuctionStart } = loadState();
    test.skip(!createdAuctionNo, "No created auction available");

    const newEnd = nextValidEditEnd(createdAuctionStart);

    await test.step("Given I open the edit form for the created auction", async () => {
      const list = new AuctionSchedulePage(page);
      await list.goto();
      await list.search(createdAuctionNo);
      const rowIndex = await list.findRowIndexByAuctionNo(createdAuctionNo);
      expect(rowIndex).toBeGreaterThanOrEqual(0);
      await list.clickEditOnRow(rowIndex);
    });

    await test.step("When I update the end date and submit", async () => {
      const form = new AuctionFormPage(page);
      await form.fillForm({ end: newEnd });
      const result = await form.submit();
      expect(result.success, `submit failed: ${result.message}`).toBeTruthy();
      saveState({ createdAuctionEnd: newEnd });
    });

    await test.step("Then the updated end date should be persisted in the list", async () => {
      const list = new AuctionSchedulePage(page);
      await list.goto();
      await list.search(createdAuctionNo);
      const updatedRowIndex = await list.findRowIndexByAuctionNo(createdAuctionNo);
      expect(updatedRowIndex).toBeGreaterThanOrEqual(0);

      const row = await list.getRowData(updatedRowIndex);
      expect(row.start).toContain(createdAuctionStart.split(" ")[0]);
      expect(row.start).toContain(createdAuctionStart.split(" ")[1]);
      expect(row.end).toContain(newEnd.split(" ")[0]);
      expect(row.end).toContain(newEnd.split(" ")[1]);
    });
  });
});
