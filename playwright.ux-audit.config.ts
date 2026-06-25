import { defineConfig, devices } from "@playwright/test";

const explicitBase =
  process.env.PLAYWRIGHT_BASE_URL?.trim() ||
  process.env.SMOKE_BASE_URL?.trim();
const baseURL = explicitBase || "http://127.0.0.1:3000";
const useLocalWebServer =
  !explicitBase && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(?:\/|$)/i.test(baseURL);
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /ux-audit\.spec\.ts/,
  fullyParallel: true,
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [
    ["list"],
    ["./tests/e2e/reporters/sprint-backlog-reporter.ts"],
  ],
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "ux-audit-mobile",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: "ux-audit-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: useLocalWebServer
    ? {
        command: isCI ? "npm run start" : "npm run dev",
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 180_000,
      }
    : undefined,
});
