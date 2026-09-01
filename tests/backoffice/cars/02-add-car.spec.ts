import { test, expect } from "@playwright/test";
import { CarListPage } from "../../../pages/backoffice/CarListPage";
import { CarFormPage } from "../../../pages/backoffice/CarFormPage";
import { selectSelect2 } from "../../../utils/select2";
import { selectMakeModelVariant, setDateField, fillStartPrice } from "../../../utils/dropdown";
import { generateCarData, generateRandom } from "../../../fixtures/car-data";
import { saveState, loadState } from "../../../fixtures/test-state";

const RND = generateRandom();
const VALID_CAR_DATA = generateCarData(RND);

test.describe("Add Car", () => {
  test.describe.configure({ mode: "serial" });

  test("CA-001: add car form loads correctly", async ({ page }) => {
    await page.goto("/wp-admin/car/add-car");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toContainText("New Car");

    const vcn = await page.locator("#vehicle_control_number").inputValue();
    expect(vcn).toBeTruthy();

    const form = new CarFormPage(page);
    await expect(form.submitButton).toBeVisible();
  });

  test("CA-002: VCN is auto-generated", async ({ page }) => {
    await page.goto("/wp-admin/car/add-car");
    await page.waitForLoadState("networkidle");

    const vcn = await page.locator("#vehicle_control_number").inputValue();
    expect(vcn).toMatch(/^\d+$/);
    expect(vcn.length).toBeGreaterThanOrEqual(5);
  });

  test("CA-003: mandatory field validation prevents empty submit", async ({ page }) => {
    await page.goto("/wp-admin/car/add-car");
    await page.waitForLoadState("networkidle");

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
    test.setTimeout(90000);
    await page.goto("/wp-admin/car/add-car");
    await page.waitForLoadState("networkidle");

    const form = new CarFormPage(page);

    const vcn = await page.locator("#vehicle_control_number").inputValue();
    saveState({ createdVcn: vcn });

    await selectSelect2(page, "location", "JBAP");
    await selectSelect2(page, "seller", "TEST SELLER ZAHID");
    await page.waitForTimeout(500);

    await form.fillForm(VALID_CAR_DATA);
    await page.waitForTimeout(1000);

    await selectMakeModelVariant(page, "TOYOTA");

    await selectSelect2(page, "pool_storage_id", "JBAP");
    await selectSelect2(page, "year_model", "2024");

    await fillStartPrice(page, "100000");

    await setDateField(page, "date_last_registration", "01/01/2025");
    await setDateField(page, "estimated_arrival_date", "12/31/2026");

    await page.waitForTimeout(1000);
    await form.submit();
    await page.waitForTimeout(1000);
    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    expect(currentUrl).not.toContain("/car/add-car");
  });

  test("CA-006: verify created car appears in car list", async ({ page }) => {
    const { createdVcn } = loadState();
    test.skip(!createdVcn, "CA-004 did not produce a VCN");

    await page.goto("/wp-admin/car/list");
    await page.waitForLoadState("networkidle");

    const carList = new CarListPage(page);
    await carList.searchByKeyword(createdVcn!);

    const rowCount = await carList.getRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    const resultVcn = await carList.getFirstRowVehicleControlNo();
    expect(resultVcn).toContain(createdVcn!);

    const firstRowLink = carList.table.locator("tbody tr").first().locator("a").first();
    const href = await firstRowLink.getAttribute("href") ?? "";
    const vidMatch = href.match(/vid\/(\d+)/);
    if (vidMatch) {
      saveState({ createdVid: parseInt(vidMatch[1], 10) });
    }
    const { createdVid } = loadState();
    expect(createdVid).toBeGreaterThan(0);
  });

  test("CA-005: dependent dropdowns Make > Model > Variant", async ({ page }) => {
    await page.goto("/wp-admin/car/add-car");
    await page.waitForLoadState("networkidle");

    const makeSelect = page.locator("#make");
    await makeSelect.selectOption({ label: "TOYOTA" });
    await page.waitForTimeout(2000);

    const modelOptions = await page.locator("#model option").allTextContents();
    const nonEmptyModels = modelOptions.filter(
      (opt) => !opt.includes("Choose") && opt.trim() !== ""
    );
    expect(nonEmptyModels.length).toBeGreaterThan(0);

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
