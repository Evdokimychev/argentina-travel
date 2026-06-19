#!/usr/bin/env node
/**
 * Seed draft ES/EN placeholders from RU source for pilot rollout slugs.
 * Usage: node scripts/seed-cms-locales.mjs [--force]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local не найден. Скопируйте .env.example и заполните переменные.");
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
    throw new Error("SUPABASE_SERVICE_ROLE_KEY отсутствует в .env.local");
  }

  const force = process.argv.includes("--force");

  const { createSupabaseAdminClient } = await import(
    pathToFileURL(path.join(root, "src/lib/supabase/admin.ts")).href
  );
  const { seedCmsLocalePlaceholders } = await import(
    pathToFileURL(path.join(root, "src/lib/cms/cms-ts-seed.ts")).href
  );

  const supabase = createSupabaseAdminClient();
  const result = await seedCmsLocalePlaceholders(supabase, { skipExisting: !force });

  console.log(
    `E93 locale placeholders: создано ${result.created}, пропущено ${result.skipped}, обновлено ${result.updated} из ${result.total}`
  );

  if (result.errors.length) {
    console.error("Ошибки:", result.errors);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
