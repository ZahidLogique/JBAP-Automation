import { test, expect } from "@playwright/test";
import { AuctionSchedulePage } from "../../../pages/backoffice/AuctionSchedulePage";
import { AuctionFormPage } from "../../../pages/backoffice/AuctionFormPage";
import { nextValidEditEnd } from "../../../fixtures/auction-data";
import { loadState, saveState } from "../../../fixtures/test-state";

test.describe("Edit Auction", () => {
  test.describe.configure({ mode: "serial" });

  let auctionNo: string;

  test.beforeEach(() => {
    auctionNo = loadState().createdAuctionNo ?? "";
  });

  test("AE-001: edit modal opens with existing auction data", async ({ page }) => {
    test.skip(!auctionNo, "No created auction available");

    const list = new AuctionSchedulePage(page);
    await list.goto();
    await list.search(auctionNo);
    const rowIndex = await list.findRowIndexByAuctionNo(auctionNo);
    expect(rowIndex).toBeGreaterThanOrEqual(0);

    await list.clickEditOnRow(rowIndex);

    const form = new AuctionFormPage(page);
    await expect(page.locator("#form-lelang")).toBeVisible();
    await expect(form.noInput).toHaveValue(auctionNo);
    await expect(form.noInput).toHaveAttribute("readonly", "");

    const startValue = await form.startInput.inputValue();
    expect(startValue).toBeTruthy();
  });

  test("AE-002: edit end date and verify it actually persisted", async ({ page }) => {
    test.setTimeout(60000);
    const { createdAuctionNo, createdAuctionStart } = loadState();
    test.skip(!createdAuctionNo, "No created auction available");

    // The server rejects changing Start on edit ("start date not same with
    // existing") — only End is actually editable, so Start is left untouched.
    const newEnd = nextValidEditEnd(createdAuctionStart);

    const list = new AuctionSchedulePage(page);
    await list.goto();
    await list.search(createdAuctionNo);
    const rowIndex = await list.findRowIndexByAuctionNo(createdAuctionNo);
    expect(rowIndex).toBeGreaterThanOrEqual(0);

    await list.clickEditOnRow(rowIndex);

    const form = new AuctionFormPage(page);
    await form.fillForm({ end: newEnd });
    const result = await form.submit();
    expect(result.success, `submit failed: ${result.message}`).toBeTruthy();

    saveState({ createdAuctionEnd: newEnd });

    // re-fetch from the list to prove the new end date was actually persisted,
    // and that start stayed exactly as it was (the field the server locks)
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
