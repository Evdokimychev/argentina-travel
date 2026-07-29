import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { assertDatabaseTarget, parseSupabaseDatabaseTarget } from "./database-target-attestation.mjs";

export const KNOWN_PRODUCTION_SUPABASE_PROJECT_REF = "uooxrypocahomoqzdvzy";
export const RESTORE_DISPOSABLE_CONFIRMATION = "YES_DISPOSABLE_TARGET_ONLY";

const PROJECT_REF_RE = /^[a-z0-9]{20}$/;
const AGE_RECIPIENT_RE = /^age1[0-9a-z]{20,}$/;

export const DATABASE_EVIDENCE_SQL = String.raw`
begin isolation level repeatable read read only;

with schema_inventory as (
  select coalesce(jsonb_agg(namespace.nspname order by namespace.nspname), '[]'::jsonb) as value
  from pg_catalog.pg_namespace namespace
  where namespace.nspname in ('public', 'auth', 'storage')
), rls_inventory as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', namespace.nspname || '.' || relation.relname,
        'enabled', relation.relrowsecurity,
        'forced', relation.relforcerowsecurity
      )
      order by namespace.nspname, relation.relname
    ),
    '[]'::jsonb
  ) as value
  from pg_catalog.pg_class relation
  join pg_catalog.pg_namespace namespace on namespace.oid = relation.relnamespace
  where namespace.nspname in ('public', 'auth', 'storage')
    and relation.relkind in ('r', 'p')
)
select jsonb_build_object(
  'capturedAt', clock_timestamp(),
  'serverVersionNum', current_setting('server_version_num'),
  'schemas', schema_inventory.value,
  'rls', rls_inventory.value
)::text
from schema_inventory, rls_inventory;

rollback;
`;

function required(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function parsePostgresConnection(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Database connection must be a valid PostgreSQL URL");
  }
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol)) {
    throw new Error("Database connection must use postgres:// or postgresql://");
  }
  if (!parsed.hostname || !parsed.pathname || parsed.pathname === "/") {
    throw new Error("Database connection is missing host or database name");
  }
  return parsed;
}

export function postgresProcessEnv(connectionString, options = {}) {
  const connection = parsePostgresConnection(connectionString);
  const local = new Set(["localhost", "127.0.0.1", "::1"]).has(connection.hostname);
  return {
    PGHOST: connection.hostname,
    PGPORT: connection.port || "5432",
    PGUSER: decodeURIComponent(connection.username || "postgres"),
    PGPASSWORD: decodeURIComponent(connection.password || ""),
    PGDATABASE: decodeURIComponent(connection.pathname.replace(/^\//, "")),
    PGCONNECT_TIMEOUT: "20",
    PGAPPNAME: "goargentina-backup",
    PGSSLMODE: options.allowLocalSslDisable && local ? "prefer" : "require",
  };
}

export function backupRetentionForDate(date = new Date()) {
  if (date.getUTCDate() === 1) return { tier: "monthly", days: 90 };
  if (date.getUTCDay() === 0) return { tier: "weekly", days: 35 };
  return { tier: "daily", days: 8 };
}

export function assertBackupEnvironment(env = process.env) {
  const databaseUrl = required(env, "BACKUP_DATABASE_URL");
  const ageRecipient = required(env, "BACKUP_AGE_RECIPIENT");
  const sourceProjectRef = required(env, "BACKUP_SOURCE_PROJECT_REF");
  const outputDir = required(env, "BACKUP_OUTPUT_DIR");

  if (!PROJECT_REF_RE.test(sourceProjectRef)) {
    throw new Error("BACKUP_SOURCE_PROJECT_REF must be a 20-character Supabase ref");
  }
  if (!AGE_RECIPIENT_RE.test(ageRecipient)) {
    throw new Error("BACKUP_AGE_RECIPIENT must be a valid age X25519 public recipient");
  }
  if (/[\r\n]/.test(outputDir)) {
    throw new Error("BACKUP_OUTPUT_DIR must not contain line breaks");
  }

  const attested = assertDatabaseTarget({
    connectionString: databaseUrl,
    expectedProjectRef: sourceProjectRef,
    purpose: "encrypted logical backup",
  });
  if (attested.diagnostics.port !== 5432) {
    throw new Error("Backups require a direct or session-pooler connection on port 5432");
  }

  return { databaseUrl, ageRecipient, sourceProjectRef, outputDir };
}

export function assertRestoreEnvironment(env = process.env, manifest = null) {
  const databaseUrl = required(env, "RESTORE_TARGET_DATABASE_URL");
  const targetProjectRef = required(env, "RESTORE_TARGET_PROJECT_REF");
  const configuredProductionRef = required(env, "PRODUCTION_SUPABASE_PROJECT_REF");
  const confirmation = required(env, "RESTORE_DISPOSABLE_CONFIRMATION");
  const externalWritesDisabled = required(env, "RESTORE_EXTERNAL_WRITES_DISABLED");

  if (confirmation !== RESTORE_DISPOSABLE_CONFIRMATION) {
    throw new Error("Disposable target confirmation is missing");
  }
  if (externalWritesDisabled !== "true") {
    throw new Error("External writes must be disabled before restore preflight");
  }
  if (!PROJECT_REF_RE.test(configuredProductionRef)) {
    throw new Error("PRODUCTION_SUPABASE_PROJECT_REF must be a valid Supabase ref");
  }
  if (!/^[a-z0-9-]{6,64}$/.test(targetProjectRef)) {
    throw new Error("RESTORE_TARGET_PROJECT_REF is invalid");
  }

  const connection = parsePostgresConnection(databaseUrl);
  const diagnostics = parseSupabaseDatabaseTarget(databaseUrl);
  const productionRefs = new Set([
    KNOWN_PRODUCTION_SUPABASE_PROJECT_REF,
    configuredProductionRef,
    manifest?.sourceProjectRef,
  ].filter(Boolean));

  for (const productionRef of productionRefs) {
    if (
      targetProjectRef === productionRef || diagnostics.projectRef === productionRef
    ) {
      throw new Error("Restore target resolves to a production/source project ref");
    }
  }

  const localTarget = targetProjectRef.startsWith("local-");
  if (localTarget) {
    if (!new Set(["localhost", "127.0.0.1", "::1"]).has(connection.hostname)) {
      throw new Error("local-* restore refs are allowed only for a local database host");
    }
  } else {
    assertDatabaseTarget({
      connectionString: databaseUrl,
      expectedProjectRef: targetProjectRef,
      purpose: "disposable restore",
    });
  }

  return { databaseUrl, targetProjectRef };
}

export function assertBackupManifest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Backup manifest must be a JSON object");
  }
  if (value.schemaVersion !== 1 || value.kind !== "supabase-logical-backup") {
    throw new Error("Unsupported backup manifest format");
  }
  if (!PROJECT_REF_RE.test(value.sourceProjectRef ?? "")) {
    throw new Error("Backup manifest has an invalid source project ref");
  }
  if (value.dump?.format !== "postgres-custom" || value.dump?.includesData !== true || value.dump?.includesSchema !== true) {
    throw new Error("Backup manifest does not describe a full schema+data dump");
  }
  if (!/^[a-f0-9]{64}$/.test(value.dump?.sha256 ?? "")) {
    throw new Error("Backup manifest has an invalid plaintext SHA-256");
  }
  if (!/^[a-f0-9]{64}$/.test(value.encrypted?.sha256 ?? "")) {
    throw new Error("Backup manifest has an invalid encrypted SHA-256");
  }
  if (value.encrypted?.algorithm !== "age-x25519") {
    throw new Error("Backup manifest must use age X25519 encryption");
  }
  if (!Array.isArray(value.evidence?.schemas) || !Array.isArray(value.evidence?.tables) || !Array.isArray(value.evidence?.rls)) {
    throw new Error("Backup manifest is missing schema/count/RLS evidence");
  }
  return value;
}

export function sha256File(filePath) {
  const hash = createHash("sha256");
  const descriptor = fs.openSync(filePath, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytesRead;
    do {
      bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead > 0) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(descriptor);
  }
  return hash.digest("hex");
}

function sanitizeToolOutput(value, connectionString) {
  return String(value || "")
    .replaceAll(connectionString, "[REDACTED_DATABASE_URL]")
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[REDACTED_DATABASE_URL]")
    .trim();
}

export function runDatabaseTool(command, args, options) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    input: options.input,
    env: {
      ...process.env,
      ...options.env,
      ...postgresProcessEnv(options.connectionString, {
        allowLocalSslDisable: options.allowLocalSslDisable,
      }),
    },
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    const detail = sanitizeToolOutput(result.stderr || result.stdout || result.error?.message, options.connectionString);
    throw new Error(`${command} failed${detail ? `: ${detail}` : ""}`);
  }
  return result.stdout ?? "";
}

export function collectDatabaseEvidence(connectionString, options = {}) {
  const inventoryOutput = runDatabaseTool(
    "psql",
    ["--no-psqlrc", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-c", DATABASE_EVIDENCE_SQL],
    {
      connectionString,
      allowLocalSslDisable: options.allowLocalSslDisable,
      env: { PGOPTIONS: "-c statement_timeout=900000 -c default_transaction_read_only=on" },
    },
  );
  const jsonLine = inventoryOutput.split(/\r?\n/).map((line) => line.trim()).findLast((line) => line.startsWith("{"));
  if (!jsonLine) throw new Error("Database evidence query returned no JSON");
  const inventory = JSON.parse(jsonLine);
  const tableNames = (inventory.rls ?? []).map((item) => item.name);
  const countStatements = tableNames.map((name) => {
    const separator = name.indexOf(".");
    if (separator <= 0) throw new Error("Database inventory returned an invalid table name");
    const schema = name.slice(0, separator).replaceAll('"', '""');
    const table = name.slice(separator + 1).replaceAll('"', '""');
    const literal = name.replaceAll("'", "''");
    return `select jsonb_build_object('name', '${literal}', 'rowCount', count(*)::text)::text from "${schema}"."${table}"`;
  });

  let tables = [];
  if (countStatements.length > 0) {
    const countSql = `begin isolation level repeatable read read only;\n${countStatements.join("\nunion all\n")};\nrollback;`;
    const countOutput = runDatabaseTool(
      "psql",
      ["--no-psqlrc", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-c", countSql],
      {
        connectionString,
        allowLocalSslDisable: options.allowLocalSslDisable,
        env: { PGOPTIONS: "-c statement_timeout=900000 -c default_transaction_read_only=on" },
      },
    );
    tables = countOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("{"))
      .map((line) => JSON.parse(line));
  }

  return { ...inventory, tables };
}

function tableMap(items) {
  return new Map((items ?? []).map((item) => [item.name, item]));
}

export function compareDatabaseEvidence(source, target) {
  const missingSchemas = (source.schemas ?? []).filter((schema) => !(target.schemas ?? []).includes(schema));
  const sourceTables = tableMap(source.tables);
  const targetTables = tableMap(target.tables);
  const missingTables = [];
  const countMismatches = [];
  for (const [name, expected] of sourceTables) {
    const actual = targetTables.get(name);
    if (!actual) {
      missingTables.push(name);
    } else if (expected.rowCount === null || actual.rowCount === null || expected.rowCount !== actual.rowCount) {
      countMismatches.push({ name, expected: expected.rowCount, actual: actual.rowCount });
    }
  }

  const sourceRls = tableMap(source.rls);
  const targetRls = tableMap(target.rls);
  const rlsMismatches = [];
  for (const [name, expected] of sourceRls) {
    const actual = targetRls.get(name);
    if (!actual || expected.enabled !== actual.enabled || expected.forced !== actual.forced) {
      rlsMismatches.push({
        name,
        expected: { enabled: expected.enabled, forced: expected.forced },
        actual: actual ? { enabled: actual.enabled, forced: actual.forced } : null,
      });
    }
  }

  return {
    status:
      missingSchemas.length === 0 &&
      missingTables.length === 0 &&
      countMismatches.length === 0 &&
      rlsMismatches.length === 0
        ? "passed"
        : "failed",
    missingSchemas,
    missingTables,
    countMismatches,
    rlsMismatches,
    checkedTableCount: sourceTables.size,
    checkedRlsTableCount: sourceRls.size,
  };
}
