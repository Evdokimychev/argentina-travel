import { defineConfig, devices } from "@playwright/test";

const explicitBase =
  process.env.PLAYWRIGHT_BASE_URL?.trim() || process.env.SMOKE_BASE_URL?.trim();
const baseURL = explicitBase || "http://127.0.0.1:3000";
const useLocalWebServer =
  !explicitBase && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(?:\/|$)/i.test(baseURL);

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /stage2-visual-acceptance\.spec\.ts/,
  fullyParallel: true,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 3 : 2,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-390x844",
      use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "tablet-768x1024",
      use: { ...devices["iPad (gen 7)"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "desktop-1440x900",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: useLocalWebServer
    ? {
        command: process.env.CI ? "npm run start" : "npm run dev",
        url: baseURL,
        // Earlier CI checks may keep the production server alive on this port.
        // It serves the same build, so visual acceptance should reuse it.
        reuseExistingServer: true,
        timeout: 180_000,
      }
    : undefined,
});
