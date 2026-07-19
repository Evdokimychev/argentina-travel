#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assertBackupEnvironment,
  backupRetentionForDate,
  collectDatabaseEvidence,
  postgresProcessEnv,
  sha256File,
} from "./lib/database-backup.mjs";

process.umask(0o077);

function timestamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function requireTool(command) {
  const result = spawnSync(command, ["--version"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} is required`);
  return (result.stdout || result.stderr || "unknown").trim().slice(0, 200);
}

function run(command, args, { connectionString } = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env: {
      ...process.env,
      ...(connectionString ? postgresProcessEnv(connectionString) : {}),
    },
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    const unsafe = String(result.stderr || result.stdout || result.error?.message || "");
    const safe = connectionString ? unsafe.replaceAll(connectionString, "[REDACTED_DATABASE_URL]") : unsafe;
    throw new Error(`${command} failed${safe.trim() ? `: ${safe.trim()}` : ""}`);
  }
}

function writeGithubOutputs(values) {
  const outputFile = process.env.GITHUB_OUTPUT?.trim();
  if (!outputFile) return;
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  fs.appendFileSync(outputFile, `${lines.join("\n")}\n`, { encoding: "utf8", mode: 0o600 });
}

async function main() {
  const config = assertBackupEnvironment();
  const pgDumpVersion = requireTool("pg_dump");
  requireTool("pg_restore");
  const ageVersion = requireTool("age");

  const now = new Date();
  const retention = backupRetentionForDate(now);
  const expiresAt = new Date(now.getTime() + retention.days * 24 * 60 * 60 * 1000);
  const id = timestamp(now);
  const gitSha = /^[a-f0-9]{40}$/i.test(process.env.GITHUB_SHA ?? "")
    ? process.env.GITHUB_SHA
    : null;

  fs.mkdirSync(config.outputDir, { recursive: true, mode: 0o700 });
  if (fs.readdirSync(config.outputDir).length > 0) {
    throw new Error("BACKUP_OUTPUT_DIR must be empty to prevent plaintext or stale artifact upload");
  }
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "goargentina-db-backup-"));
  const plaintextPath = path.join(workDir, `database-${id}.dump`);
  const encryptedName = `database-${retention.tier}-${id}.dump.age`;
  const encryptedPath = path.join(config.outputDir, encryptedName);
  const manifestName = `database-${retention.tier}-${id}.manifest.json`;
  const manifestPath = path.join(config.outputDir, manifestName);

  try {
    console.log(`[backup] creating encrypted ${retention.tier} logical backup`);
    run(
      "pg_dump",
      [
        "--format=custom",
        "--compress=6",
        "--no-owner",
        "--no-privileges",
        "--no-subscriptions",
        "--serializable-deferrable",
        "--file",
        plaintextPath,
      ],
      { connectionString: config.databaseUrl },
    );

    run("pg_restore", ["--list", plaintextPath]);
    const evidence = collectDatabaseEvidence(config.databaseUrl);
    const plaintextSha256 = sha256File(plaintextPath);
    const plaintextBytes = fs.statSync(plaintextPath).size;
    if (plaintextBytes === 0) throw new Error("pg_dump produced an empty artifact");

    run("age", ["--encrypt", "--recipient", config.ageRecipient, "--output", encryptedPath, plaintextPath]);
    const encryptedSha256 = sha256File(encryptedPath);
    const encryptedBytes = fs.statSync(encryptedPath).size;
    if (encryptedBytes === 0) throw new Error("age produced an empty artifact");

    const manifest = {
      schemaVersion: 1,
      kind: "supabase-logical-backup",
      createdAt: now.toISOString(),
      sourceProjectRef: config.sourceProjectRef,
      gitSha,
      retention: {
        tier: retention.tier,
        days: retention.days,
        expiresAt: expiresAt.toISOString(),
      },
      dump: {
        format: "postgres-custom",
        includesSchema: true,
        includesData: true,
        noOwner: true,
        noPrivileges: true,
        noSubscriptions: true,
        serializableDeferrable: true,
        sha256: plaintextSha256,
        bytes: plaintextBytes,
        pgDumpVersion,
      },
      encrypted: {
        algorithm: "age-x25519",
        fileName: encryptedName,
        sha256: encryptedSha256,
        bytes: encryptedBytes,
        ageVersion,
      },
      evidence,
      restoreRehearsal: {
        status: "not_run",
        note: "A backup artifact is not proof of restore readiness.",
      },
    };
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });

    writeGithubOutputs({
      artifact_dir: config.outputDir,
      artifact_name: `database-backup-${retention.tier}-${id}`,
      retention_days: retention.days,
      manifest_path: manifestPath,
      encrypted_path: encryptedPath,
    });
    console.log(`[backup] encrypted artifact ready (${encryptedBytes} bytes, retention ${retention.days} days)`);
  } catch (error) {
    fs.rmSync(encryptedPath, { force: true });
    fs.rmSync(manifestPath, { force: true });
    throw error;
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`[backup] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
