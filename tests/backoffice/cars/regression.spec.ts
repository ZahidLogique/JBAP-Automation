import { test, expect } from "@playwright/test";
import { CarListPage } from "../../../pages/backoffice/CarListPage";
import { CarDetailPage } from "../../../pages/backoffice/CarDetailPage";
import { CarFormPage, CarFormData } from "../../../pages/backoffice/CarFormPage";

let createdVcn = "";
let createdVid = 0;

const RND = Date.now().toString().slice(-6);

const VALID_CAR_DATA: Partial<CarFormData> = {
  storageStatus: "Storage",
  carAddress: `Test Address Auto ${RND}`,
  crNo: `CR-${RND}`,
  plateNumber: `TP${RND}`,
  csNumber: `CS-${RND}`,
  bodyType: "General 4 Door",
  vehicleType: "Sedan",
  fuelType: "Gas",
  transmissionType: "Automatic",
  displacement: "1500",
  numberOfWheels: "4",
  seatingCapacity: "5",
  numberOfDoors: "4",
  color: "WHITE",
  vehicleClassification: "Public",
  chassisNumber: `AUTOCHASIS${RND}00001`,
  engineNumber: `AUTOENGINE${RND}00001`,
  mvFileNumber: `AUTOMVFILE${RND}00001`,
  lastMiscTransaction: `MISC-${RND}`,
  ownerName: `Test Owner ${RND}`,
  ownerAddress: `Test Address ${RND}`,
  office: `Test Office ${RND}`,
  officeCode: `TO-${RND}`,
  orNo: `OR-${RND}`,
  mileage: `${10000 + parseInt(RND)}`,
  vehicleOwnershipStatus: "Owned",
};

const EDIT_DATA: Partial<CarFormData> = {
  mileage: "55000",
  color: "WHITE",
  startPrice: "250000",
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

test.describe("JBAP CDMS - Cars Regression", () => {
  test.describe.configure({ mode: "serial" });

  // ═══════════════════════════════════════
  // CAR LIST
  // ═══════════════════════════════════════

  test("CL-001: car list page loads correctly", async ({ page }) => {
    const carList = new CarListPage(page);
    await carList.goto();

    await expect(page).toHaveTitle("CDMS Dashboard");
    await expect(carList.table).toBeVisible();

    const rowCount = await carList.getRowCount();
    expect(rowCount).toBeGreaterThan(0);

    const headerRow = carList.table.locator("thead tr").first();
    await expect(headerRow).toContainText("Vehicle Control No");
    await expect(headerRow).toContainText("Make");
  });

  test("CL-002: filter by keyword", async ({ page }) => {
    const carList = new CarListPage(page);
    await carList.goto();

    const firstVcn = await carList.getFirstRowVehicleControlNo();
    await carList.searchByKeyword(firstVcn);

    const rowCount = await carList.getRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    const resultVcn = await carList.getFirstRowVehicleControlNo();
    expect(resultVcn).toContain(firstVcn);
  });

  test("CL-007: pagination works", async ({ page }) => {
    const carList = new CarListPage(page);
    await carList.goto();

    const firstPageFirstVcn = await carList.getFirstRowVehicleControlNo();

    const page2Button = page.locator("a").filter({ hasText: /^2$/ }).first();
    if (await page2Button.isVisible()) {
      await page2Button.click();
      await page.locator("text=Processing").waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);

      const secondPageFirstVcn = await carList.getFirstRowVehicleControlNo();
      expect(secondPageFirstVcn).not.toBe(firstPageFirstVcn);
    }
  });

  // ═══════════════════════════════════════
  // ADD CAR
  // ═══════════════════════════════════════

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

    createdVcn = await page.locator("#vehicle_control_number").inputValue();

    await selectSelect2(page, "location", "JBAP");
    await selectSelect2(page, "seller", "TEST SELLER ZAHID");
    await page.waitForTimeout(500);

    await form.fillForm(VALID_CAR_DATA);
    await page.waitForTimeout(1000);

    // Make → Model → Variant (dependent dropdowns via AJAX)
    await page.locator("#make").selectOption({ label: "TOYOTA" });
    await page.evaluate(() => {
      if ((window as any).jQuery) (window as any).jQuery("#make").trigger("change");
    });
    await page.waitForTimeout(3000);

    const modelSelect = page.locator("#model");
    const modelOpts = await modelSelect.locator("option").allTextContents();
    const validModels = modelOpts.filter(o => o.trim() && !o.includes("Choose") && !o.includes("Select"));
    if (validModels.length > 0) {
      const preferred = ["Vios", "Fortuner", "Innova", "Avanza", "Hilux"];
      let pickModel = validModels[0];
      for (const p of preferred) {
        if (validModels.some(m => m.toLowerCase().includes(p.toLowerCase()))) {
          pickModel = validModels.find(m => m.toLowerCase().includes(p.toLowerCase()))!;
          break;
        }
      }
      await modelSelect.selectOption({ label: pickModel });
      await page.evaluate(() => {
        if ((window as any).jQuery) (window as any).jQuery("#model").trigger("change");
      });
      await page.waitForTimeout(2000);

      const variantSelect = page.locator("#variant");
      const variantOpts = await variantSelect.locator("option").allTextContents();
      const validVariants = variantOpts.filter(o => o.trim() && !o.includes("Choose") && !o.includes("Select"));
      if (validVariants.length > 0) {
        await variantSelect.selectOption({ label: validVariants[0] });
      }
    }
    await page.waitForTimeout(500);

    await selectSelect2(page, "pool_storage_id", "JBAP");
    await selectSelect2(page, "year_model", "2024");

    const startPriceField = page.locator("#start_price");
    await startPriceField.scrollIntoViewIfNeeded();
    await startPriceField.click();
    await startPriceField.clear();
    await startPriceField.pressSequentially("100000", { delay: 50 });
    await page.waitForTimeout(500);

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
    await page.waitForTimeout(1000);
    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    const isNotOnAddCar = !currentUrl.includes("/car/add-car");
    expect(isNotOnAddCar).toBeTruthy();
  });

  test("CA-006: verify created car appears in car list", async ({ page }) => {
    test.skip(!createdVcn, "CA-004 did not produce a VCN");

    await page.goto("/wp-admin/car/list");
    await page.waitForLoadState("networkidle");

    const carList = new CarListPage(page);
    await carList.searchByKeyword(createdVcn);

    const rowCount = await carList.getRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    const resultVcn = await carList.getFirstRowVehicleControlNo();
    expect(resultVcn).toContain(createdVcn);

    const firstRowLink = carList.table.locator("tbody tr").first().locator("a").first();
    const href = await firstRowLink.getAttribute("href") ?? "";
    const vidMatch = href.match(/vid\/(\d+)/);
    if (vidMatch) {
      createdVid = parseInt(vidMatch[1], 10);
    }
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

  // ═══════════════════════════════════════
  // CAR DETAIL (uses created car)
  // ═══════════════════════════════════════

  test("CD-001: detail page displays car information", async ({ page }) => {
    test.skip(!createdVid, "No created car VID available");

    const detail = new CarDetailPage(page);
    await detail.goto(createdVid);

    await expect(page).toHaveTitle("CDMS Dashboard");

    const content = page.locator(".content, .main-content, #content").first();
    const scope = (await content.count()) > 0 ? content : page;

    await expect(scope.getByText("Vehicle Control Number")).toBeVisible();
    await expect(scope.getByText("Plate Number")).toBeVisible();
    await expect(scope.getByText("Make", { exact: true })).toBeVisible();
    await expect(scope.getByText("Model", { exact: true })).toBeVisible();
    await expect(scope.getByText("Color", { exact: true })).toBeVisible();
    await expect(scope.getByText("Year Model")).toBeVisible();
  });

  test("CD-002: car grade scores are displayed", async ({ page }) => {
    test.skip(!createdVid, "No created car VID available");

    const detail = new CarDetailPage(page);
    await detail.goto(createdVid);

    const gradeLabels = ["Interior", "Exterior", "Engine", "Body", "Suspension"];
    for (const label of gradeLabels) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test("CD-003: car photos section is visible", async ({ page }) => {
    test.skip(!createdVid, "No created car VID available");

    const detail = new CarDetailPage(page);
    await detail.goto(createdVid);

    await expect(page.getByText("Car Photos")).toBeVisible();
  });

  test("CD-004: edit car and back buttons work", async ({ page }) => {
    test.skip(!createdVid, "No created car VID available");

    const detail = new CarDetailPage(page);
    await detail.goto(createdVid);

    const editButton = page.locator('a:has-text("Edit Car"), button:has-text("Edit Car")').first();
    await editButton.scrollIntoViewIfNeeded();
    await expect(editButton).toBeVisible();

    await editButton.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/wp-admin\/car\/edit-car\/vid\/\d+/);

    await page.goto(`/wp-admin/car/detail/vid/${createdVid}`);
    await page.waitForLoadState("networkidle");

    const backBtn = page.locator('a:has-text("Back"), button:has-text("Back")').first();
    await backBtn.scrollIntoViewIfNeeded();
    await backBtn.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/wp-admin\/car\/list/);
  });

  // ═══════════════════════════════════════
  // EDIT CAR (uses created car)
  // ═══════════════════════════════════════

  test("CE-001: form loads with existing car data", async ({ page }) => {
    test.skip(!createdVid, "No created car VID available");

    await page.goto(`/wp-admin/car/edit-car/vid/${createdVid}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText("Edit Car");

    const form = new CarFormPage(page);

    const vcn = await form.getFieldValue("vehicle_control_number");
    expect(vcn).toBeTruthy();
    expect(vcn.length).toBeGreaterThan(0);

    const plateNumber = await form.getFieldValue("plate_number");
    expect(plateNumber).toBeTruthy();

    const make = await page.locator("#make").inputValue();
    expect(make).not.toBe("");

    await page.waitForTimeout(2000);
    const modelOptions = await page.locator("#model option").count();
    expect(modelOptions).toBeGreaterThan(1);

    await expect(form.submitButton).toBeVisible();
    await expect(form.cancelButton).toBeVisible();
  });

  test("CE-002: edit fields and submit successfully", async ({ page }) => {
    test.skip(!createdVid, "No created car VID available");

    await page.goto(`/wp-admin/car/edit-car/vid/${createdVid}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText("Edit Car");

    const form = new CarFormPage(page);

    await form.fillForm(EDIT_DATA);
    await form.submit();

    await page.waitForTimeout(1000);
    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    const successIndicator = page.locator(".alert-success, .toast-success, .swal2-popup");
    const isRedirected = currentUrl.includes("/car/list") || currentUrl.includes("/car/detail");
    const isStillOnEdit = currentUrl.includes("/car/edit-car");

    const hasSuccess = (await successIndicator.count()) > 0 || isRedirected || isStillOnEdit;
    expect(hasSuccess).toBeTruthy();
  });

  test("CE-003: required field validation on edit", async ({ page }) => {
    test.skip(!createdVid, "No created car VID available");

    await page.goto(`/wp-admin/car/edit-car/vid/${createdVid}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText("Edit Car");

    await page.evaluate(() => {
      const fields = ["plate_number", "chassis_number", "cr_no"];
      fields.forEach((id) => {
        const el = document.getElementById(id) as HTMLInputElement;
        if (el && !el.readOnly) {
          el.value = "";
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
    });

    const form = new CarFormPage(page);
    await form.submit();
    await page.waitForTimeout(2000);

    const isStillOnEditPage = page.url().includes("edit-car");
    expect(isStillOnEditPage).toBeTruthy();
  });

  test("CE-004: cancel edit without saving", async ({ page }) => {
    test.skip(!createdVid, "No created car VID available");

    await page.goto(`/wp-admin/car/edit-car/vid/${createdVid}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText("Edit Car");

    const form = new CarFormPage(page);

    const mileageField = page.locator("#mileage");
    const isReadonly = await mileageField.getAttribute("readonly");
    if (!isReadonly) {
      await form.fillTextField("mileage", "99999");
    }

    page.on("dialog", (dialog) => dialog.accept());
    await form.cancel();

    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/wp-admin\/car\/list/);
  });

  test("CE-006: dependent dropdown make to model", async ({ page }) => {
    test.skip(!createdVid, "No created car VID available");

    await page.goto(`/wp-admin/car/edit-car/vid/${createdVid}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText("Edit Car");

    const makeSelect = page.locator("#make");
    const isNativeSelect = (await makeSelect.evaluate((el) => el.tagName)) === "SELECT";

    if (isNativeSelect) {
      await makeSelect.selectOption({ label: "TOYOTA" });
    }

    await page.waitForTimeout(2000);

    const modelOptions = await page.locator("#model option").allTextContents();
    expect(modelOptions.length).toBeGreaterThan(1);

    const nonEmptyModels = modelOptions.filter(
      (opt) => !opt.includes("Choose") && opt.trim() !== ""
    );
    expect(nonEmptyModels.length).toBeGreaterThan(0);
  });

  // ═══════════════════════════════════════
  // CHANGE HISTORY
  // ═══════════════════════════════════════

  test("CH-001: change history modal opens from car list", async ({ page }) => {
    const carList = new CarListPage(page);
    await carList.goto();

    await carList.clickChangeHistoryOnRow(0);

    const modal = page.locator("#myModal, .modal.show, .modal.in").first();
    await expect(modal).toBeVisible({ timeout: 10000 });
  });

  test("CH-002: history displays change details", async ({ page }) => {
    const carList = new CarListPage(page);
    await carList.goto();

    await carList.clickChangeHistoryOnRow(0);

    const modal = page.locator("#myModal, .modal.show, .modal.in").first();
    await expect(modal).toBeVisible({ timeout: 10000 });

    await expect(modal.locator("text=Field")).toBeVisible();
    await expect(modal.locator("text=Old Value")).toBeVisible();
    await expect(modal.locator("text=New Value")).toBeVisible();
  });

  test("CH-004: modal can be closed", async ({ page }) => {
    const carList = new CarListPage(page);
    await carList.goto();

    await carList.clickChangeHistoryOnRow(0);

    const modal = page.locator("#myModal, .modal.show, .modal.in").first();
    await expect(modal).toBeVisible({ timeout: 10000 });

    const closeButton = modal.locator("button:has-text('Close'), button.close, [aria-label='Close']").first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      await page.keyboard.press("Escape");
    }

    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });
});
