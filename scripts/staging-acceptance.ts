#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  createSafeFingerprint,
  type AcceptanceFingerprint,
} from "../src/lib/staging-acceptance/environment";

function printFingerprint(fingerprint: AcceptanceFingerprint): void {
  console.log("[staging-acceptance] safe environment fingerprint");
  console.log(JSON.stringify(fingerprint, null, 2));
}

let fingerprint: AcceptanceFingerprint;
try {
  fingerprint = createSafeFingerprint(process.env);
  printFingerprint(fingerprint);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (process.argv.includes("--preflight")) {
  console.log("[staging-acceptance] preflight passed; no browser or write scenario was started");
  process.exit(0);
}

const forwardedArgs = process.argv.slice(2).filter((argument) => argument !== "--preflight");
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["playwright", "test", "-c", "playwright.staging-acceptance.config.ts", ...forwardedArgs],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: fingerprint.baseUrl,
    },
    stdio: "inherit",
  },
);

if (result.error) {
  console.error(`[staging-acceptance] unable to start Playwright: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
