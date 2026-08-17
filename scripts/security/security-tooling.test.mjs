import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildAttackSurfaceInventory } from "./attack-surface.mjs";
import { buildApiSecurityMatrix } from "./api-security-matrix.mjs";
import { buildMigrationParityReport } from "./migration-parity.mjs";
import { buildRlsLiveEvidenceReport } from "./rls-live-evidence.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

test("attack-surface inventory builds without throwing", () => {
  const inventory = buildAttackSurfaceInventory(ROOT);
  assert.equal(inventory.kind, "api-attack-surface");
  assert.ok(inventory.routeCount > 50);
  assert.ok(inventory.routes.some((route) => route.route.includes("/api/admin/")));
});

test("api-security-matrix builds without throwing", () => {
  const matrix = buildApiSecurityMatrix(ROOT);
  assert.equal(matrix.kind, "api-security-matrix");
  assert.equal(matrix.routeCount, matrix.rows.length);
  assert.ok(matrix.byTier.critical || matrix.byTier.high);
});

test("migration-parity dry-run reports EXTERNAL_BLOCKER without DB", () => {
  const report = buildMigrationParityReport({
    dryRun: true,
    env: {},
  });
  assert.equal(report.status, "EXTERNAL_BLOCKER");
  assert.ok(report.local.count > 0);
  assert.equal(report.blocker.code, "EXTERNAL_BLOCKER");
});

test("rls-live-evidence fails closed without credentials", () => {
  const report = buildRlsLiveEvidenceReport({ env: {} });
  assert.equal(report.status, "EXTERNAL_BLOCKER");
  assert.equal(report.live.connected, false);
  assert.equal(report.blocker.code, "EXTERNAL_BLOCKER");
});

test("security CLI scripts execute without throwing (exit codes allowed)", () => {
  const node = process.execPath;
  for (const script of [
    "scripts/security/attack-surface.mjs",
    "scripts/security/api-security-matrix.mjs",
  ]) {
    const stdout = execFileSync(node, [path.join(ROOT, script)], {
      cwd: ROOT,
      encoding: "utf8",
    });
    const payload = JSON.parse(stdout.trim().split("\n").at(-1));
    assert.equal(payload.status, "ok");
    assert.ok(fs.existsSync(path.join(ROOT, payload.output)));
  }

  try {
    execFileSync(node, [path.join(ROOT, "scripts/security/migration-parity.mjs"), "--dry-run"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    assert.fail("migration-parity should exit non-zero on EXTERNAL_BLOCKER");
  } catch (error) {
    assert.equal(error.status, 2);
    const payload = JSON.parse(String(error.stdout).trim().split("\n").at(-1));
    assert.equal(payload.status, "EXTERNAL_BLOCKER");
  }

  try {
    execFileSync(node, [path.join(ROOT, "scripts/security/rls-live-evidence.mjs")], {
      cwd: ROOT,
      encoding: "utf8",
    });
    assert.fail("rls-live-evidence should exit non-zero on EXTERNAL_BLOCKER");
  } catch (error) {
    assert.equal(error.status, 2);
    const payload = JSON.parse(String(error.stdout).trim().split("\n").at(-1));
    assert.equal(payload.status, "EXTERNAL_BLOCKER");
  }
});
