#!/usr/bin/env node
/**
 * Apply pending admin migrations only (from 20250619000000).
 * Usage: node scripts/supabase-apply-pending-admin.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { resolveSupabaseDatabaseUrl } from "./supabase-resolve-db-url.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found.");
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

const PENDING = [
  "20250619000000_admin_panel.sql",
  "20250620000000_cms_content.sql",
];

async function main() {
  loadEnvLocal();
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is missing");

  const resolvedUrl = await resolveSupabaseDatabaseUrl(connectionString);
  const client = new pg.Client({
    connectionString: resolvedUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Applying pending admin migrations…");

  for (const file of PENDING) {
    const sql = fs.readFileSync(path.join(root, "supabase/migrations", file), "utf8");
    console.log("Applying:", file);
    await client.query(sql);
  }

  const { rows } = await client.query(`
    select tablename from pg_tables
    where schemaname = 'public'
      and tablename in ('admin_staff', 'content_documents', 'site_settings')
    order by tablename
  `);
  console.log("Verified tables:", rows.map((r) => r.tablename).join(", "));
  await client.end();
  console.log("Done.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
