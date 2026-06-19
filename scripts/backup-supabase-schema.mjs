#!/usr/bin/env node
/**
 * Schema-only backup of Supabase Postgres (public + auth metadata).
 *
 * Requires:
 * - DATABASE_URL in .env.local (or env)
 * - pg_dump in PATH (PostgreSQL client tools)
 *
 * Output:
 * - var/backups/schema-YYYYMMDD-HHMMSS.sql
 * - var/ops/backup-last.json (hint for admin UI)
 *
 * Usage:
 *   npm run backup:schema
 *   node scripts/backup-supabase-schema.mjs
 *
 * Manual equivalent:
 *   pg_dump "$DATABASE_URL" --schema-only --no-owner --no-privileges \
 *     --schema=public --schema=auth --schema=storage \
 *     -f var/backups/schema-manual.sql
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const backupsDir = path.join(root, "var/backups");
const opsDir = path.join(root, "var/ops");

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

function timestampSlug(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function hasPgDump() {
  const probe = spawnSync("pg_dump", ["--version"], { encoding: "utf8" });
  return probe.status === 0;
}

async function main() {
  loadEnvLocal();

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Set it in .env.local or the environment.");
  }

  if (!hasPgDump()) {
    console.error("pg_dump not found in PATH.");
    console.error("Install PostgreSQL client tools, then rerun:");
    console.error(
      '  pg_dump "$DATABASE_URL" --schema-only --no-owner --no-privileges --schema=public --schema=auth --schema=storage -f var/backups/schema-manual.sql'
    );
    process.exit(1);
  }

  fs.mkdirSync(backupsDir, { recursive: true });
  fs.mkdirSync(opsDir, { recursive: true });

  const now = new Date();
  const fileName = `schema-${timestampSlug(now)}.sql`;
  const outputPath = path.join(backupsDir, fileName);

  console.log("Creating schema-only dump…");
  const dump = spawnSync(
    "pg_dump",
    [
      connectionString,
      "--schema-only",
      "--no-owner",
      "--no-privileges",
      "--schema=public",
      "--schema=auth",
      "--schema=storage",
      "-f",
      outputPath,
    ],
    { encoding: "utf8" }
  );

  if (dump.status !== 0) {
    console.error(dump.stderr || dump.stdout || "pg_dump failed");
    process.exit(1);
  }

  const meta = {
    lastBackupAt: now.toISOString(),
    lastBackupFile: fileName,
    sizeBytes: fs.statSync(outputPath).size,
  };

  fs.writeFileSync(path.join(opsDir, "backup-last.json"), `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  console.log(`✓ Schema backup saved: ${path.relative(root, outputPath)} (${meta.sizeBytes} bytes)`);
  console.log("Store backups off-site (S3, encrypted archive) before major migrations.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
