#!/usr/bin/env node
/**
 * CMS cutover readiness report (all 4 lanes).
 *
 * Usage:
 *   npm run cms:readiness
 *   npm run cms:readiness -- --strict   # exit 1 if any enabled lane is not ready
 *
 * Writes var/ops/cms-cutover-readiness-last.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const opsDir = path.join(root, "var/ops");
const reportFile = path.join(opsDir, "cms-cutover-readiness-last.json");

const LANES = ["blog", "guide", "destination", "place"];

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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error("SUPABASE_SERVICE_ROLE_KEY не задан — нужен .env.local");
    process.exit(1);
  }

  const strict = process.argv.includes("--strict");

  const { fetchCmsCutoverReadiness } = await import(
    pathToFileURL(path.join(root, "src/lib/cms/cms-cutover.ts")).href
  );

  const readiness = await fetchCmsCutoverReadiness();

  const summary = {
    allReady: true,
    allCutover: true,
    lanesEnabled: 0,
    lanesReady: 0,
    lanesAt100: 0,
  };

  for (const lane of LANES) {
    const stats = readiness[lane];
    if (stats.cutover) summary.lanesEnabled += 1;
    if (stats.ready) summary.lanesReady += 1;
    if (stats.coveragePercent === 100) summary.lanesAt100 += 1;
    if (stats.cutover && !stats.ready) summary.allReady = false;
    if (!stats.cutover) summary.allCutover = false;
  }

  const payload = {
    ok: summary.allReady,
    ranAt: new Date().toISOString(),
    strict,
    summary,
    readiness,
  };

  fs.mkdirSync(opsDir, { recursive: true });
  fs.writeFileSync(reportFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("CMS cutover readiness");
  console.log(
    `Lanes: ${summary.lanesEnabled}/4 cutover on, ${summary.lanesReady}/4 ready, ${summary.lanesAt100}/4 at 100%`
  );
  console.log("");

  for (const lane of LANES) {
    const stats = readiness[lane];
    const icon = stats.cutover ? (stats.ready ? "✓" : "✗") : "–";
    console.log(
      `${icon} ${lane}: ${stats.coveragePercent}% (${stats.cmsCompletePublished}/${stats.tsCount}) cutover=${stats.cutover} canEnable=${stats.canEnable}`
    );
    if (stats.missingSlugs.length) {
      console.log(`    missing: ${stats.missingSlugs.slice(0, 12).join(", ")}`);
    }
  }

  console.log("");
  console.log(`Report: ${path.relative(root, reportFile)}`);

  if (strict && !summary.allReady) {
    console.error("\nStrict: включён cutover, но не все lane готовы");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
