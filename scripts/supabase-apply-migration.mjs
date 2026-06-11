#!/usr/bin/env node
/**
 * Apply all supabase/migrations/*.sql (sorted by name) using DATABASE_URL from .env.local
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

  const migrationsDir = path.join(root, "supabase/migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  if (migrationFiles.length === 0) {
    throw new Error(`No migration files in ${migrationsDir}`);
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connecting to Supabase Postgres…");
  await client.connect();

  for (const file of migrationFiles) {
    const migrationPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(migrationPath, "utf8");
    console.log("Applying migration:", file);
    await client.query(sql);
  }

  const { rows } = await client.query(`
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename in (
        'newsletter_subscribers',
        'contact_submissions',
        'profiles',
        'bookings'
      )
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
