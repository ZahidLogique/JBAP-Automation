import { Page, Locator } from "@playwright/test";

export class CarDetailPage {
  readonly editCarButton: Locator;
  readonly backButton: Locator;

  constructor(private page: Page) {
    this.editCarButton = page.getByRole("button", { name: "Edit Car" });
    this.backButton = page.getByRole("button", { name: "Back" });
  }

  async goto(vid: number) {
    await this.page.goto(`/wp-admin/car/detail/vid/${vid}`);
    await this.page.waitForLoadState("networkidle");
  }

  async getPageTitle(): Promise<string> {
    const heading = this.page.locator("h1");
    return ((await heading.textContent()) ?? "").trim();
  }

  private carInfoTable(): Locator {
    return this.page.locator("table", { hasText: "Car Information" }).first();
  }

  async getFieldValue(label: string): Promise<string> {
    const labelLoc = this.carInfoTable().locator(`text=${label}`).first();
    const container = labelLoc.locator("..");
    const fullText = ((await container.textContent()) ?? "").trim();
    return fullText.slice(label.length).replace(/^[:\s]+/, "").trim();
  }

  async isFieldVisible(label: string): Promise<boolean> {
    return await this.carInfoTable().locator(`text=${label}`).isVisible();
  }

  async clickEditCar() {
    await this.editCarButton.click();
  }

  async clickBack() {
    await this.backButton.click();
  }
}
