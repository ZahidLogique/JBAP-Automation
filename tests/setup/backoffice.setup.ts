import { test as setup, expect } from "@playwright/test";
import { BackofficeLoginPage } from "../../pages/backoffice/LoginPage";
import path from "path";

const authFile = path.join(__dirname, "../../.auth/backoffice.json");

setup("authenticate backoffice", async ({ page }) => {
  setup.setTimeout(60000);

  await page.goto(process.env.BACKOFFICE_URL!, { timeout: 30000 });

  const loginPage = new BackofficeLoginPage(page);
  await loginPage.login(process.env.ADMIN_USER!, process.env.ADMIN_PASS!);

  await expect(page).toHaveTitle("CDMS Dashboard", { timeout: 15000 });
  await page.context().storageState({ path: authFile });
});
