import { createHash } from "node:crypto";

export const PRODUCTION_PROJECT_REF = "uooxrypocahomoqzdvzy";
export const PRODUCTION_CONFIRMATION = "BACKUP_RESTORE_AND_STAGING_ACCEPTANCE_PASSED";

export function databaseProjectRef(connectionString) {
  try {
    const url = new URL(connectionString);
    const hostRef = url.hostname.match(/^(?:db\.)?([a-z0-9]{20})\.supabase\.(?:co|com)$/i)?.[1];
    if (hostRef) return hostRef.toLowerCase();
    return decodeURIComponent(url.username).match(/^postgres\.([a-z0-9]{20})$/i)?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
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
