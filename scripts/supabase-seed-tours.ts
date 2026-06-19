/**
 * Seed marketplace tours into Supabase (service role, no HTTP session).
 * Usage: npm run supabase:seed-tours
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { buildMarketplaceSeedRows } from "../src/lib/tour-content-seed";
import { upsertTourFromCanonical } from "../src/lib/tour-content-server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found. Copy .env.example and fill in values.");
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

async function main() {
  loadEnvLocal();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env.local");
  }

  const supabase = createSupabaseAdminClient();
  const rows = buildMarketplaceSeedRows();
  let seeded = 0;
  const errors: string[] = [];

  for (const { tour, ownerUserId } of rows) {
    const result = await upsertTourFromCanonical(supabase, tour, ownerUserId);
    if ("error" in result) {
      errors.push(`${tour.slug}: ${result.error}`);
    } else {
      seeded += 1;
    }
  }

  console.log(`Seeded ${seeded}/${rows.length} tours`);
  if (errors.length) {
    console.error("Errors:", errors);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
