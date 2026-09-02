import { Page, Locator } from "@playwright/test";
import { setDateField } from "../../utils/dropdown";
import { selectSelect2 } from "../../utils/select2";

export interface BidAuctionFormData {
  location?: string;
  auctionNo?: string;
  startDateTime?: string;
  endDateTime?: string;
}

export class BidAuctionFormPage {
  readonly locationSelect: Locator;
  readonly auctionNoInput: Locator;
  readonly startInput: Locator;
  readonly endInput: Locator;
  readonly vehicleSelect: Locator;
  readonly vehicleSearchButton: Locator;
  readonly vehicleTable: Locator;
  readonly nextButton: Locator;
  readonly saveButton: Locator;
  readonly previousButton: Locator;
  readonly cancelButton: Locator;

  constructor(private page: Page) {
    this.locationSelect = page.locator("select#location");
    this.auctionNoInput = page.locator("input#auction_no");
    this.startInput = page.locator("input#start_date");
    this.endInput = page.locator("input#end_date");
    this.vehicleSelect = page.locator("select#seller");
    this.vehicleSearchButton = page.locator("button#get-seller");
    this.vehicleTable = page.locator("table").first();
    this.nextButton = page.locator("button#next");
    this.saveButton = page.locator("button#simpan");
    this.previousButton = page.locator("button#kembali");
    this.cancelButton = page.locator("a#batal");
  }

  async fillForm(data: BidAuctionFormData) {
    if (data.location) {
      await this.locationSelect.selectOption({ label: data.location });
      await this.page.waitForTimeout(2000);
    }
    if (data.startDateTime) {
      await setDateField(this.page, "start_date", data.startDateTime);
    }
    if (data.endDateTime) {
      await setDateField(this.page, "end_date", data.endDateTime);
    }
  }

  async getFormValues(): Promise<BidAuctionFormData> {
    return {
      location: await this.locationSelect.inputValue(),
      auctionNo: await this.auctionNoInput.inputValue(),
      startDateTime: await this.startInput.inputValue(),
      endDateTime: await this.endInput.inputValue(),
    };
  }

  async getVehicleTableHeaders(): Promise<string[]> {
    const headers = await this.vehicleTable.locator("thead th").allTextContents();
    return headers.map(h => h.trim());
  }

  async getVehicleRowCount(): Promise<number> {
    return await this.vehicleTable.locator("tbody tr").count();
  }

  async searchSeller(sellerName: string) {
    await selectSelect2(this.page, "seller", sellerName);
    await this.vehicleSearchButton.click();
    await this.page.waitForTimeout(3000);
  }

  async selectVehicle(rowIndex: number = 0) {
    const checkbox = this.vehicleTable.locator("tbody tr").nth(rowIndex).locator("input[type='checkbox']");
    await checkbox.check();
    await this.page.waitForTimeout(500);
  }

  async fillLotNo(rowIndex: number = 0, lotNo: string = "1") {
    const row = this.vehicleTable.locator("tbody tr").nth(rowIndex);
    const lotInput = row.locator("input").last();
    await lotInput.clear();
    await lotInput.fill(lotNo);
    await this.page.waitForTimeout(300);
  }

  async getVehicleRowData(rowIndex: number = 0) {
    const row = this.vehicleTable.locator("tbody tr").nth(rowIndex);
    const cells = row.locator("td");
    return {
      controlNo: ((await cells.nth(1).textContent()) ?? "").trim(),
      model: ((await cells.nth(2).textContent()) ?? "").trim(),
      plateNumber: ((await cells.nth(3).textContent()) ?? "").trim(),
      sellerName: ((await cells.nth(4).textContent()) ?? "").trim(),
      startPrice: ((await cells.nth(5).textContent()) ?? "").trim(),
      minBidPrice: ((await cells.nth(6).textContent()) ?? "").trim(),
    };
  }

  async clickNext() {
    await this.nextButton.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);
  }
}
