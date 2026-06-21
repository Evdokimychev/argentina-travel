#!/usr/bin/env node
/**
 * Enable CMS cutover after TS import.
 * Usage:
 *   npm run cms:cutover-enable -- --seed-first
 *   npm run cms:cutover-enable -- --destination-only --seed-first
 *   npm run cms:cutover-enable -- --blog-only --guide-only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const LANES = ["blog", "guide", "destination", "place"];

const LANE_TO_DOC_TYPE = {
  blog: "blog",
  guide: "guide",
  destination: "destination",
  place: "place",
};

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found");
  }
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

function selectedLanes(argv) {
  const picked = LANES.filter((lane) => argv.includes(`--${lane}-only`));
  return picked.length ? picked : LANES;
}

async function main() {
  loadEnvLocal();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env.local");
  }

  const argv = process.argv.slice(2);
  const seedFirst = argv.includes("--seed-first");
  const lanes = selectedLanes(argv);

  const { createSupabaseAdminClient } = await import(
    pathToFileURL(path.join(root, "src/lib/supabase/admin.ts")).href
  );
  const { seedCmsFromTs } = await import(
    pathToFileURL(path.join(root, "src/lib/cms/cms-ts-seed.ts")).href
  );
  const { fetchCmsCutoverReadiness, setCmsCutoverFlags } = await import(
    pathToFileURL(path.join(root, "src/lib/cms/cms-cutover.ts")).href
  );

  const supabase = createSupabaseAdminClient();

  if (seedFirst) {
    const docTypes = lanes.map((lane) => LANE_TO_DOC_TYPE[lane]);
    console.log(`Импорт TS → CMS (${docTypes.join(", ")})…`);
    const result = await seedCmsFromTs(supabase, {
      docTypes,
      publish: true,
      skipExisting: true,
      includeRichHtml: true,
    });
    console.log(
      `Seed: создано ${result.created}, пропущено ${result.skipped}, обновлено ${result.updated}`
    );
    if (result.errors.length) {
      console.error("Ошибки seed:", result.errors.slice(0, 10));
      process.exit(1);
    }
  }

  const before = await fetchCmsCutoverReadiness();
  console.log("Readiness:");
  for (const lane of LANES) {
    const stats = before[lane];
    console.log(
      `  ${lane}: ${stats.coveragePercent}% (${stats.cmsCompletePublished}/${stats.tsCount}), cutover=${stats.cutover}`
    );
    if (stats.missingSlugs.length) {
      console.log(`    missing: ${stats.missingSlugs.slice(0, 8).join(", ")}`);
    }
  }

  const patch = Object.fromEntries(lanes.map((lane) => [lane, true]));

  const after = await setCmsCutoverFlags(patch, null);
  console.log("Cutover включён:");
  for (const lane of lanes) {
    console.log(`  ${lane}: ${after[lane].cutover ? "CMS-only" : "hybrid"}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
