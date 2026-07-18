import { defineConfig, devices } from "@playwright/test";
import { assertStagingEnvironment } from "./src/lib/staging-acceptance/environment";

const staging = assertStagingEnvironment(process.env);

export default defineConfig({
  testDir: "./tests/staging-acceptance",
  testMatch: /.*\.spec\.ts/,
  outputDir: "test-results/staging-acceptance/artifacts",
  fullyParallel: false,
  forbidOnly: true,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["./tests/staging-acceptance/reporters/staging-acceptance-reporter.ts"],
    ["html", { outputFolder: "test-results/staging-acceptance/html", open: "never" }],
  ],
  use: {
    baseURL: staging.baseUrl,
    headless: true,
    trace: "on",
    screenshot: "on",
    video: "on",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
