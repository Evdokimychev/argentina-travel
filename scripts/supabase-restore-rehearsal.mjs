#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  assertBackupManifest,
  assertRestoreEnvironment,
  collectDatabaseEvidence,
  compareDatabaseEvidence,
  sha256File,
} from "./lib/database-backup.mjs";

process.umask(0o077);

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function readManifest() {
  const manifestPath = required("BACKUP_MANIFEST_PATH");
  const encryptedPath = required("BACKUP_ENCRYPTED_PATH");
  const manifest = assertBackupManifest(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
  if (path.basename(encryptedPath) !== manifest.encrypted.fileName) {
    throw new Error("Encrypted artifact name does not match the manifest");
  }
  if (sha256File(encryptedPath) !== manifest.encrypted.sha256) {
    throw new Error("Encrypted artifact SHA-256 does not match the manifest");
  }
  return { manifest, manifestPath };
}

function evidenceOutputPath() {
  const configured = process.env.RESTORE_EVIDENCE_OUTPUT?.trim();
  if (configured) return configured;
  const id = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return path.join(process.cwd(), "var", "restore-rehearsal", `verification-${id}.json`);
}

async function main() {
  const modes = process.argv.slice(2).filter((arg) => arg === "--preflight" || arg === "--verify");
  if (modes.length !== 1) {
    throw new Error("Use exactly one mode: --preflight or --verify");
  }

  const { manifest, manifestPath } = readManifest();
  const target = assertRestoreEnvironment(process.env, manifest);
  const manifestSha256 = sha256File(manifestPath);

  if (modes[0] === "--preflight") {
    console.log(
      JSON.stringify({
        status: "preflight_passed",
        targetProjectRef: target.targetProjectRef,
        sourceProjectRef: manifest.sourceProjectRef,
        manifestSha256,
        encryptedArtifactVerified: true,
        restoreExecuted: false,
      }),
    );
    return;
  }

  const targetEvidence = collectDatabaseEvidence(target.databaseUrl, {
    allowLocalSslDisable: target.targetProjectRef.startsWith("local-"),
  });
  const comparison = compareDatabaseEvidence(manifest.evidence, targetEvidence);
  const output = {
    schemaVersion: 1,
    kind: "supabase-restore-verification",
    checkedAt: new Date().toISOString(),
    status: comparison.status,
    targetProjectRef: target.targetProjectRef,
    sourceProjectRef: manifest.sourceProjectRef,
    manifestSha256,
    encryptedArtifactVerified: true,
    restoreExecutedByScript: false,
    comparison,
  };
  const outputPath = evidenceOutputPath();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  console.log(`[restore-verification] ${comparison.status}; evidence=${outputPath}`);
  if (comparison.status !== "passed") process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[restore-verification] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
