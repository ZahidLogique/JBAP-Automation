import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  fullyParallel: process.env.TEST_SEQUENTIAL !== "true",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  globalSetup: "./global-setup.ts",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results.json" }],
    ["allure-playwright", { outputFolder: "allure-results", detail: true }],
  ],
  use: {
    headless: false,
    channel: "chrome",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    {
      name: "setup-backoffice",
      testDir: "./tests/setup",
      testMatch: "backoffice.setup.ts",
      use: {
        ...devices["Desktop Chrome"],
        httpCredentials: {
          username: process.env.BASIC_AUTH_USER!,
          password: process.env.BASIC_AUTH_PASS!,
        },
      },
    },
    {
      name: "backoffice",
      testDir: "./tests/backoffice",
      fullyParallel: false,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.BACKOFFICE_URL,
        storageState: ".auth/backoffice.json",
        httpCredentials: {
          username: process.env.BASIC_AUTH_USER!,
          password: process.env.BASIC_AUTH_PASS!,
        },
      },
      dependencies: ["setup-backoffice"],
    },
    {
      name: "web",
      testDir: "./tests/web",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.WEB_URL,
      },
    },
  ],
});
