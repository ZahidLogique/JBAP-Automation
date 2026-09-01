import { Page, Locator } from "@playwright/test";

export class CarDetailPage {
  readonly editCarButton: Locator;
  readonly backButton: Locator;

  constructor(private page: Page) {
    this.editCarButton = page.getByRole("link", { name: "Edit Car" });
    this.backButton = page.getByRole("link", { name: "Back" });
  }

  async goto(vid: number) {
    await this.page.goto(`/wp-admin/car/detail/vid/${vid}`);
    await this.page.waitForLoadState("networkidle");
  }

  async getPageTitle(): Promise<string> {
    const heading = this.page.locator("h1");
    return ((await heading.textContent()) ?? "").trim();
  }

  async getFieldValue(label: string): Promise<string> {
    const row = this.page.locator(`text=${label}`).locator("..").locator("td, dd, span").last();
    return ((await row.textContent()) ?? "").trim();
  }

  async isFieldVisible(label: string): Promise<boolean> {
    return await this.page.locator(`text=${label}`).isVisible();
  }

  async clickEditCar() {
    await this.editCarButton.click();
  }

  async clickBack() {
    await this.backButton.click();
  }
}
