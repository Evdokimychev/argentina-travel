#!/usr/bin/env node
/**
 * Apply pending supabase/migrations/*.sql with a canonical checksum journal.
 * Refuses to replay the full catalog over an existing unjournaled schema.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { resolveSupabaseDatabaseUrl } from "./supabase-resolve-db-url.mjs";
import {
  assertMigrationTarget,
  buildMigrationPlan,
  isLocalDatabaseUrl,
  migrationChecksum,
} from "./lib/migration-journal.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    if (process.env.DATABASE_URL?.trim()) return;
    throw new Error(".env.local not found and DATABASE_URL is not set");
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
  const connectionString = process.env.DATABASE_URL?.trim();
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

  const migrations = migrationFiles.map((file) => {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    return { id: file.replace(/\.sql$/, ""), file, sql, checksum: migrationChecksum(sql) };
  });

  const target = assertMigrationTarget(process.env, connectionString);

  const resolvedUrl = await resolveSupabaseDatabaseUrl(connectionString);
  if (resolvedUrl !== connectionString) {
    console.log("Using Supabase Session pooler (direct host unreachable)…");
  }

  const client = new pg.Client({
    connectionString: resolvedUrl,
    ssl: isLocalDatabaseUrl(resolvedUrl) ? false : { rejectUnauthorized: false },
  });

  console.log("Connecting to Supabase Postgres…");
  await client.connect();

  const { rows: inventoryRows } = await client.query(`
    select
      (select count(*)::integer from pg_tables where schemaname = 'public') as public_table_count,
      to_regclass('app_migrations.schema_migrations') is not null as journal_exists
  `);
  const inventory = inventoryRows[0];
  if (inventory.public_table_count > 0 && !inventory.journal_exists) {
    buildMigrationPlan(migrations, [], inventory.public_table_count);
  }

  if (!inventory.journal_exists) {
    await client.query(`
      create schema app_migrations;
      revoke all on schema app_migrations from public, anon, authenticated;
      grant usage on schema app_migrations to service_role;
      create table app_migrations.schema_migrations (
        migration_id text primary key,
        checksum text not null check (checksum ~ '^[a-f0-9]{64}$'),
        applied_at timestamptz not null default now(),
        git_sha text null
      );
      revoke all on app_migrations.schema_migrations from public, anon, authenticated;
      grant select, insert on app_migrations.schema_migrations to service_role;
    `);
  }

  const { rows: appliedRows } = await client.query(
    "select migration_id, checksum from app_migrations.schema_migrations order by migration_id",
  );
  const pending = buildMigrationPlan(migrations, appliedRows, inventory.public_table_count);
  console.log(
    `Migration target: ${target.environment}; applied=${appliedRows.length}; pending=${pending.length}`,
  );

  for (const migration of pending) {
    console.log("Applying migration:", migration.file);
    await client.query("begin");
    try {
      await client.query(migration.sql);
      await client.query(
        `insert into app_migrations.schema_migrations (migration_id, checksum, git_sha)
         values ($1, $2, $3)`,
        [migration.id, migration.checksum, process.env.GIT_SHA?.trim() || null],
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }

  const { rows } = await client.query(`
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename in (
        'newsletter_subscribers',
        'contact_submissions',
        'profiles',
        'bookings',
        'tripster_experiences',
        'tripster_cities'
      )
    order by tablename
  `);

  console.log("Tables ready:", rows.map((r) => r.tablename).join(", ") || "(none)");
  await client.end();
  console.log(`Done. Applied ${pending.length} migration(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
