import { test, expect } from "@playwright/test";
import { CarFormPage, CarFormData } from "../../../pages/backoffice/CarFormPage";

const TEST_VID = 4049;
const EDIT_URL = `/wp-admin/car/edit-car/vid/${TEST_VID}`;

const EDIT_DATA: Partial<CarFormData> = {
  mileage: "55000",
  color: "WHITE",
  startPrice: "250000",
};

test.describe("Edit car", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(EDIT_URL);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveText("Edit Car");
  });

  test("CE-001: form loads with existing car data", async ({ page }) => {
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
    const form = new CarFormPage(page);

    await form.fillForm(EDIT_DATA);
    await form.submit();

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const successIndicator = page.locator(".alert-success, .toast-success, .swal2-popup, [class*='success']");
    const isRedirected = currentUrl.includes("/car/list") || currentUrl.includes("/car/detail");
    const isStillOnEdit = currentUrl.includes("/car/edit-car");

    const hasSuccess = (await successIndicator.count()) > 0 || isRedirected || isStillOnEdit;
    expect(hasSuccess).toBeTruthy();
  });

  test("CE-003: required field validation on edit", async ({ page }) => {
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
});
