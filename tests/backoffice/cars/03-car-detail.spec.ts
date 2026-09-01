import { test, expect } from "@playwright/test";
import { CarDetailPage } from "../../../pages/backoffice/CarDetailPage";
import { loadState } from "../../../fixtures/test-state";

test.describe("Car Detail", () => {
  test.describe.configure({ mode: "serial" });

  let vid: number;

  test.beforeEach(() => {
    vid = loadState().createdVid ?? 0;
  });

  test("CD-001: detail page displays car information", async ({ page }) => {
    test.skip(!vid, "No created car VID available");

    const detail = new CarDetailPage(page);
    await detail.goto(vid);

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
    test.skip(!vid, "No created car VID available");

    const detail = new CarDetailPage(page);
    await detail.goto(vid);

    const gradeLabels = ["Interior", "Exterior", "Engine", "Body", "Suspension"];
    for (const label of gradeLabels) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test("CD-003: car photos section is visible", async ({ page }) => {
    test.skip(!vid, "No created car VID available");

    const detail = new CarDetailPage(page);
    await detail.goto(vid);

    await expect(page.getByText("Car Photos")).toBeVisible();
  });

  test("CD-004: edit car and back buttons work", async ({ page }) => {
    test.skip(!vid, "No created car VID available");

    const detail = new CarDetailPage(page);
    await detail.goto(vid);

    const editButton = page.locator('a:has-text("Edit Car"), button:has-text("Edit Car")').first();
    await editButton.scrollIntoViewIfNeeded();
    await expect(editButton).toBeVisible();

    await editButton.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/wp-admin\/car\/edit-car\/vid\/\d+/);

    await page.goto(`/wp-admin/car/detail/vid/${vid}`);
    await page.waitForLoadState("networkidle");

    const backBtn = page.locator('a:has-text("Back"), button:has-text("Back")').first();
    await backBtn.scrollIntoViewIfNeeded();
    await backBtn.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/wp-admin\/car\/list/);
  });
});
