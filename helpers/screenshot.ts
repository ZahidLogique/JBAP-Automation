import { Page, TestInfo } from "@playwright/test";
import path from "path";
import fs from "fs";

export async function takeScreenshot(
  page: Page,
  testInfo: TestInfo,
  stepName: string
) {
  const dir = path.join("screenshots", testInfo.title.split(":")[0].trim());
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${stepName}.png`);
  await page.screenshot({ path: filePath });
  await testInfo.attach(stepName, {
    path: filePath,
    contentType: "image/png",
  });
}
