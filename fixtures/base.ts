import { test as base, expect } from "@playwright/test";

const RETRY_DELAY_MS = 10_000;

export const test = base.extend<{}>({});

test.beforeEach(async ({}, testInfo) => {
  if (testInfo.retry > 0) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }
});

export { expect };
