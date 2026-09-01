import { Page } from "@playwright/test";

export async function selectSelect2(page: Page, fieldId: string, searchText: string) {
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

  await page.locator(".select2-results__option:not(.select2-results__option--highlighted)")
    .first().waitFor({ timeout: 5000 }).catch(() => {});

  const options = page.locator(".select2-results__option").filter({ hasText: searchText });
  if (await options.count() > 0) {
    await options.first().click();
  } else {
    await page.locator(".select2-results__option").first().click();
  }
  await page.waitForTimeout(500);
}
