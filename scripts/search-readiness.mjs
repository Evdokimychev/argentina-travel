#!/usr/bin/env node
/**
 * Search / Meilisearch readiness report.
 *
 * Usage:
 *   npm run search:readiness
 *   npm run search:readiness -- --strict
 *
 * Writes var/ops/search-readiness-last.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const opsDir = path.join(root, "var/ops");
const reportFile = path.join(opsDir, "search-readiness-last.json");

function loadEnvLocal() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();
  const strict = process.argv.includes("--strict");

  const { runSearchReadinessChecks } = await import(
    pathToFileURL(path.join(root, "src/lib/search/search-readiness.ts")).href
  );

  const report = await runSearchReadinessChecks();

  fs.mkdirSync(opsDir, { recursive: true });
  fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("Search readiness");
  console.log(`Meilisearch configured: ${report.configured ? "yes" : "no"}`);
  if (report.meiliHealthy != null) {
    console.log(`Meilisearch healthy: ${report.meiliHealthy ? "yes" : "no"}`);
  }
  if (report.documentCount != null) {
    console.log(`Documents in index: ${report.documentCount}`);
  }
  console.log("");

  for (const check of report.checks) {
    const icon =
      check.status === "ok" ? "✓" : check.status === "fail" ? "✗" : check.status === "warn" ? "!" : "–";
    console.log(`${icon} [${check.status}] ${check.label}: ${check.message}`);
  }

  console.log("");
  console.log(`Report: ${path.relative(root, reportFile)}`);

  if (strict && !report.ok) {
    console.error("\nStrict: search readiness checks failed");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
