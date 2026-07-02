#!/usr/bin/env node
/**
 * Purge Supabase Storage objects (media buckets).
 *
 * Uses direct Postgres when Storage REST API is blocked (egress quota 402).
 * Does NOT unblock the Supabase project — only frees storage metadata/bytes.
 *
 * Usage:
 *   node scripts/cleanup-supabase-storage.mjs --dry-run
 *   node scripts/cleanup-supabase-storage.mjs --execute
 *   node scripts/cleanup-supabase-storage.mjs --execute --bucket cms-media
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { resolveDatabaseUrl } from "./resolve-database-url.mjs";

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
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

loadEnvLocal();

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || !args.has("--execute");
const bucketFilter = (() => {
  const idx = process.argv.indexOf("--bucket");
  return idx >= 0 ? process.argv[idx + 1]?.trim() : null;
})();

if (!dryRun && !args.has("--execute")) {
  console.log(`Usage:
  node scripts/cleanup-supabase-storage.mjs --dry-run
  node scripts/cleanup-supabase-storage.mjs --execute
  node scripts/cleanup-supabase-storage.mjs --execute --bucket cms-media`);
  process.exit(1);
}

async function listViaPostgres() {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error("No DATABASE_URL / POSTGRES_URL configured");
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    const buckets = await client.query(
      `select id, name, public from storage.buckets order by name`
    );

    const counts = await client.query(
      `select bucket_id, count(*)::bigint as object_count,
              coalesce(sum((metadata->>'size')::bigint), 0)::bigint as bytes
       from storage.objects
       group by bucket_id
       order by bucket_id`
    );

    const countMap = new Map(
      counts.rows.map((row) => [
        row.bucket_id,
        { objectCount: Number(row.object_count), bytes: Number(row.bytes) },
      ])
    );

    return {
      client,
      buckets: buckets.rows.map((row) => ({
        id: row.id,
        name: row.name,
        public: row.public,
        ...(countMap.get(row.id) ?? { objectCount: 0, bytes: 0 }),
      })),
    };
  } catch (error) {
    await client.end().catch(() => undefined);
    throw error;
  }
}

async function deleteViaPostgres(client, bucketIds) {
  if (bucketIds.length === 0) return 0;

  const placeholders = bucketIds.map((_, i) => `$${i + 1}`).join(", ");
  const result = await client.query(
    `delete from storage.objects where bucket_id in (${placeholders})`,
    bucketIds
  );
  return result.rowCount ?? 0;
}

async function deleteViaStorageApi(bucketName) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return { ok: false, reason: "missing Supabase env" };

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: files, error: listError } = await supabase.storage.from(bucketName).list("", {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (listError) {
    return { ok: false, reason: listError.message };
  }

  const paths = [];
  async function walk(prefix) {
    const { data, error } = await supabase.storage.from(bucketName).list(prefix, {
      limit: 1000,
    });
    if (error || !data) return;

    for (const entry of data) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id == null) {
        await walk(fullPath);
      } else {
        paths.push(fullPath);
      }
    }
  }

  for (const entry of files ?? []) {
    const fullPath = entry.name;
    if (entry.id == null) {
      await walk(fullPath);
    } else {
      paths.push(fullPath);
    }
  }

  if (paths.length === 0) return { ok: true, deleted: 0 };

  const batchSize = 100;
  let deleted = 0;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const { error } = await supabase.storage.from(bucketName).remove(batch);
    if (error) return { ok: false, reason: error.message, deleted };
    deleted += batch.length;
  }

  return { ok: true, deleted };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function main() {
  console.log(dryRun ? "Mode: dry-run" : "Mode: execute");
  if (bucketFilter) console.log(`Bucket filter: ${bucketFilter}`);

  const { client, buckets } = await listViaPostgres();
  const selected = bucketFilter ? buckets.filter((b) => b.name === bucketFilter) : buckets;

  if (selected.length === 0) {
    console.log(bucketFilter ? `Bucket not found: ${bucketFilter}` : "No storage buckets found.");
    await client.end();
    return;
  }

  let totalObjects = 0;
  let totalBytes = 0;

  console.log("\nStorage buckets:");
  for (const bucket of selected) {
    totalObjects += bucket.objectCount;
    totalBytes += bucket.bytes;
    console.log(
      `  - ${bucket.name}: ${bucket.objectCount} objects, ${formatBytes(bucket.bytes)}${bucket.public ? " (public)" : ""}`
    );
  }
  console.log(`\nTotal: ${totalObjects} objects, ${formatBytes(totalBytes)}`);

  if (totalObjects === 0) {
    console.log("\nNothing to delete — storage.objects is already empty.");
    await client.end();
    return;
  }

  if (dryRun) {
    console.log("\nDry-run complete. Re-run with --execute to delete.");
    await client.end();
    return;
  }

  const bucketIds = selected.map((b) => b.id);
  const deleted = await deleteViaPostgres(client, bucketIds);
  console.log(`\nDeleted ${deleted} rows from storage.objects via Postgres.`);

  await client.end();

  for (const bucket of selected) {
    const apiResult = await deleteViaStorageApi(bucket.name);
    if (apiResult.ok) {
      if (apiResult.deleted > 0) {
        console.log(`Storage API: removed ${apiResult.deleted} files from ${bucket.name}`);
      }
    } else if (apiResult.reason) {
      console.log(`Storage API skipped for ${bucket.name}: ${apiResult.reason}`);
    }
  }

  console.log("\nCleanup finished.");
  console.log(
    "Note: Supabase project may remain blocked until egress quota resets or plan is upgraded."
  );
  console.log("Site catalog uses Postgres fallback + media.goargentina.ru CDN.");
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
