import { test, expect } from "@playwright/test";
import { CarDetailPage } from "../../../pages/backoffice/CarDetailPage";
import { loadState } from "../../../fixtures/test-state";

test.describe("Cars > Detail", () => {
  test.describe.configure({ mode: "serial" });

  let vid: number;

  test.beforeEach(() => {
    vid = loadState().createdVid ?? 0;
  });

  test("CD-001: detail page displays car information", async ({ page }) => {
    test.skip(!vid, "No created car VID available");

    await test.step("Given I navigate to the car detail page", async () => {
      const detail = new CarDetailPage(page);
      await detail.goto(vid);
    });

    await test.step("Then the page title should be CDMS Dashboard", async () => {
      await expect(page).toHaveTitle("CDMS Dashboard");
    });

    await test.step("And all car information fields should be visible", async () => {
      const content = page.locator(".content, .main-content, #content").first();
      const scope = (await content.count()) > 0 ? content : page;
      await expect(scope.getByText("Vehicle Control Number")).toBeVisible();
      await expect(scope.getByText("Plate Number")).toBeVisible();
      await expect(scope.getByText("Make", { exact: true })).toBeVisible();
      await expect(scope.getByText("Model", { exact: true })).toBeVisible();
      await expect(scope.getByText("Color", { exact: true })).toBeVisible();
      await expect(scope.getByText("Year Model")).toBeVisible();
    });
  });

  test("CD-002: car grade scores are displayed", async ({ page }) => {
    test.skip(!vid, "No created car VID available");

    await test.step("Given I navigate to the car detail page", async () => {
      const detail = new CarDetailPage(page);
      await detail.goto(vid);
    });

    await test.step("Then all grade score labels should be visible", async () => {
      const gradeLabels = ["Interior", "Exterior", "Engine", "Body", "Suspension"];
      for (const label of gradeLabels) {
        await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
      }
    });
  });

  test("CD-003: car photos section is visible", async ({ page }) => {
    test.skip(!vid, "No created car VID available");

    await test.step("Given I navigate to the car detail page", async () => {
      const detail = new CarDetailPage(page);
      await detail.goto(vid);
    });

    await test.step("Then the Car Photos section should be visible", async () => {
      await expect(page.getByText("Car Photos")).toBeVisible();
    });
  });

  test("CD-004: edit car and back buttons work", async ({ page }) => {
    test.skip(!vid, "No created car VID available");

    await test.step("Given I am on the car detail page", async () => {
      const detail = new CarDetailPage(page);
      await detail.goto(vid);
    });

    await test.step("When I click the Edit Car button", async () => {
      const editButton = page.locator('a:has-text("Edit Car"), button:has-text("Edit Car")').first();
      await editButton.scrollIntoViewIfNeeded();
      await expect(editButton).toBeVisible();
      await editButton.click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Then I should be redirected to the edit car page", async () => {
      await expect(page).toHaveURL(/\/wp-admin\/car\/edit-car\/vid\/\d+/);
    });

    await test.step("When I go back to detail and click the Back button", async () => {
      await page.goto(`/wp-admin/car/detail/vid/${vid}`);
      await page.waitForLoadState("networkidle");
      const backBtn = page.locator('a:has-text("Back"), button:has-text("Back")').first();
      await backBtn.scrollIntoViewIfNeeded();
      await backBtn.click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Then I should be redirected to the car list page", async () => {
      await expect(page).toHaveURL(/\/wp-admin\/car\/list/);
    });
  });
});
