#!/usr/bin/env node
/**
 * Apply supabase/migrations/*.sql using DATABASE_URL from .env.local
 * Usage: npm run supabase:migrate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found. Copy .env.example and fill in values.");
  }
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
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
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing in .env.local");
  }

  const migrationPath = path.join(
    root,
    "supabase/migrations/20250611000000_lead_capture.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf8");

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connecting to Supabase Postgres…");
  await client.connect();
  console.log("Applying migration:", path.basename(migrationPath));
  await client.query(sql);

  const { rows } = await client.query(`
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename in ('newsletter_subscribers', 'contact_submissions')
    order by tablename
  `);

  console.log("Tables ready:", rows.map((r) => r.tablename).join(", ") || "(none)");
  await client.end();
  console.log("Done.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
