import { defineConfig, devices } from "@playwright/test";

const explicitBase =
  process.env.PLAYWRIGHT_BASE_URL?.trim() ||
  process.env.SMOKE_BASE_URL?.trim();
const baseURL = explicitBase || "http://127.0.0.1:3000";
const useLocalWebServer =
  !explicitBase && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(?:\/|$)/i.test(baseURL);

/**
 * Focused accessibility suite for Sprint 4.
 * Run: npm run test:e2e:a11y
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /a11y-public\.spec\.ts/,
  fullyParallel: true,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: useLocalWebServer
    ? {
        command: "npm run start -- -p 3000",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
});
