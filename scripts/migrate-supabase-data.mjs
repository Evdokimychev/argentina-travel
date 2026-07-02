#!/usr/bin/env node
/**
 * Copy public schema data between Supabase Postgres instances.
 *
 * Usage:
 *   OLD_DATABASE_URL=... DATABASE_URL=... node scripts/migrate-supabase-data.mjs --dry-run
 *   OLD_DATABASE_URL=... node scripts/migrate-supabase-data.mjs --execute
 *
 * Reads OLD_DATABASE_URL from env or var/ops/old-database-url.txt
 * Reads DATABASE_URL from env / .env.local (target = new project)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function loadEnvLocal() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(ROOT, file);
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

loadEnvLocal();

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || !args.has("--execute");

const oldUrl =
  process.env.OLD_DATABASE_URL?.trim() ||
  (fs.existsSync(path.join(ROOT, "var/ops/old-database-url.txt"))
    ? fs.readFileSync(path.join(ROOT, "var/ops/old-database-url.txt"), "utf8").trim()
    : null);
const newUrl = process.env.DATABASE_URL?.trim();

if (!oldUrl || !newUrl) {
  console.error("Need OLD_DATABASE_URL (or var/ops/old-database-url.txt) and DATABASE_URL");
  process.exit(1);
}

function pgClient(url) {
  return new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
  });
}

async function listTables(client) {
  const { rows } = await client.query(`
    select c.relname as name, coalesce(s.n_live_tup, 0)::bigint as rows
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_stat_user_tables s on s.relid = c.oid
    where n.nspname = 'public'
      and c.relkind = 'r'
    order by c.relname
  `);
  return rows;
}

async function getColumns(client, table) {
  const { rows } = await client.query(
    `select column_name, udt_name, data_type, is_generated
     from information_schema.columns
     where table_schema = 'public' and table_name = $1
     order by ordinal_position`,
    [table]
  );
  return rows;
}

function serializeValue(columnMeta, value) {
  if (value == null) return null;
  if (columnMeta.udt_name === "json" || columnMeta.udt_name === "jsonb") {
    return typeof value === "string" ? value : JSON.stringify(value);
  }
  return value;
}

async function copyTable(oldClient, newClient, table, columnMetas) {
  const { rows } = await oldClient.query(`select * from public."${table}"`);
  if (rows.length === 0) return 0;

  const cols = columnMetas.map((c) => c.column_name);
  const colList = cols.map((c) => `"${c}"`).join(", ");
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = [];
    const placeholders = batch
      .map((row, rowIndex) => {
        const base = rowIndex * cols.length;
        columnMetas.forEach((meta) => values.push(serializeValue(meta, row[meta.column_name])));
        const ph = cols.map((_, colIndex) => `$${base + colIndex + 1}`).join(", ");
        return `(${ph})`;
      })
      .join(", ");

    await newClient.query(
      `insert into public."${table}" (${colList}) values ${placeholders} on conflict do nothing`,
      values
    );
    inserted += batch.length;
  }

  return inserted;
}

async function resetSequences(client) {
  const { rows } = await client.query(`
    select sequence_schema, sequence_name
    from information_schema.sequences
    where sequence_schema = 'public'
  `);

  for (const { sequence_name } of rows) {
    const tableGuess = sequence_name.replace(/_id_seq$/, "");
    try {
      await client.query(`
        select setval(
          pg_get_serial_sequence('public."${tableGuess}"', 'id'),
          coalesce((select max(id) from public."${tableGuess}"), 1),
          (select max(id) is not null from public."${tableGuess}")
        )
      `);
    } catch {
      // not all sequences map to id columns — skip
    }
  }
}

async function main() {
  console.log(dryRun ? "Mode: dry-run" : "Mode: execute");
  const oldClient = pgClient(oldUrl);
  const newClient = pgClient(newUrl);

  await oldClient.connect();
  await newClient.connect();

  const oldTables = await listTables(oldClient);
  const newTables = new Set((await listTables(newClient)).map((t) => t.name));
  const toCopy = oldTables.filter((t) => Number(t.rows) > 0 && newTables.has(t.name));

  console.log(`Tables with data to copy: ${toCopy.length}`);
  for (const t of toCopy) {
    console.log(`  - ${t.name}: ${t.rows} rows`);
  }

  if (dryRun) {
    await oldClient.end();
    await newClient.end();
    return;
  }

  await newClient.query("set session_replication_role = replica");

  let total = 0;
  for (const { name } of toCopy) {
    const oldCols = await getColumns(oldClient, name);
    const newCols = await getColumns(newClient, name);
    const newColMap = new Map(newCols.map((c) => [c.column_name, c]));
    const shared = oldCols.filter(
      (c) => newColMap.has(c.column_name) && newColMap.get(c.column_name)?.is_generated !== "ALWAYS"
    );
    if (shared.length === 0) {
      console.warn(`Skip ${name}: no shared insertable columns`);
      continue;
    }
    try {
      await newClient.query(`delete from public."${name}"`);
      const count = await copyTable(oldClient, newClient, name, shared);
      console.log(`Copied ${name}: ${count}`);
      total += count;
    } catch (error) {
      console.error(`Failed ${name}:`, error instanceof Error ? error.message : error);
    }
  }

  await newClient.query("set session_replication_role = origin");
  await resetSequences(newClient);

  console.log(`Done. Rows inserted (attempted): ${total}`);
  await oldClient.end();
  await newClient.end();
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
