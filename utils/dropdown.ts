import { Page } from "@playwright/test";

export interface DependentDropdownResult {
  model: string;
  variant: string;
}

export async function selectMakeModelVariant(
  page: Page,
  make: string = "TOYOTA",
  preferredModels: string[] = ["Vios", "Fortuner", "Innova", "Avanza", "Hilux"]
): Promise<DependentDropdownResult> {
  await page.locator("#make").selectOption({ label: make });
  await page.evaluate(() => {
    if ((window as any).jQuery) (window as any).jQuery("#make").trigger("change");
  });
  await page.waitForTimeout(3000);

  let selectedModel = "";
  const modelSelect = page.locator("#model");
  const modelOpts = await modelSelect.locator("option").allTextContents();
  const validModels = modelOpts.filter(o => o.trim() && !o.includes("Choose") && !o.includes("Select"));

  if (validModels.length > 0) {
    let pickModel = validModels[0];
    for (const p of preferredModels) {
      const found = validModels.find(m => m.toLowerCase().includes(p.toLowerCase()));
      if (found) {
        pickModel = found;
        break;
      }
    }
    await modelSelect.selectOption({ label: pickModel });
    selectedModel = pickModel;

    await page.evaluate(() => {
      if ((window as any).jQuery) (window as any).jQuery("#model").trigger("change");
    });
    await page.waitForTimeout(2000);
  }

  let selectedVariant = "";
  const variantSelect = page.locator("#variant");
  const variantOpts = await variantSelect.locator("option").allTextContents();
  const validVariants = variantOpts.filter(o => o.trim() && !o.includes("Choose") && !o.includes("Select"));
  if (validVariants.length > 0) {
    await variantSelect.selectOption({ label: validVariants[0] });
    selectedVariant = validVariants[0];
  }

  await page.waitForTimeout(500);
  return { model: selectedModel, variant: selectedVariant };
}

export async function setDateField(page: Page, fieldId: string, value: string) {
  await page.evaluate(({ id, val }) => {
    const el = document.querySelector(`#${id}`) as HTMLInputElement;
    if (el) {
      el.value = val;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, { id: fieldId, val: value });
}

export async function fillStartPrice(page: Page, amount: string) {
  const field = page.locator("#start_price");
  await field.scrollIntoViewIfNeeded();
  await field.click();
  await field.clear();
  await field.pressSequentially(amount, { delay: 50 });
  await page.waitForTimeout(500);
}
