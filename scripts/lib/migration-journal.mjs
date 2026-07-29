import { createHash } from "node:crypto";
import {
  parseSupabaseDatabaseTarget,
  resolveTrustedSupabaseProjectRef,
} from "./database-target-attestation.mjs";

export const PRODUCTION_PROJECT_REF = "uooxrypocahomoqzdvzy";
export const PRODUCTION_CONFIRMATION = "BACKUP_RESTORE_AND_STAGING_ACCEPTANCE_PASSED";
export const BASELINE_CONFIRMATION = "PRODUCTION_SCHEMA_FINGERPRINT_VERIFIED";

export function databaseProjectRef(connectionString) {
  return parseSupabaseDatabaseTarget(connectionString).projectRef;
}

export function isLocalDatabaseUrl(connectionString) {
  try {
    const hostname = new URL(connectionString).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function migrationChecksum(sql) {
  return createHash("sha256").update(sql).digest("hex");
}

export function migrationSetChecksum(migrations) {
  const canonical = migrations
    .map(({ id, checksum }) => `${id}:${checksum}`)
    .sort()
    .join("\n");
  return createHash("sha256").update(canonical).digest("hex");
}

export function validateBaselineManifest(manifest, context) {
  if (!manifest || manifest.version !== 1) throw new Error("Unsupported migration baseline manifest");
  if (manifest.projectRef !== context.projectRef) throw new Error("Baseline project ref mismatch");
  if (!Number.isInteger(manifest.migrations?.count) || context.migrations.length < manifest.migrations.count) {
    throw new Error("Baseline migration count mismatch");
  }
  const baselineMigrations = context.migrations.slice(0, manifest.migrations.count);
  if (manifest.migrations?.latestId !== baselineMigrations.at(-1)?.id) {
    throw new Error("Baseline latest migration mismatch");
  }
  if (manifest.migrations?.setChecksum !== migrationSetChecksum(baselineMigrations)) {
    throw new Error("Baseline migration set checksum mismatch");
  }
  if (context.schema && manifest.schema?.fingerprint !== context.schema.fingerprint) {
    throw new Error("Production schema fingerprint does not match the reviewed baseline");
  }
  if (context.schema && manifest.schema?.objectCount !== context.schema.objectCount) {
    throw new Error("Production schema object count does not match the reviewed baseline");
  }
  return manifest;
}

export function assertMigrationTarget(env, connectionString) {
  const environment = env.MIGRATION_TARGET_ENVIRONMENT?.trim().toLowerCase();
  if (!environment || !["local", "staging", "production"].includes(environment)) {
    throw new Error(
      "MIGRATION_TARGET_ENVIRONMENT must be exactly local, staging, or production",
    );
  }

  const projectRef = databaseProjectRef(connectionString);
  if (projectRef === PRODUCTION_PROJECT_REF && environment !== "production") {
    throw new Error("The production Supabase project cannot be used as a local or staging target");
  }
  if (environment === "staging" && !projectRef) {
    throw new Error("A hosted Supabase project URL is required for staging migrations");
  }
  if (environment === "staging") {
    const expectedProjectRef = resolveTrustedSupabaseProjectRef(env, {
      projectRefEnvNames: ["MIGRATION_TARGET_PROJECT_REF", "SUPABASE_PROJECT_REF"],
      urlEnvNames: ["NEXT_PUBLIC_SUPABASE_URL"],
    });
    if (projectRef !== expectedProjectRef) {
      throw new Error("The staging migration target does not match the explicitly trusted project ref");
    }
  }
  if (environment === "production") {
    if (projectRef !== PRODUCTION_PROJECT_REF) {
      throw new Error("The production migration target does not match the canonical project ref");
    }
    if (env.MIGRATION_PRODUCTION_CONFIRMATION !== PRODUCTION_CONFIRMATION) {
      throw new Error(
        `MIGRATION_PRODUCTION_CONFIRMATION must be exactly ${PRODUCTION_CONFIRMATION}`,
      );
    }
  }

  return { environment, projectRef };
}

export function buildMigrationPlan(migrations, appliedRows, publicTableCount) {
  if (publicTableCount > 0 && appliedRows.length === 0) {
    throw new Error(
      "Existing public schema has no canonical app migration journal. Refusing blind replay; create and verify a production-like baseline first.",
    );
  }

  const current = new Map(migrations.map((migration) => [migration.id, migration]));
  for (const row of appliedRows) {
    const migration = current.get(row.migration_id);
    if (!migration) {
      throw new Error(`Migration journal contains an unknown id: ${row.migration_id}`);
    }
    if (migration.checksum !== row.checksum) {
      throw new Error(`Migration checksum changed after apply: ${row.migration_id}`);
    }
  }

  const applied = new Set(appliedRows.map((row) => row.migration_id));
  return migrations.filter((migration) => !applied.has(migration.id));
}
