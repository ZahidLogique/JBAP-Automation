import { test, expect } from "@playwright/test";
import { AuctionListPage } from "../../../pages/backoffice/AuctionListPage";

test.describe("Auction - Auction List > List", () => {
  test.describe.configure({ mode: "serial" });

  test("OAL-001: auction list page loads correctly", async ({ page }) => {
    const list = new AuctionListPage(page);

    await test.step("Given I navigate to the auction list page", async () => {
      await list.goto();
    });

    await test.step("Then the page should display Physical Auction and Open House Auction tabs", async () => {
      await expect(list.physicalAuctionTab).toBeVisible();
      await expect(list.openHouseAuctionTab).toBeVisible();
    });
  });

  test("OAL-002: open house auction list displays data", async ({ page }) => {
    const list = new AuctionListPage(page);

    await test.step("Given I navigate to the auction list page", async () => {
      await list.goto();
    });

    await test.step("When I click the Open House Auction tab", async () => {
      await list.clickOpenHouseTab();
    });

    await test.step("Then I should see the Open House Auction List heading", async () => {
      await expect(page.locator("h1, h2, h3").filter({ hasText: "Open House Auction List" }).first()).toBeVisible();
    });

    await test.step("And the Open House table should display auction data", async () => {
      await expect(list.openHouseTable).toBeVisible();
      const rowCount = await list.getOpenHouseRowCount();
      expect(rowCount).toBeGreaterThan(0);
    });

    await test.step("And the table should have expected columns", async () => {
      const headers = await list.openHouseTable.locator("thead th").allTextContents();
      const normalized = headers.map(h => h.trim());
      expect(normalized).toEqual(
        expect.arrayContaining(["Location", "Auction No", "Auction Start Date/Time", "Auction End Date/Time", "Action"])
      );
    });

    await test.step("And the total auction schedule count should be visible", async () => {
      const totalText = await list.getTotalAuctionScheduleText();
      expect(totalText).toContain("Auction Schedule");
    });
  });

  test("OAL-003: Add Auction button is visible on Open House tab", async ({ page }) => {
    const list = new AuctionListPage(page);

    await test.step("Given I am on the Open House Auction list", async () => {
      await list.goto();
      await list.clickOpenHouseTab();
    });

    await test.step("Then the Add Auction button should be visible", async () => {
      const buttons = list.addAuctionButton;
      const count = await buttons.count();
      let hasVisible = false;
      for (let i = 0; i < count; i++) {
        if (await buttons.nth(i).isVisible()) {
          hasVisible = true;
          break;
        }
      }
      expect(hasVisible).toBeTruthy();
    });
  });
});
