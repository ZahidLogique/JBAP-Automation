import { test, expect } from "@playwright/test";
import { AuctionSchedulePage } from "../../../pages/backoffice/AuctionSchedulePage";
import { AuctionFormPage } from "../../../pages/backoffice/AuctionFormPage";
import { generateAuctionData } from "../../../fixtures/auction-data";
import { saveState, loadState } from "../../../fixtures/test-state";

test.describe("Master - Auction Schedule > Add", () => {
  test.describe.configure({ mode: "serial" });

  test("AA-001: add auction modal opens with expected fields", async ({ page }) => {
    const list = new AuctionSchedulePage(page);

    await test.step("Given I am on the auction schedule page", async () => {
      await list.goto();
    });

    await test.step("When I click Add Auction", async () => {
      await list.clickAddAuction();
    });

    await test.step("Then the auction form should be visible with all required fields", async () => {
      const form = new AuctionFormPage(page);
      await expect(page.locator("#form-lelang")).toBeVisible();
      await expect(form.noInput).toBeVisible();
      await expect(form.startInput).toBeVisible();
      await expect(form.endInput).toBeVisible();
      await expect(form.submitButton).toBeVisible();
    });
  });

  test("AA-002: mandatory field validation prevents empty submit", async ({ page }) => {
    const list = new AuctionSchedulePage(page);

    await test.step("Given I open the add auction form", async () => {
      await list.goto();
      await list.clickAddAuction();
    });

    await test.step("When I submit the form without filling any fields", async () => {
      const form = new AuctionFormPage(page);
      await form.submitButton.click();
      await page.waitForTimeout(1000);
    });

    await test.step("Then no success popup should appear and the form should remain open", async () => {
      await expect(page.locator(".swal2-title", { hasText: "Success" })).toHaveCount(0);
      await expect(page.locator("#form-lelang")).toBeVisible();
    });
  });

  test("AA-003: fill and submit add auction form successfully", async ({ page }) => {
    test.setTimeout(60000);
    const auctionData = generateAuctionData("JBAP");

    await test.step("Given I save the auction data for subsequent tests", async () => {
      saveState({ createdAuctionNo: auctionData.no, createdAuctionStart: auctionData.start, createdAuctionEnd: auctionData.end });
    });

    await test.step("And I open the add auction form", async () => {
      const list = new AuctionSchedulePage(page);
      await list.goto();
      await list.clickAddAuction();
    });

    await test.step("When I fill all auction fields and submit", async () => {
      const form = new AuctionFormPage(page);
      await form.fillForm(auctionData);
    });

    await test.step("Then the auction should be created successfully", async () => {
      const form = new AuctionFormPage(page);
      const result = await form.submit();
      expect(result.success).toBeTruthy();
    });
  });

  test("AA-004: verify created auction appears in the list with correct data", async ({ page }) => {
    const { createdAuctionNo, createdAuctionStart, createdAuctionEnd } = loadState();
    test.skip(!createdAuctionNo, "AA-003 did not produce an auction no");

    await test.step("Given I am on the auction schedule page", async () => {
      const list = new AuctionSchedulePage(page);
      await list.goto();
    });

    await test.step("When I search by the created auction number", async () => {
      const list = new AuctionSchedulePage(page);
      await list.search(createdAuctionNo);
    });

    await test.step("Then the auction should appear with correct location, start, and end dates", async () => {
      const list = new AuctionSchedulePage(page);
      const rowIndex = await list.findRowIndexByAuctionNo(createdAuctionNo);
      expect(rowIndex).toBeGreaterThanOrEqual(0);

      const row = await list.getRowData(rowIndex);
      expect(row.location).toBe("JBAP");
      expect(row.no).toBe(createdAuctionNo);
      expect(row.start.replace(/\s+/g, " ")).toContain(createdAuctionStart.split(" ")[0]);
      expect(row.end.replace(/\s+/g, " ")).toContain(createdAuctionEnd.split(" ")[0]);
    });
  });
});
