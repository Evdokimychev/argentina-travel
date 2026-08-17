#!/usr/bin/env node
/**
 * Isolated single Lighthouse cold run.
 *
 * Spawned by lighthouse-blog-cwv.mjs so a hung gather / Chrome kill cannot
 * poison the parent Node process or subsequent CDP sessions on CI runners.
 *
 * Env:
 *   LIGHTHOUSE_SINGLE_URL — required absolute URL
 *   LIGHTHOUSE_SINGLE_OUT — required path for the raw LHR JSON
 *   LIGHTHOUSE_CATEGORIES — comma-separated categories
 *   LIGHTHOUSE_CHROME_PORT — optional existing Chrome debugging port
 */
import fs from "node:fs";
import path from "node:path";
import { launch as launchChrome } from "chrome-launcher";
import lighthouse from "lighthouse";

const url = process.env.LIGHTHOUSE_SINGLE_URL?.trim();
const outFile = process.env.LIGHTHOUSE_SINGLE_OUT?.trim();
const CATEGORIES = (
  process.env.LIGHTHOUSE_CATEGORIES?.split(",").map((c) => c.trim()).filter(Boolean) ?? [
    "performance",
  ]
);
const configuredChromePort = Number(process.env.LIGHTHOUSE_CHROME_PORT);
const USE_CONFIGURED_CHROME = Number.isInteger(configuredChromePort) && configuredChromePort > 0;
const CHROME_FLAGS = ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"];

if (!url || !outFile) {
  console.error("LIGHTHOUSE_SINGLE_URL and LIGHTHOUSE_SINGLE_OUT are required");
  process.exit(2);
}

process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  if (
    message.includes("Target closed") ||
    message.includes("Protocol error") ||
    message.includes("Browser disconnected")
  ) {
    return;
  }
  console.error("Unhandled rejection in lighthouse-single-run:", reason);
  process.exitCode = 1;
});

async function main() {
  let chrome = null;
  let port = configuredChromePort;

  try {
    if (!USE_CONFIGURED_CHROME) {
      chrome = await launchChrome({ chromeFlags: CHROME_FLAGS });
      port = chrome.port;
    }

    const { lhr } = await lighthouse(url, {
      port,
      onlyCategories: CATEGORIES,
      formFactor: "mobile",
      screenEmulation: { mobile: true },
      throttlingMethod: "simulate",
      maxWaitForLoad: 45_000,
      disableFullPageScreenshot: true,
      logLevel: "silent",
    });

    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(lhr));
    process.stdout.write(
      JSON.stringify({
        ok: true,
        outFile,
        performance: Math.round((lhr.categories?.performance?.score ?? 0) * 100),
      }),
    );
    process.stdout.write("\n");
  } finally {
    if (chrome) {
      try {
        chrome.kill();
      } catch {
        // Already dead after protocol crash / parent SIGKILL.
      }
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
