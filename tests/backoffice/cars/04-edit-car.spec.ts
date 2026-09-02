import { test, expect } from "@playwright/test";
import { CarFormPage } from "../../../pages/backoffice/CarFormPage";
import { CarDetailPage } from "../../../pages/backoffice/CarDetailPage";
import { loadState } from "../../../fixtures/test-state";
import { EDIT_DATA } from "../../../fixtures/car-data";

test.describe("Cars > Edit", () => {
  test.describe.configure({ mode: "serial" });

  let vid: number;

  test.beforeEach(() => {
    vid = loadState().createdVid ?? 0;
  });

  test("CE-001: form loads with existing car data", async ({ page }) => {
    test.skip(!vid, "No created car VID available");

    await test.step("Given I navigate to the edit car page", async () => {
      await page.goto(`/wp-admin/car/edit-car/vid/${vid}`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toHaveText("Edit Car");
    });

    await test.step("Then VCN and plate number should have existing values", async () => {
      const form = new CarFormPage(page);
      const vcn = await form.getFieldValue("vehicle_control_number");
      expect(vcn).toBeTruthy();
      expect(vcn.length).toBeGreaterThan(0);
      const plateNumber = await form.getFieldValue("plate_number");
      expect(plateNumber).toBeTruthy();
    });

    await test.step("And Make should be selected with Model options loaded", async () => {
      const make = await page.locator("#make").inputValue();
      expect(make).not.toBe("");
      await page.waitForTimeout(2000);
      const modelOptions = await page.locator("#model option").count();
      expect(modelOptions).toBeGreaterThan(1);
    });

    await test.step("And Submit and Cancel buttons should be visible", async () => {
      const form = new CarFormPage(page);
      await expect(form.submitButton).toBeVisible();
      await expect(form.cancelButton).toBeVisible();
    });
  });

  test("CE-002: edit fields and submit successfully", async ({ page }) => {
    test.skip(!vid, "No created car VID available");

    await test.step("Given I am on the edit car page", async () => {
      await page.goto(`/wp-admin/car/edit-car/vid/${vid}`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toHaveText("Edit Car");
    });

    await test.step("When I update mileage, color, and start price", async () => {
      const form = new CarFormPage(page);
      await form.fillForm(EDIT_DATA);
    });

    await test.step("And I submit the form", async () => {
      const form = new CarFormPage(page);
      await form.submit();
      await page.waitForTimeout(1000);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Then the car detail page should show the updated values", async () => {
      const detail = new CarDetailPage(page);
      await detail.goto(vid);
      const mileage = await detail.getFieldValue("Mileage (Km)");
      const color = await detail.getFieldValue("Color");
      const startPrice = await detail.getFieldValue("Start Price");
      expect(mileage.replace(/,/g, "")).toBe(EDIT_DATA.mileage);
      expect(color).toBe(EDIT_DATA.color);
      expect(startPrice.replace(/,/g, "")).toBe(EDIT_DATA.startPrice);
    });
  });

  test("CE-003: required field validation on edit", async ({ page }) => {
    test.skip(!vid, "No created car VID available");

    await test.step("Given I am on the edit car page", async () => {
      await page.goto(`/wp-admin/car/edit-car/vid/${vid}`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toHaveText("Edit Car");
    });

    await test.step("When I clear required fields and submit", async () => {
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
    });

    await test.step("Then I should remain on the edit car page", async () => {
      expect(page.url()).toContain("edit-car");
    });
  });

  test("CE-004: cancel edit without saving", async ({ page }) => {
    test.skip(!vid, "No created car VID available");

    await test.step("Given I am on the edit car page", async () => {
      await page.goto(`/wp-admin/car/edit-car/vid/${vid}`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toHaveText("Edit Car");
    });

    await test.step("When I modify the mileage field", async () => {
      const form = new CarFormPage(page);
      const mileageField = page.locator("#mileage");
      const isReadonly = await mileageField.getAttribute("readonly");
      if (!isReadonly) {
        await form.fillTextField("mileage", "99999");
      }
    });

    await test.step("And I click Cancel and accept the confirmation dialog", async () => {
      page.on("dialog", (dialog) => dialog.accept());
      const form = new CarFormPage(page);
      await form.cancel();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Then I should be redirected to the car list page", async () => {
      await expect(page).toHaveURL(/\/wp-admin\/car\/list/);
    });
  });

  test("CE-006: dependent dropdown make to model", async ({ page }) => {
    test.skip(!vid, "No created car VID available");

    await test.step("Given I am on the edit car page", async () => {
      await page.goto(`/wp-admin/car/edit-car/vid/${vid}`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1")).toHaveText("Edit Car");
    });

    await test.step("When I change Make to TOYOTA", async () => {
      const makeSelect = page.locator("#make");
      const isNativeSelect = (await makeSelect.evaluate((el) => el.tagName)) === "SELECT";
      if (isNativeSelect) {
        await makeSelect.selectOption({ label: "TOYOTA" });
      }
      await page.waitForTimeout(2000);
    });

    await test.step("Then Model dropdown should load available models", async () => {
      const modelOptions = await page.locator("#model option").allTextContents();
      expect(modelOptions.length).toBeGreaterThan(1);
      const nonEmptyModels = modelOptions.filter(
        (opt) => !opt.includes("Choose") && opt.trim() !== ""
      );
      expect(nonEmptyModels.length).toBeGreaterThan(0);
    });
  });
});
