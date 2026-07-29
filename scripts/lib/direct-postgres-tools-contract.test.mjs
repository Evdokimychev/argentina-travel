import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const guardedClientFiles = [
  ["scripts/auth-reconcile.mjs", "resolveDatabaseUrl", "new pg.Client"],
  ["scripts/cleanup-supabase-storage.mjs", "resolveDatabaseUrl", "new pg.Client"],
  ["scripts/migrate-media-to-reg-ru.mjs", "resolveDatabaseUrl", "new pg.Client"],
  ["scripts/production-readiness.mjs", "resolveDatabaseUrl", "new pg.Client"],
  ["scripts/tripster-db-pg.mjs", "resolveSupabaseDatabaseUrl", "new pg.Client"],
  ["scripts/sputnik8-db-pg.mjs", "resolveSupabaseDatabaseUrl", "new pg.Client"],
  ["scripts/youtravel-db-pg.mjs", "resolveDatabaseUrl", "new Client"],
  ["scripts/supabase-apply-migration.mjs", "assertMigrationTarget", "new pg.Client"],
  ["scripts/supabase-baseline-migrations.mjs", "PRODUCTION_PROJECT_REF", "new pg.Client"],
];

test("every operational pg.Client path reaches attestation before construction", () => {
  for (const [file, guard, clientMarker] of guardedClientFiles) {
    const source = read(file);
    const guardIndex = source.lastIndexOf(guard, source.indexOf(clientMarker));
    assert.ok(guardIndex >= 0, `${file} must use ${guard} before ${clientMarker}`);
  }

  const resolver = read("scripts/supabase-resolve-db-url.mjs");
  assert.ok(
    resolver.indexOf("assertDatabaseTarget") < resolver.indexOf("if (await tryConnect(connectionString))"),
    "connectivity probing must happen only after target attestation",
  );
});

test("schema and logical backup tools attest targets without URL command arguments", () => {
  const schemaBackup = read("scripts/backup-supabase-schema.mjs");
  assert.match(schemaBackup, /assertDatabaseTarget/);
  assert.match(schemaBackup, /postgresProcessEnv/);
  assert.doesNotMatch(schemaBackup, /\[\s*connectionString,\s*"--schema-only"/);

  const logicalBackup = read("scripts/lib/database-backup.mjs");
  assert.match(logicalBackup, /assertDatabaseTarget/);
  assert.doesNotMatch(logicalBackup, /hostname\.includes\(projectRef\)|username.*includes\(projectRef\)/);
});

test("cross-project copy requires dual target identity and the legacy raw runner is disabled", () => {
  const copy = read("scripts/migrate-supabase-data.mjs");
  assert.match(copy, /assertDistinctDatabaseTargets/);
  assert.match(copy, /OLD_SUPABASE_PROJECT_REF/);
  assert.match(copy, /MIGRATION_PRODUCTION_CONFIRMATION/);
  assert.doesNotMatch(
    copy,
    /allowProductionTarget:\s*dryRun/,
    "dry-run must not bypass production-target confirmation",
  );
  assert.ok(copy.indexOf("assertDistinctDatabaseTargets") < copy.indexOf("pgClient(targets.source.connectionString)"));

  const legacy = read("scripts/supabase-apply-pending-admin.mjs");
  assert.match(legacy, /unjournaled migration runner is disabled/);
  assert.doesNotMatch(legacy, /from "pg"|new pg\.Client|DATABASE_URL/);
});
