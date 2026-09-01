import { Page, Locator } from "@playwright/test";

export interface AuctionRow {
  location: string;
  no: string;
  start: string;
  end: string;
}

export interface DeleteResult {
  success: boolean;
  message: string;
}

export class AuctionSchedulePage {
  readonly table: Locator;
  readonly addAuctionButton: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(private page: Page) {
    this.table = page.locator("table");
    this.addAuctionButton = page.locator("a", { hasText: "Add Auction" });
    this.searchInput = page.locator("input[type='search'], input[placeholder='Search']").first();
    this.searchButton = page.locator("button").filter({ has: page.locator("svg, .fa-search, i[class*='search']") }).first();
  }

  async goto() {
    await this.page.goto("/wp-admin/auction-master", { timeout: 60000 });
    await this.page.waitForLoadState("networkidle", { timeout: 60000 });
  }

  async getRowCount(): Promise<number> {
    return await this.table.locator("tbody tr").count();
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchButton.click();
    await this.page.waitForTimeout(1500);
  }

  async findRowIndexByAuctionNo(no: string): Promise<number> {
    const rows = this.table.locator("tbody tr");
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator("td");
      // DataTables renders a single-cell "No data available" row when a search
      // has zero matches — skip rows that don't have a second column at all.
      if ((await cells.count()) < 2) continue;
      const text = (await cells.nth(1).textContent()) ?? "";
      if (text.trim() === no) return i;
    }
    return -1;
  }

  async getRowData(rowIndex: number): Promise<AuctionRow> {
    const row = this.table.locator("tbody tr").nth(rowIndex);
    const cells = row.locator("td");
    return {
      location: ((await cells.nth(0).textContent()) ?? "").trim(),
      no: ((await cells.nth(1).textContent()) ?? "").trim(),
      start: ((await cells.nth(2).textContent()) ?? "").trim().replace(/\s+/g, " "),
      end: ((await cells.nth(3).textContent()) ?? "").trim().replace(/\s+/g, " "),
    };
  }

  async clickAddAuction() {
    await this.addAuctionButton.click();
    await this.page.locator("#form-lelang select#location").waitFor({ state: "visible", timeout: 15000 });
  }

  async clickEditOnRow(rowIndex: number) {
    const row = this.table.locator("tbody tr").nth(rowIndex);
    await row.locator("a, button").filter({ hasText: "Edit" }).first().click();
    await this.page.locator("#form-lelang #start").waitFor({ state: "visible", timeout: 15000 });
  }

  async deleteRowAndConfirm(rowIndex: number): Promise<DeleteResult> {
    const row = this.table.locator("tbody tr").nth(rowIndex);
    await row.locator("a, button").filter({ hasText: "Delete" }).first().click();

    const confirmPopup = this.page.locator(".swal2-popup");
    await confirmPopup.waitFor({ state: "visible", timeout: 10000 });

    await Promise.all([
      this.page.waitForResponse((res) => res.url().includes("/auction-master/delete/"), { timeout: 15000 }),
      confirmPopup.getByRole("button", { name: "Yes, Continue!" }).click(),
    ]);
    await this.page.waitForTimeout(500);

    const title = ((await this.page.locator(".swal2-title").textContent()) ?? "").trim();
    const text = ((await this.page.locator(".swal2-html-container").textContent()) ?? "").trim();
    const success = title.toLowerCase() === "success";

    const okBtn = this.page.getByRole("button", { name: "OK" });
    if ((await okBtn.count()) > 0) {
      await okBtn.click();
    } else {
      await this.page.keyboard.press("Escape");
    }
    await this.page.waitForTimeout(500);

    return { success, message: text || title };
  }
}
