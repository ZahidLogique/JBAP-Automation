import { test, expect } from "@playwright/test";
import { AuctionSchedulePage } from "../../../pages/backoffice/AuctionSchedulePage";
import { AuctionFormPage } from "../../../pages/backoffice/AuctionFormPage";
import { generateAuctionData } from "../../../fixtures/auction-data";
import { saveState, loadState } from "../../../fixtures/test-state";

test.describe("Add Auction", () => {
  test.describe.configure({ mode: "serial" });

  test("AA-001: add auction modal opens with expected fields", async ({ page }) => {
    const list = new AuctionSchedulePage(page);
    await list.goto();
    await list.clickAddAuction();

    const form = new AuctionFormPage(page);
    await expect(page.locator("#form-lelang")).toBeVisible();
    await expect(form.noInput).toBeVisible();
    await expect(form.startInput).toBeVisible();
    await expect(form.endInput).toBeVisible();
    await expect(form.submitButton).toBeVisible();
  });

  test("AA-002: mandatory field validation prevents empty submit", async ({ page }) => {
    const list = new AuctionSchedulePage(page);
    await list.goto();
    await list.clickAddAuction();

    const form = new AuctionFormPage(page);
    await form.submitButton.click();
    await page.waitForTimeout(1000);

    // no swal success popup should appear, and the form should remain open
    await expect(page.locator(".swal2-title", { hasText: "Success" })).toHaveCount(0);
    await expect(page.locator("#form-lelang")).toBeVisible();
  });

  test("AA-003: fill and submit add auction form successfully", async ({ page }) => {
    test.setTimeout(60000);
    const auctionData = generateAuctionData("JBAP");
    saveState({ createdAuctionNo: auctionData.no, createdAuctionStart: auctionData.start, createdAuctionEnd: auctionData.end });

    const list = new AuctionSchedulePage(page);
    await list.goto();
    await list.clickAddAuction();

    const form = new AuctionFormPage(page);
    await form.fillForm(auctionData);
    const result = await form.submit();

    expect(result.success).toBeTruthy();
  });

  test("AA-004: verify created auction appears in the list with correct data", async ({ page }) => {
    const { createdAuctionNo, createdAuctionStart, createdAuctionEnd } = loadState();
    test.skip(!createdAuctionNo, "AA-003 did not produce an auction no");

    const list = new AuctionSchedulePage(page);
    await list.goto();
    await list.search(createdAuctionNo);

    const rowIndex = await list.findRowIndexByAuctionNo(createdAuctionNo);
    expect(rowIndex).toBeGreaterThanOrEqual(0);

    const row = await list.getRowData(rowIndex);
    expect(row.location).toBe("JBAP");
    expect(row.no).toBe(createdAuctionNo);
    expect(row.start.replace(/\s+/g, " ")).toContain(createdAuctionStart.split(" ")[0]);
    expect(row.end.replace(/\s+/g, " ")).toContain(createdAuctionEnd.split(" ")[0]);
  });
});
