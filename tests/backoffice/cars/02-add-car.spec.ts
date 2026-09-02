import { test, expect } from "@playwright/test";
import { CarListPage } from "../../../pages/backoffice/CarListPage";
import { CarFormPage } from "../../../pages/backoffice/CarFormPage";
import { selectSelect2 } from "../../../utils/select2";
import { selectMakeModelVariant, setDateField, fillStartPrice } from "../../../utils/dropdown";
import { generateCarData, generateRandom } from "../../../fixtures/car-data";
import { saveState, loadState } from "../../../fixtures/test-state";

const RND = generateRandom();
const VALID_CAR_DATA = generateCarData(RND);

test.describe("Cars > Add", () => {
  test.describe.configure({ mode: "serial" });

  test("CA-001: add car form loads correctly", async ({ page }) => {
    await test.step("Given I navigate to the add car page", async () => {
      await page.goto("/wp-admin/car/add-car");
      await page.waitForLoadState("networkidle");
    });

    await test.step("Then the page heading should be New Car", async () => {
      await expect(page.locator("h1")).toContainText("New Car");
    });

    await test.step("And VCN field should have a value", async () => {
      const vcn = await page.locator("#vehicle_control_number").inputValue();
      expect(vcn).toBeTruthy();
    });

    await test.step("And the submit button should be visible", async () => {
      const form = new CarFormPage(page);
      await expect(form.submitButton).toBeVisible();
    });
  });

  test("CA-002: VCN is auto-generated", async ({ page }) => {
    await test.step("Given I navigate to the add car page", async () => {
      await page.goto("/wp-admin/car/add-car");
      await page.waitForLoadState("networkidle");
    });

    await test.step("Then VCN should be a numeric value with at least 5 digits", async () => {
      const vcn = await page.locator("#vehicle_control_number").inputValue();
      expect(vcn).toMatch(/^\d+$/);
      expect(vcn.length).toBeGreaterThanOrEqual(5);
    });
  });

  test("CA-003: mandatory field validation prevents empty submit", async ({ page }) => {
    await test.step("Given I am on the add car page with VCN cleared", async () => {
      await page.goto("/wp-admin/car/add-car");
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => {
        const vcn = document.getElementById("vehicle_control_number") as HTMLInputElement;
        if (vcn && !vcn.readOnly) vcn.value = "";
      });
    });

    await test.step("When I submit the form without filling required fields", async () => {
      const form = new CarFormPage(page);
      await form.submit();
      await page.waitForTimeout(2000);
    });

    await test.step("Then I should remain on the add car page", async () => {
      expect(page.url()).toContain("add-car");
    });
  });

  test("CA-004: fill and submit add car form", async ({ page }) => {
    test.setTimeout(90000);

    await test.step("Given I navigate to the add car page", async () => {
      await page.goto("/wp-admin/car/add-car");
      await page.waitForLoadState("networkidle");
    });

    await test.step("And I save the auto-generated VCN", async () => {
      const vcn = await page.locator("#vehicle_control_number").inputValue();
      saveState({ createdVcn: vcn });
    });

    await test.step("When I select location and seller", async () => {
      await selectSelect2(page, "location", "JBAP");
      await selectSelect2(page, "seller", "TEST SELLER ZAHID");
      await page.waitForTimeout(500);
    });

    await test.step("And I fill all car information fields", async () => {
      const form = new CarFormPage(page);
      await form.fillForm(VALID_CAR_DATA);
      await page.waitForTimeout(1000);
    });

    await test.step("And I select Make, Model, and Variant", async () => {
      await selectMakeModelVariant(page, "TOYOTA");
    });

    await test.step("And I select storage pool and year model", async () => {
      await selectSelect2(page, "pool_storage_id", "JBAP");
      await selectSelect2(page, "year_model", "2024");
    });

    await test.step("And I fill start price and date fields", async () => {
      await fillStartPrice(page, "100000");
      await setDateField(page, "date_last_registration", "01/01/2025");
      await setDateField(page, "estimated_arrival_date", "12/31/2026");
    });

    await test.step("And I submit the form", async () => {
      const form = new CarFormPage(page);
      await page.waitForTimeout(1000);
      await form.submit();
      await page.waitForTimeout(1000);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Then the car should be created and I should leave the add car page", async () => {
      expect(page.url()).not.toContain("/car/add-car");
    });
  });

  test("CA-006: verify created car appears in car list", async ({ page }) => {
    const { createdVcn } = loadState();
    test.skip(!createdVcn, "CA-004 did not produce a VCN");

    await test.step("Given I navigate to the car list page", async () => {
      await page.goto("/wp-admin/car/list");
      await page.waitForLoadState("networkidle");
    });

    await test.step("When I search by the created car VCN", async () => {
      const carList = new CarListPage(page);
      await carList.searchByKeyword(createdVcn!);
    });

    await test.step("Then the created car should appear in the search results", async () => {
      const carList = new CarListPage(page);
      const rowCount = await carList.getRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(1);
      const resultVcn = await carList.getFirstRowVehicleControlNo();
      expect(resultVcn).toContain(createdVcn!);
    });

    await test.step("And I extract the VID for subsequent tests", async () => {
      const carList = new CarListPage(page);
      const firstRowLink = carList.table.locator("tbody tr").first().locator("a").first();
      const href = await firstRowLink.getAttribute("href") ?? "";
      const vidMatch = href.match(/vid\/(\d+)/);
      if (vidMatch) {
        saveState({ createdVid: parseInt(vidMatch[1], 10) });
      }
      const { createdVid } = loadState();
      expect(createdVid).toBeGreaterThan(0);
    });
  });

  test("CA-005: dependent dropdowns Make > Model > Variant", async ({ page }) => {
    await test.step("Given I am on the add car page", async () => {
      await page.goto("/wp-admin/car/add-car");
      await page.waitForLoadState("networkidle");
    });

    await test.step("When I select Make as TOYOTA", async () => {
      await page.locator("#make").selectOption({ label: "TOYOTA" });
      await page.waitForTimeout(2000);
    });

    await test.step("Then Model dropdown should load available models", async () => {
      const modelOptions = await page.locator("#model option").allTextContents();
      const nonEmptyModels = modelOptions.filter(
        (opt) => !opt.includes("Choose") && opt.trim() !== ""
      );
      expect(nonEmptyModels.length).toBeGreaterThan(0);
    });

    await test.step("When I select a Model", async () => {
      const modelOptions = await page.locator("#model option").allTextContents();
      const nonEmptyModels = modelOptions.filter(
        (opt) => !opt.includes("Choose") && opt.trim() !== ""
      );
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
    });

    await test.step("Then Variant dropdown should load available variants", async () => {
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
});
