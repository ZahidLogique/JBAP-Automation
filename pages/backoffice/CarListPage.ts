import { Page, Locator, expect } from "@playwright/test";

export class CarListPage {
  readonly table: Locator;
  readonly searchKeyword: Locator;
  readonly searchButton: Locator;

  constructor(private page: Page) {
    this.table = page.locator("table");
    this.searchKeyword = page.locator("#keyword, input[name='keyword']");
    this.searchButton = page.getByRole("button", { name: "Search", exact: true });
  }

  async goto() {
    await this.page.goto("/wp-admin/car/list");
    await this.page.waitForLoadState("networkidle");
  }

  async getRowCount(): Promise<number> {
    return await this.table.locator("tbody tr").count();
  }

  async getFirstRowVehicleControlNo(): Promise<string> {
    return (
      (await this.table.locator("tbody tr").first().locator("td").first().textContent()) ?? ""
    ).trim();
  }

  async getFirstRowData(): Promise<Record<string, string>> {
    const row = this.table.locator("tbody tr").first();
    const cells = row.locator("td");
    const count = await cells.count();
    const data: Record<string, string> = {};
    for (let i = 0; i < count; i++) {
      data[`col${i}`] = ((await cells.nth(i).textContent()) ?? "").trim();
    }
    return data;
  }

  async openActionDropdown(rowIndex: number) {
    const row = this.table.locator("tbody tr").nth(rowIndex);
    const dropdownToggle = row.getByText("Options").first();
    await dropdownToggle.scrollIntoViewIfNeeded();
    await dropdownToggle.click();
    await this.page.waitForTimeout(500);
  }

  async clickEditOnRow(rowIndex: number) {
    await this.openActionDropdown(rowIndex);
    await this.page.getByText("Edit", { exact: true }).first().click();
  }

  async clickChangeHistoryOnRow(rowIndex: number) {
    await this.openActionDropdown(rowIndex);
    await this.page.getByText("Change History").first().click();
    await this.page.waitForTimeout(1000);
  }

  async clickDetailOnRow(rowIndex: number) {
    const row = this.table.locator("tbody tr").nth(rowIndex);
    await row.locator("td").first().locator("a").click();
  }

  async searchByKeyword(keyword: string) {
    await this.searchKeyword.clear();
    await this.searchKeyword.fill(keyword);
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async filterBySeller(sellerName: string) {
    const sellerDropdown = this.page.locator("#seller_filter, select[name='seller']");
    if (await sellerDropdown.count() > 0) {
      await sellerDropdown.selectOption({ label: sellerName });
    }
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async filterByMake(makeName: string) {
    const makeDropdown = this.page.locator("#make_filter, select[name='make']");
    if (await makeDropdown.count() > 0) {
      await makeDropdown.selectOption({ label: makeName });
    }
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async filterByStorageStatus(status: string) {
    const statusDropdown = this.page.locator("#storage_status_filter, select[name='storage_status']");
    if (await statusDropdown.count() > 0) {
      await statusDropdown.selectOption({ label: status });
    }
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }
}
