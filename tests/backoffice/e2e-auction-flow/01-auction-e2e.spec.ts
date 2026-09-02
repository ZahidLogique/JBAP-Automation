import { test, expect } from "@playwright/test";
import { AuctionSchedulePage } from "../../../pages/backoffice/AuctionSchedulePage";
import { AuctionFormPage } from "../../../pages/backoffice/AuctionFormPage";
import { AuctionListPage } from "../../../pages/backoffice/AuctionListPage";
import { BidAuctionFormPage } from "../../../pages/backoffice/BidAuctionFormPage";
import { generateAuctionData } from "../../../fixtures/auction-data";
import { saveState, loadState } from "../../../fixtures/test-state";

test.describe("E2E Auction Flow: Master → Bid Auction → Assign Car", () => {
  test.describe.configure({ mode: "serial" });

  const auctionData = generateAuctionData("JBAP");

  test("E2E-001: create master auction schedule", async ({ page }) => {
    test.setTimeout(60000);

    await test.step("Given I navigate to the Master Auction Schedule page", async () => {
      const list = new AuctionSchedulePage(page);
      await list.goto();
    });

    await test.step("When I open the Add Auction modal", async () => {
      const list = new AuctionSchedulePage(page);
      await list.clickAddAuction();
    });

    await test.step("And I fill the auction form with valid data", async () => {
      const form = new AuctionFormPage(page);
      await form.fillForm(auctionData);
    });

    await test.step("And I submit the form", async () => {
      const form = new AuctionFormPage(page);
      const result = await form.submit();
      expect(result.success).toBeTruthy();
    });

    await test.step("Then the auction should appear in the schedule list", async () => {
      const list = new AuctionSchedulePage(page);
      await list.search(auctionData.no!);
      const rowIndex = await list.findRowIndexByAuctionNo(auctionData.no!);
      expect(rowIndex).toBeGreaterThanOrEqual(0);
    });

    await test.step("And I save the master auction data for subsequent tests", async () => {
      saveState({
        e2eAuctionNo: auctionData.no,
        e2eAuctionStart: auctionData.start,
        e2eAuctionEnd: auctionData.end,
        e2eAuctionLocation: auctionData.location,
      });
    });
  });

  test("E2E-002: create bid auction from Open House tab", async ({ page }) => {
    test.setTimeout(90000);
    const state = loadState();
    test.skip(!state.e2eAuctionNo, "E2E-001 did not create a master auction");

    const list = new AuctionListPage(page);

    await test.step("Given I navigate to the Auction List and select Open House tab", async () => {
      await list.goto();
      await list.clickOpenHouseTab();
    });

    await test.step("When I click Add Auction on the Open House tab", async () => {
      await list.clickAddAuction();
    });

    await test.step("Then I should see the Add Bid Auction page", async () => {
      await expect(page.locator("h1, h2, h3").filter({ hasText: "Add Bid Auction" }).first()).toBeVisible();
    });

    const form = new BidAuctionFormPage(page);

    await test.step("When I fill Location and datetime fields", async () => {
      await form.fillForm({
        location: state.e2eAuctionLocation,
        startDateTime: state.e2eAuctionStart,
        endDateTime: state.e2eAuctionEnd,
      });
      await page.waitForTimeout(1000);
    });

    await test.step("Then Auction No should be auto-generated", async () => {
      const values = await form.getFormValues();
      expect(values.auctionNo).toBeTruthy();
      expect(Number(values.auctionNo)).toBeGreaterThan(0);
      saveState({ e2eBidAuctionNo: values.auctionNo });
    });

    await test.step("When I search for seller 'TEST SELLER ZAHID'", async () => {
      await form.searchSeller("TEST SELLER ZAHID");
    });

    await test.step("Then all 4 vehicles should appear", async () => {
      const rowCount = await form.getVehicleRowCount();
      expect(rowCount).toBe(4);
    });

    await test.step("When I select all vehicles and fill Lot No for each", async () => {
      await form.selectAllVehicles();
    });

    await test.step("And I save the assigned vehicle data", async () => {
      const vehicles = [];
      const rowCount = await form.getVehicleRowCount();
      for (let i = 0; i < rowCount; i++) {
        vehicles.push(await form.getVehicleRowData(i));
      }
      saveState({
        e2eVehicleCount: rowCount,
        e2eVehicleControlNo: vehicles[0].controlNo,
        e2eVehicleModel: vehicles[0].model,
        e2eSellerName: vehicles[0].sellerName,
      });
    });

    await test.step("And I click Next", async () => {
      await form.clickNext();
    });

    await test.step("Then the confirmation step should appear", async () => {
      await expect(form.saveButton).toBeVisible({ timeout: 10000 });
    });

    await test.step("When I click Save", async () => {
      await form.saveButton.click();
      await page.waitForTimeout(3000);
    });

    await test.step("Then a success message should appear", async () => {
      await expect(page.locator(".swal2-title")).toHaveText("Success", { timeout: 10000 });
    });

    await test.step("And I confirm the success dialog", async () => {
      await page.locator(".swal2-confirm").click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
    });
  });

  test("E2E-003: verify bid auction appears in Open House list", async ({ page }) => {
    test.setTimeout(60000);
    const state = loadState();
    test.skip(!state.e2eBidAuctionNo, "E2E-002 did not create a bid auction");

    const list = new AuctionListPage(page);

    await test.step("Given I navigate to the Auction List and select Open House tab", async () => {
      await list.goto();
      await list.clickOpenHouseTab();
    });

    await test.step("Then the newly created bid auction should appear in the list", async () => {
      await list.search(state.e2eBidAuctionNo);
      await page.waitForTimeout(2000);
      const rowCount = await list.getOpenHouseRowCount();
      expect(rowCount).toBeGreaterThan(0);
    });

    await test.step("And the auction data should match what was created", async () => {
      const row = await list.getOpenHouseRowData(0);
      expect(row.auctionNo).toBe(state.e2eBidAuctionNo);
      expect(row.location).toBe(state.e2eAuctionLocation);
    });
  });

  test("E2E-004: cleanup - delete master auction schedule", async ({ page }) => {
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
