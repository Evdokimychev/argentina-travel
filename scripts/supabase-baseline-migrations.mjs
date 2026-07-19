#!/usr/bin/env node
/**
 * Inspect or initialize the checksum-backed app migration journal.
 * Inspection is read-only. Apply is production-only, fingerprint-gated, and transactional.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import nextEnv from "@next/env";
import { resolveSupabaseDatabaseUrl } from "./supabase-resolve-db-url.mjs";
import {
  BASELINE_CONFIRMATION,
  PRODUCTION_PROJECT_REF,
  databaseProjectRef,
  isLocalDatabaseUrl,
  migrationChecksum,
  migrationSetChecksum,
  validateBaselineManifest,
} from "./lib/migration-journal.mjs";
import {
  DATABASE_SCHEMA_INVENTORY_SQL,
  fingerprintSchemaInventory,
} from "./lib/database-schema-fingerprint.mjs";

const root = process.cwd();
const migrationsDir = path.join(root, "supabase/migrations");
const manifestPath = path.join(root, "supabase/baselines/production-2026-07-19-v1.json");
const apply = process.argv.includes("--apply");
const verify = process.argv.includes("--verify");

nextEnv.loadEnvConfig(root, false);

function loadMigrations() {
  return fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((file) => {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      return { id: file.replace(/\.sql$/, ""), checksum: migrationChecksum(sql) };
    });
}

async function inspectDatabase(client, migrations, projectRef) {
  const [{ rows: schemaRows }, { rows: versionRows }] = await Promise.all([
    client.query(DATABASE_SCHEMA_INVENTORY_SQL),
    client.query("select current_setting('server_version') as version"),
  ]);
  const schema = fingerprintSchemaInventory(schemaRows);
  return {
    version: 1,
    baselineId: "production-2026-07-19-v1",
    projectRef,
    capturedAt: new Date().toISOString(),
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA?.trim() || process.env.GIT_SHA?.trim() || null,
    postgresVersion: versionRows[0]?.version ?? null,
    migrations: {
      count: migrations.length,
      latestId: migrations.at(-1)?.id ?? null,
      setChecksum: migrationSetChecksum(migrations),
    },
    schema,
    evidence: {
      encryptedBackups: [
        "/Users/Study/.codex/private-archives/argentina-travel/production-backup-before-governance-2026-07-19",
        "/Users/Study/.codex/private-archives/argentina-travel/production-backup-before-content-factory-2026-07-19",
      ],
      releaseAudit: "docs/audit/full-release-audit-2026-07-19.md",
    },
  };
}

async function applyBaseline(client, manifest, migrations) {
  if (process.env.MIGRATION_BASELINE_CONFIRMATION !== BASELINE_CONFIRMATION) {
    throw new Error(`MIGRATION_BASELINE_CONFIRMATION must be exactly ${BASELINE_CONFIRMATION}`);
  }

  await client.query("begin");
  try {
    await client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [
      "argentina-travel:app-migrations",
    ]);
    const { rows: journalRows } = await client.query(`
      select to_regclass('app_migrations.schema_migrations')::text as journal
    `);
    if (journalRows[0]?.journal) {
      const { rows } = await client.query(
        "select migration_id, checksum from app_migrations.schema_migrations order by migration_id",
      );
      if (rows.length === migrations.length && rows.every((row, index) =>
        row.migration_id === migrations[index].id && row.checksum === migrations[index].checksum
      )) {
        await client.query("rollback");
        return { alreadyApplied: true, applied: 0 };
      }
      throw new Error("Existing app migration journal is partial or differs from the reviewed baseline");
    }

    await client.query(`
      create schema app_migrations;
      revoke all on schema app_migrations from public, anon, authenticated;
      grant usage on schema app_migrations to service_role;

      create table app_migrations.baselines (
        baseline_id text primary key,
        project_ref text not null,
        schema_fingerprint text not null check (schema_fingerprint ~ '^[a-f0-9]{64}$'),
        migration_set_checksum text not null check (migration_set_checksum ~ '^[a-f0-9]{64}$'),
        manifest jsonb not null,
        applied_at timestamptz not null default now()
      );

      create table app_migrations.schema_migrations (
        migration_id text primary key,
        checksum text not null check (checksum ~ '^[a-f0-9]{64}$'),
        applied_at timestamptz not null default now(),
        git_sha text null,
        source text not null default 'migration' check (source in ('baseline', 'migration')),
        baseline_id text null references app_migrations.baselines(baseline_id)
      );

      revoke all on app_migrations.baselines from public, anon, authenticated;
      revoke all on app_migrations.schema_migrations from public, anon, authenticated;
      grant select on app_migrations.baselines to service_role;
      grant select, insert on app_migrations.schema_migrations to service_role;
    `);

    await client.query(
      `insert into app_migrations.baselines
        (baseline_id, project_ref, schema_fingerprint, migration_set_checksum, manifest)
       values ($1, $2, $3, $4, $5::jsonb)`,
      [
        manifest.baselineId,
        manifest.projectRef,
        manifest.schema.fingerprint,
        manifest.migrations.setChecksum,
        JSON.stringify(manifest),
      ],
    );

    for (const migration of migrations) {
      await client.query(
        `insert into app_migrations.schema_migrations
          (migration_id, checksum, git_sha, source, baseline_id)
         values ($1, $2, $3, 'baseline', $4)`,
        [migration.id, migration.checksum, manifest.gitSha, manifest.baselineId],
      );
    }
    await client.query("commit");
    return { alreadyApplied: false, applied: migrations.length };
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  }
}

async function verifyAppliedBaseline(client, manifest, migrations, projectRef) {
  validateBaselineManifest(manifest, {
    projectRef,
    migrations,
  });
  const { rows: baselineRows } = await client.query(
    `select baseline_id, project_ref, schema_fingerprint, migration_set_checksum
     from app_migrations.baselines
     where baseline_id = $1`,
    [manifest.baselineId],
  );
  const baseline = baselineRows[0];
  if (!baseline) throw new Error("Applied baseline metadata is missing");
  if (
    baseline.project_ref !== manifest.projectRef ||
    baseline.schema_fingerprint !== manifest.schema.fingerprint ||
    baseline.migration_set_checksum !== manifest.migrations.setChecksum
  ) {
    throw new Error("Applied baseline metadata differs from the committed manifest");
  }
  const { rows } = await client.query(
    `select migration_id, checksum
     from app_migrations.schema_migrations
     where baseline_id = $1
     order by migration_id`,
    [manifest.baselineId],
  );
  const expected = migrations.slice(0, manifest.migrations.count);
  if (
    rows.length !== expected.length ||
    !rows.every((row, index) =>
      row.migration_id === expected[index].id && row.checksum === expected[index].checksum
    )
  ) {
    throw new Error("Applied baseline migration rows differ from repository checksums");
  }
  return { baselineCount: expected.length, pendingCount: migrations.length - expected.length };
}

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const projectRef = databaseProjectRef(connectionString);
  if (projectRef !== PRODUCTION_PROJECT_REF) {
    throw new Error("Baseline inspection must target the canonical production project");
  }
  const migrations = loadMigrations();
  const resolvedUrl = await resolveSupabaseDatabaseUrl(connectionString);
  const client = new pg.Client({
    connectionString: resolvedUrl,
    ssl: isLocalDatabaseUrl(resolvedUrl) ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 12000,
  });
  await client.connect();
  try {
    const inspection = await inspectDatabase(client, migrations, projectRef);
    if (!apply && !verify) {
      console.log(JSON.stringify(inspection, null, 2));
      return;
    }

    if (!fs.existsSync(manifestPath)) throw new Error(`Baseline manifest not found: ${manifestPath}`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const { rows: journalRows } = await client.query(
      "select to_regclass('app_migrations.schema_migrations')::text as journal",
    );
    const journalExists = Boolean(journalRows[0]?.journal);
    if (verify) {
      if (journalExists) {
        const result = await verifyAppliedBaseline(client, manifest, migrations, projectRef);
        console.log(
          `Baseline journal verified: ${manifest.baselineId}; baseline=${result.baselineCount}; pending=${result.pendingCount}`,
        );
        return;
      }
      validateBaselineManifest(manifest, {
        projectRef,
        migrations,
        schema: inspection.schema,
      });
      console.log(
        `Baseline verified read-only: ${manifest.baselineId}; migrations=${migrations.length}; objects=${inspection.schema.objectCount}`,
      );
      return;
    }
    validateBaselineManifest(manifest, {
      projectRef,
      migrations,
      schema: inspection.schema,
    });
    if (process.env.MIGRATION_TARGET_ENVIRONMENT?.trim().toLowerCase() !== "production") {
      throw new Error("MIGRATION_TARGET_ENVIRONMENT must be exactly production for baseline apply");
    }
    const result = await applyBaseline(client, manifest, migrations);
    console.log(
      result.alreadyApplied
        ? `Baseline already applied: ${manifest.baselineId}`
        : `Baseline applied atomically: ${result.applied} migration records`,
    );
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
