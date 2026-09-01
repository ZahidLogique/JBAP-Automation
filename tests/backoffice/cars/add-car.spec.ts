import { test, expect } from "@playwright/test";
import { CarFormPage, CarFormData } from "../../../pages/backoffice/CarFormPage";

const ADD_CAR_URL = "/wp-admin/car/add-car";

const VALID_CAR_DATA: Partial<CarFormData> = {
  storageStatus: "Storage",
  carAddress: "Test Address Automation",
  crNo: "AUTO-CR-001",
  plateNumber: "TEST001",
  csNumber: "AUTO-CS-001",
  make: "TOYOTA",
  bodyType: "General 4 Door",
  vehicleType: "Sedan",
  fuelType: "Gas",
  transmissionType: "Automatic",
  displacement: "1500",
  numberOfWheels: "4",
  seatingCapacity: "5",
  numberOfDoors: "4",
  color: "WHITE",
  vehicleClassification: "Private",
  chassisNumber: "AUTOCHASSIS000001",
  engineNumber: "AUTOENGINE0000001",
  mvFileNumber: "AUTOMVFILE00000001",
  lastMiscTransaction: "AUTO-MISC-001",
  ownerName: "Test Owner Automation",
  ownerAddress: "Test Owner Address",
  office: "Test Office",
  officeCode: "TO-001",
  orNo: "AUTO-OR-001",
  mileage: "10000",
  vehicleOwnershipStatus: "Owned",
};

async function selectSelect2(page: import("@playwright/test").Page, fieldId: string, searchText: string) {
  const container = page.locator(`#select2-${fieldId}-container`);
  if (await container.count() > 0) {
    await container.click();
  } else {
    await page.locator(`[aria-labelledby="select2-${fieldId}-container"]`).click();
  }
  await page.waitForTimeout(500);
  const searchField = page.locator(".select2-search__field");
  if (await searchField.count() > 0 && await searchField.isVisible()) {
    await searchField.fill(searchText);
    await page.waitForTimeout(1000);
  }
  await page.locator(".select2-results__option:not(.select2-results__option--highlighted)").first().waitFor({ timeout: 5000 }).catch(() => {});
  const options = page.locator(".select2-results__option").filter({ hasText: searchText });
  if (await options.count() > 0) {
    await options.first().click();
  } else {
    await page.locator(".select2-results__option").first().click();
  }
  await page.waitForTimeout(500);
}

test.describe("Add car", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADD_CAR_URL);
    await page.waitForLoadState("networkidle");
  });

  test("CA-001: add car form loads correctly", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("New Car");

    const vcn = await page.locator("#vehicle_control_number").inputValue();
    expect(vcn).toBeTruthy();

    const form = new CarFormPage(page);
    await expect(form.submitButton).toBeVisible();
  });

  test("CA-002: VCN is auto-generated", async ({ page }) => {
    const vcn = await page.locator("#vehicle_control_number").inputValue();
    expect(vcn).toMatch(/^\d+$/);
    expect(vcn.length).toBeGreaterThanOrEqual(5);
  });

  test("CA-003: mandatory field validation prevents empty submit", async ({ page }) => {
    const form = new CarFormPage(page);

    await page.evaluate(() => {
      const vcn = document.getElementById("vehicle_control_number") as HTMLInputElement;
      if (vcn && !vcn.readOnly) vcn.value = "";
    });

    await form.submit();
    await page.waitForTimeout(2000);

    expect(page.url()).toContain("add-car");
  });

  test("CA-004: fill and submit add car form", async ({ page }) => {
    test.setTimeout(60000);
    const form = new CarFormPage(page);

    await selectSelect2(page, "location", "JBAP");
    await selectSelect2(page, "seller", "JBA");
    await page.waitForTimeout(500);

    await form.fillForm(VALID_CAR_DATA);
    await page.waitForTimeout(1000);

    // Storage/Pool after storage status is set
    await selectSelect2(page, "pool_storage_id", "JBAP");

    // Year Model
    await selectSelect2(page, "year_model", "2024");

    // Start Price — use type() instead of fill() to trigger all JS events
    const startPriceField = page.locator("#start_price");
    await startPriceField.scrollIntoViewIfNeeded();
    await startPriceField.click();
    await startPriceField.clear();
    await startPriceField.pressSequentially("100000", { delay: 50 });
    await page.waitForTimeout(500);

    // Date fields via JS (date pickers)
    await page.evaluate(() => {
      const dateReg = document.querySelector("#date_last_registration") as HTMLInputElement;
      if (dateReg) {
        dateReg.value = "01/01/2025";
        dateReg.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const estDate = document.querySelector("#estimated_arrival_date") as HTMLInputElement;
      if (estDate) {
        estDate.value = "12/31/2026";
        estDate.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    await page.waitForTimeout(1000);
    await form.submit();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const successIndicator = page.locator(
      ".alert-success, .toast-success, .swal2-popup, [class*='success']"
    );
    const isRedirected =
      currentUrl.includes("/car/list") ||
      currentUrl.includes("/car/car-inventory") ||
      currentUrl.includes("/car/detail");
    const hasSuccess = (await successIndicator.count()) > 0 || isRedirected;

    if (!hasSuccess) {
      const fieldRequired = page.locator("text=Field Required");
      const reqCount = await fieldRequired.count();
      if (reqCount > 0) {
        console.log(`Still has ${reqCount} "Field Required" errors`);
      }
      const validationErrors = page.locator("text=Minimum length, text=Must be");
      const valCount = await validationErrors.count();
      for (let i = 0; i < Math.min(valCount, 5); i++) {
        const text = await validationErrors.nth(i).textContent();
        console.log(`Validation: ${text?.trim()}`);
      }
    }

    expect(hasSuccess).toBeTruthy();
  });

  test("CA-005: dependent dropdowns Make → Model → Variant", async ({ page }) => {
    const makeSelect = page.locator("#make");
    await makeSelect.selectOption({ label: "TOYOTA" });
    await page.waitForTimeout(2000);

    const modelOptions = await page.locator("#model option").allTextContents();
    const nonEmptyModels = modelOptions.filter(
      (opt) => !opt.includes("Choose") && opt.trim() !== ""
    );
    expect(nonEmptyModels.length).toBeGreaterThan(0);

    // Pick "Vios" or a common model that has variants
    const preferredModels = ["Vios", "Fortuner", "innova", "Avanza", "Hilux"];
    let selectedModel = nonEmptyModels[0];
    for (const pref of preferredModels) {
      if (nonEmptyModels.includes(pref)) {
        selectedModel = pref;
        break;
      }
    }

    await page.locator("#model").selectOption({ label: selectedModel });
    await page.waitForTimeout(2000);

    const variantSelect = page.locator("#variant");
    if (await variantSelect.count() > 0) {
      const variantOptions = await variantSelect.locator("option").allTextContents();
      const nonEmptyVariants = variantOptions.filter(
        (opt) => !opt.includes("Choose") && !opt.includes("Select") && opt.trim() !== ""
      );
      expect(nonEmptyVariants.length).toBeGreaterThan(0);
    }
  });
});
