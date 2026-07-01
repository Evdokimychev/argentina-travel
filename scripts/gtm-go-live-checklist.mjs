#!/usr/bin/env node
/**
 * Printable GTM go-live checklist — env status + manual ops steps.
 *
 * Usage:
 *   npm run gtm:go-live-checklist
 *   ANALYTICS_BASE_URL=https://www.goargentina.ru npm run gtm:go-live-checklist
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const reportFile = path.join(root, "var/ops/analytics-readiness-last.json");

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

function readReport() {
  if (!fs.existsSync(reportFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(reportFile, "utf8"));
  } catch {
    return null;
  }
}

function main() {
  loadEnvLocal();

  console.log("GTM go-live helper");
  console.log("==================\n");

  const envKeys = [
    "NEXT_PUBLIC_GTM_ID",
    "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
    "NEXT_PUBLIC_YM_COUNTER_ID",
    "NEXT_PUBLIC_CLARITY_PROJECT_ID",
    "NEXT_PUBLIC_SITE_URL",
  ];

  console.log("Vercel / local env (справочно):");
  for (const key of envKeys) {
    const value = process.env[key]?.trim();
    console.log(`  ${value ? "✓" : "✗"} ${key}${value ? `: ${value.slice(0, 20)}${value.length > 20 ? "…" : ""}` : ""}`);
  }

  console.log("\nЗапуск analytics-readiness + gtm-events:audit…\n");
  const audit = spawnSync("npm", ["run", "gtm-events:audit"], { cwd: root, stdio: "inherit", env: process.env });
  if (audit.status !== 0) process.exit(audit.status ?? 1);

  const readiness = spawnSync("npm", ["run", "analytics-readiness"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  const report = readReport();
  if (report) {
    console.log("\nПоследний отчёт analytics-readiness:");
    console.log(`  OK ${report.summary?.ok ?? 0}, fail ${report.summary?.fail ?? 0}`);
    console.log(`  gtmEventsCount: ${report.gtmEventsCount ?? "—"}`);
  }

  process.exit(readiness.status ?? 0);
}

main();
