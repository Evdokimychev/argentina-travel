import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  KNOWN_PRODUCTION_SUPABASE_PROJECT_REF,
  RESTORE_DISPOSABLE_CONFIRMATION,
  assertBackupEnvironment,
  assertBackupManifest,
  assertRestoreEnvironment,
  backupRetentionForDate,
  compareDatabaseEvidence,
} from "./database-backup.mjs";

const recipient = `age1${"q".repeat(58)}`;

function manifest(overrides = {}) {
  return {
    schemaVersion: 1,
    kind: "supabase-logical-backup",
    sourceProjectRef: KNOWN_PRODUCTION_SUPABASE_PROJECT_REF,
    dump: {
      format: "postgres-custom",
      includesSchema: true,
      includesData: true,
      sha256: "a".repeat(64),
    },
    encrypted: {
      algorithm: "age-x25519",
      fileName: "database.dump.age",
      sha256: "b".repeat(64),
    },
    evidence: { schemas: ["public"], tables: [], rls: [] },
    ...overrides,
  };
}

test("backup configuration fails closed and rejects transaction pooler/mismatched refs", () => {
  const valid = {
    BACKUP_DATABASE_URL: `postgresql://postgres.${KNOWN_PRODUCTION_SUPABASE_PROJECT_REF}:password@pooler.supabase.com:5432/postgres`,
    BACKUP_AGE_RECIPIENT: recipient,
    BACKUP_SOURCE_PROJECT_REF: KNOWN_PRODUCTION_SUPABASE_PROJECT_REF,
    BACKUP_OUTPUT_DIR: "/tmp/encrypted-backup",
  };
  assert.equal(assertBackupEnvironment(valid).sourceProjectRef, KNOWN_PRODUCTION_SUPABASE_PROJECT_REF);
  assert.throws(() => assertBackupEnvironment({ ...valid, BACKUP_AGE_RECIPIENT: "" }), /required/);
  assert.throws(
    () => assertBackupEnvironment({ ...valid, BACKUP_DATABASE_URL: valid.BACKUP_DATABASE_URL.replace(":5432", ":6543") }),
    /port 5432/,
  );
  assert.throws(
    () => assertBackupEnvironment({ ...valid, BACKUP_SOURCE_PROJECT_REF: "abcdefghijklmnopqrst" }),
    /does not match/,
  );
});

test("retention preserves daily, weekly and monthly generations", () => {
  assert.deepEqual(backupRetentionForDate(new Date("2026-07-02T06:30:00Z")), { tier: "daily", days: 8 });
  assert.deepEqual(backupRetentionForDate(new Date("2026-07-05T06:30:00Z")), { tier: "weekly", days: 35 });
  assert.deepEqual(backupRetentionForDate(new Date("2026-08-01T06:30:00Z")), { tier: "monthly", days: 90 });
});

test("restore safety rejects production/source refs before any database query", () => {
  const base = {
    RESTORE_TARGET_DATABASE_URL: "postgresql://postgres.disposabletarget01xx:password@pooler.supabase.com:5432/postgres",
    RESTORE_TARGET_PROJECT_REF: "disposabletarget01xx",
    PRODUCTION_SUPABASE_PROJECT_REF: KNOWN_PRODUCTION_SUPABASE_PROJECT_REF,
    RESTORE_DISPOSABLE_CONFIRMATION,
    RESTORE_EXTERNAL_WRITES_DISABLED: "true",
  };

  assert.equal(assertRestoreEnvironment(base, manifest()).targetProjectRef, "disposabletarget01xx");
  assert.throws(
    () =>
      assertRestoreEnvironment(
        {
          ...base,
          RESTORE_TARGET_PROJECT_REF: KNOWN_PRODUCTION_SUPABASE_PROJECT_REF,
          RESTORE_TARGET_DATABASE_URL: `postgresql://postgres.${KNOWN_PRODUCTION_SUPABASE_PROJECT_REF}:password@pooler.supabase.com:5432/postgres`,
        },
        manifest(),
      ),
    /production\/source/,
  );
  assert.throws(
    () => assertRestoreEnvironment({ ...base, RESTORE_DISPOSABLE_CONFIRMATION: "yes" }, manifest()),
    /confirmation/,
  );
  assert.throws(
    () => assertRestoreEnvironment({ ...base, RESTORE_EXTERNAL_WRITES_DISABLED: "false" }, manifest()),
    /External writes/,
  );
});

test("manifest and restored schema/count/RLS evidence are verified without row data", () => {
  assert.equal(assertBackupManifest(manifest()).dump.includesData, true);
  assert.throws(
    () => assertBackupManifest(manifest({ dump: { format: "postgres-custom", includesSchema: true, includesData: false, sha256: "a".repeat(64) } })),
    /full schema\+data/,
  );

  const source = {
    schemas: ["public", "auth"],
    tables: [{ name: "public.bookings", rowCount: "4" }],
    rls: [{ name: "public.bookings", enabled: true, forced: false }],
  };
  assert.equal(compareDatabaseEvidence(source, structuredClone(source)).status, "passed");
  const changed = structuredClone(source);
  changed.tables[0].rowCount = "3";
  changed.rls[0].enabled = false;
  const failed = compareDatabaseEvidence(source, changed);
  assert.equal(failed.status, "failed");
  assert.equal(failed.countMismatches.length, 1);
  assert.equal(failed.rlsMismatches.length, 1);
});

test("workflow uploads only the encrypted directory after age encryption", () => {
  const root = process.cwd();
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/supabase-logical-backup.yml"), "utf8");
  const backupScript = fs.readFileSync(path.join(root, "scripts/supabase-full-backup.mjs"), "utf8");
  const restoreScript = fs.readFileSync(path.join(root, "scripts/supabase-restore-rehearsal.mjs"), "utf8");
  const docs = fs.readFileSync(path.join(root, "docs/ops/backup-restore.md"), "utf8");

  assert.match(workflow, /cron: "30 6 \* \* \*"/);
  assert.match(workflow, /secrets\.BACKUP_DATABASE_URL/);
  assert.match(workflow, /secrets\.BACKUP_AGE_RECIPIENT/);
  assert.match(
    workflow,
    /id: backup\s+env:\s+BACKUP_OUTPUT_DIR: \$\{\{ runner\.temp \}\}\/encrypted-database-backup/,
  );
  assert.match(workflow, /node scripts\/supabase-full-backup\.mjs/);
  assert.match(workflow, /path: \$\{\{ steps\.backup\.outputs\.artifact_dir \}\}/);
  assert.match(workflow, /retention-days: \$\{\{ steps\.backup\.outputs\.retention_days \}\}/);
  assert.doesNotMatch(workflow, /\.dump\s*$/m);

  assert.match(backupScript, /"pg_dump"/);
  assert.match(backupScript, /"age"/);
  assert.doesNotMatch(backupScript, /--schema-only|--data-only/);
  assert.ok(backupScript.indexOf('run("age"') < backupScript.indexOf("writeGithubOutputs({"));
  assert.match(restoreScript, /assertRestoreEnvironment/);
  assert.match(restoreScript, /compareDatabaseEvidence/);
  assert.match(docs, /Free/);
  assert.match(docs, /не подтвержд[её]н/i);
  assert.match(docs, /не провед[её]н/i);
});

test("backup CLI uploads no plaintext and never prints the connection secret", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "backup-cli-contract-"));
  const binDir = path.join(tempRoot, "bin");
  const outputDir = path.join(tempRoot, "artifact");
  const githubOutput = path.join(tempRoot, "github-output.txt");
  fs.mkdirSync(binDir);

  const tool = String.raw`#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const name = path.basename(process.argv[1]);
const args = process.argv.slice(2);
if (args.includes("--version")) {
  console.log(name + " mock 1.0");
  process.exit(0);
}
if (name === "pg_dump") {
  const output = args[args.indexOf("--file") + 1];
  fs.writeFileSync(output, "mock full logical dump with schema and data");
} else if (name === "pg_restore") {
  console.log("1; 0 0 TABLE public bookings postgres");
} else if (name === "psql") {
  const sql = args.at(-1);
  if (sql.includes("count(*)")) {
    console.log(JSON.stringify({ name: "public.bookings", rowCount: "2" }));
  } else {
    console.log(JSON.stringify({
      capturedAt: "2026-07-17T00:00:00Z",
      serverVersionNum: "150000",
      schemas: ["public", "auth", "storage"],
      rls: [{ name: "public.bookings", enabled: true, forced: false }]
    }));
  }
} else if (name === "age") {
  const output = args[args.indexOf("--output") + 1];
  fs.copyFileSync(args.at(-1), output);
}
`;
  for (const name of ["pg_dump", "pg_restore", "psql", "age"]) {
    const toolPath = path.join(binDir, name);
    fs.writeFileSync(toolPath, tool, { encoding: "utf8", mode: 0o755 });
  }

  const password = "connection-secret-must-not-leak";
  const result = spawnSync(process.execPath, [path.join(process.cwd(), "scripts/supabase-full-backup.mjs")], {
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${binDir}:${process.env.PATH}`,
      BACKUP_DATABASE_URL: `postgresql://postgres.${KNOWN_PRODUCTION_SUPABASE_PROJECT_REF}:${password}@pooler.supabase.com:5432/postgres`,
      BACKUP_AGE_RECIPIENT: recipient,
      BACKUP_SOURCE_PROJECT_REF: KNOWN_PRODUCTION_SUPABASE_PROJECT_REF,
      BACKUP_OUTPUT_DIR: outputDir,
      GITHUB_OUTPUT: githubOutput,
      GITHUB_SHA: "a".repeat(40),
    },
  });

  try {
    assert.equal(result.status, 0, result.stderr);
    const files = fs.readdirSync(outputDir).sort();
    assert.equal(files.length, 2);
    assert.ok(files.some((file) => file.endsWith(".dump.age")));
    assert.ok(files.some((file) => file.endsWith(".manifest.json")));
    assert.ok(files.every((file) => !file.endsWith(".dump")));
    const combinedOutput = `${result.stdout}\n${result.stderr}`;
    assert.doesNotMatch(combinedOutput, new RegExp(password));
    const generatedManifest = JSON.parse(
      fs.readFileSync(path.join(outputDir, files.find((file) => file.endsWith(".manifest.json"))), "utf8"),
    );
    assert.equal(generatedManifest.dump.includesSchema, true);
    assert.equal(generatedManifest.dump.includesData, true);
    assert.equal(generatedManifest.restoreRehearsal.status, "not_run");
    assert.match(fs.readFileSync(githubOutput, "utf8"), /retention_days=/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
