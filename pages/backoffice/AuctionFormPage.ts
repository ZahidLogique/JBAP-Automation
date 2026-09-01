import { Page, Locator } from "@playwright/test";
import { setDateField } from "../../utils/dropdown";
import { AuctionFormData } from "../../fixtures/auction-data";

export interface SubmitResult {
  success: boolean;
  message: string;
}

export class AuctionFormPage {
  readonly locationSelect: Locator;
  readonly noInput: Locator;
  readonly startInput: Locator;
  readonly endInput: Locator;
  readonly submitButton: Locator;

  constructor(private page: Page) {
    // Add form: <select id="location" name="location"> is the real, editable field.
    // Edit form: that same field is locked — a disabled display-only <select name="locationx">
    // sits next to a hidden <input id="location">, so this locator only ever matches on Add.
    this.locationSelect = page.locator("#form-lelang select#location");
    this.noInput = page.locator("#form-lelang #no");
    this.startInput = page.locator("#form-lelang #start");
    this.endInput = page.locator("#form-lelang #end");
    this.submitButton = page.locator("#form-lelang").getByRole("button", { name: /submit|update/i });
  }

  async fillForm(data: AuctionFormData) {
    if (data.location) {
      const count = await this.locationSelect.count();
      if (count > 0) {
        await this.locationSelect.selectOption({ label: data.location });
      }
      // else: this is the Edit form — location is locked, nothing to do
    }
    if (data.no) {
      const count = await this.noInput.count();
      const isReadonly = count > 0 ? await this.noInput.getAttribute("readonly") : "locked";
      if (isReadonly === null) {
        await this.noInput.fill(data.no);
      }
    }
    if (data.start) await setDateField(this.page, "start", data.start);
    if (data.end) await setDateField(this.page, "end", data.end);
  }

  async submit(): Promise<SubmitResult> {
    await this.submitButton.click();
    const popup = this.page.locator(".swal2-popup");
    await popup.waitFor({ state: "visible", timeout: 15000 });
    const title = ((await popup.locator(".swal2-title").textContent()) ?? "").trim();
    const text = ((await popup.locator(".swal2-html-container").textContent()) ?? "").trim();
    const success = title.toLowerCase() === "success";

    const closeBtn = popup.locator(".swal2-close");
    if ((await closeBtn.count()) > 0) {
      await closeBtn.click();
    } else {
      await this.page.keyboard.press("Escape");
    }
    await this.page.waitForTimeout(1000);

    return { success, message: text || title };
  }
}
