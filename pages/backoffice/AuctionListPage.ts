import { Page, Locator } from "@playwright/test";

export class AuctionListPage {
  readonly physicalAuctionTab: Locator;
  readonly openHouseAuctionTab: Locator;
  readonly locationFilter: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(private page: Page) {
    this.physicalAuctionTab = page.locator("a, button").filter({ hasText: "Physical Auction" }).first();
    this.openHouseAuctionTab = page.locator("a, button").filter({ hasText: "Open House Auction" }).first();
    this.locationFilter = page.locator("select").filter({ has: page.locator("option", { hasText: "Select location" }) }).first();
    this.searchInput = page.locator("input[type='search'], input[placeholder='Search']").first();
    this.searchButton = page.locator("button").filter({ has: page.locator("svg, .fa-search, i[class*='search']") }).first();
  }

  get openHouseTable(): Locator {
    return this.page.locator("#online_table");
  }

  get physicalTable(): Locator {
    return this.page.locator("#auction_datatable");
  }

  get addAuctionButton(): Locator {
    return this.page.locator("a, button").filter({ hasText: "Add Auction" });
  }

  async goto() {
    await this.page.goto("/wp-admin/auction/list", { timeout: 60000 });
    await this.page.waitForLoadState("networkidle", { timeout: 60000 });
  }

  async clickOpenHouseTab() {
    await this.openHouseAuctionTab.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(1000);
  }

  async clickPhysicalTab() {
    await this.physicalAuctionTab.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(1000);
  }

  async getOpenHouseRowCount(): Promise<number> {
    return await this.openHouseTable.locator("tbody tr").count();
  }

  async getTotalAuctionScheduleText(): Promise<string> {
    const totalText = this.page.locator("text=Total").first();
    return ((await totalText.textContent()) ?? "").trim();
  }

  async getOpenHouseRowData(rowIndex: number) {
    const row = this.openHouseTable.locator("tbody tr").nth(rowIndex);
    const cells = row.locator("td");
    return {
      location: ((await cells.nth(0).textContent()) ?? "").trim(),
      auctionNo: ((await cells.nth(1).textContent()) ?? "").trim(),
      startDateTime: ((await cells.nth(2).textContent()) ?? "").trim(),
      endDateTime: ((await cells.nth(3).textContent()) ?? "").trim(),
    };
  }

  async clickAddAuction() {
    const buttons = this.addAuctionButton;
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      if (await buttons.nth(i).isVisible()) {
        await buttons.nth(i).click();
        await this.page.waitForLoadState("networkidle");
        return;
      }
    }
    throw new Error("No visible Add Auction button found");
  }

  async search(keyword: string) {
    const inputs = this.page.locator("input[type='search'], input[placeholder='Search']");
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      if (await inputs.nth(i).isVisible()) {
        await inputs.nth(i).fill(keyword);
        break;
      }
    }
    const buttons = this.page.locator("button").filter({ has: this.page.locator("svg, .fa-search, i[class*='search']") });
    const btnCount = await buttons.count();
    for (let i = 0; i < btnCount; i++) {
      if (await buttons.nth(i).isVisible()) {
        await buttons.nth(i).click();
        break;
      }
    }
    await this.page.waitForTimeout(1500);
  }

  async filterByLocation(location: string) {
    await this.locationFilter.selectOption({ label: location });
    await this.searchButton.click();
    await this.page.waitForTimeout(1500);
  }
}
