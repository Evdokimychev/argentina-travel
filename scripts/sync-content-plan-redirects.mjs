#!/usr/bin/env node
/**
 * Sync static CONTENT_PLAN_URL_REDIRECTS → Supabase url_redirects (idempotent upsert).
 *
 * Usage:
 *   npm run sync-content-plan-redirects
 *   npm run sync-content-plan-redirects:check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const NOTE = "content-plan-url-redirects.ts (auto-sync)";

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

function normalizePath(value) {
  let pathValue = value.trim();
  if (!pathValue.startsWith("/")) pathValue = `/${pathValue}`;
  if (pathValue.length > 1 && pathValue.endsWith("/")) {
    pathValue = pathValue.replace(/\/+$/, "");
  }
  return pathValue;
}

async function main() {
  loadEnvLocal();
  const checkOnly = process.argv.includes("--check");

  const { CONTENT_PLAN_URL_REDIRECTS } = await import(
    pathToFileURL(path.join(root, "src/data/content-plan-url-redirects.ts")).href
  );

  const expected = Object.entries(CONTENT_PLAN_URL_REDIRECTS).map(([from, to]) => ({
    from_path: normalizePath(from),
    to_path: normalizePath(to),
    status_code: 301,
    enabled: true,
    note: NOTE,
  }));

  if (checkOnly) {
    console.log(`Content-plan redirects: ${expected.length} entries in TS`);
    for (const row of expected) {
      console.log(`  ${row.from_path} → ${row.to_path}`);
    }
    return;
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env.local");
  }

  const { createSupabaseAdminClient } = await import(
    pathToFileURL(path.join(root, "src/lib/supabase/admin.ts")).href
  );

  const supabase = createSupabaseAdminClient();

  const { data: existing, error: listError } = await supabase
    .from("url_redirects")
    .select("from_path, to_path, status_code, enabled, note")
    .eq("note", NOTE);

  if (listError) throw new Error(listError.message);

  const existingByFrom = new Map((existing ?? []).map((row) => [row.from_path, row]));

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const row of expected) {
    const prev = existingByFrom.get(row.from_path);
    if (!prev) {
      const { error } = await supabase.from("url_redirects").insert(row);
      if (error) throw new Error(`${row.from_path}: ${error.message}`);
      created += 1;
      continue;
    }

    const needsUpdate =
      prev.to_path !== row.to_path ||
      prev.status_code !== row.status_code ||
      prev.enabled !== row.enabled;

    if (!needsUpdate) {
      unchanged += 1;
      continue;
    }

    const { error } = await supabase
      .from("url_redirects")
      .update({
        to_path: row.to_path,
        status_code: row.status_code,
        enabled: row.enabled,
        note: row.note,
      })
      .eq("from_path", row.from_path);

    if (error) throw new Error(`${row.from_path}: ${error.message}`);
    updated += 1;
  }

  console.log(
    `url_redirects sync: ${expected.length} expected, created ${created}, updated ${updated}, unchanged ${unchanged}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
