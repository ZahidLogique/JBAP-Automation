import fs from "fs";
import path from "path";

export default async function globalSetup() {
  const screenshotsDir = path.join(process.cwd(), "screenshots");
  if (fs.existsSync(screenshotsDir)) {
    fs.rmSync(screenshotsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const allureResultsDir = path.join(process.cwd(), "allure-results");
  if (fs.existsSync(allureResultsDir)) {
    fs.rmSync(allureResultsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(allureResultsDir, { recursive: true });

  const stateFile = path.join(process.cwd(), ".test-state.json");
  if (fs.existsSync(stateFile)) fs.unlinkSync(stateFile);
}
