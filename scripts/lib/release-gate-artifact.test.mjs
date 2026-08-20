import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  cleanStaleReleaseGateArtifacts,
  getCiEvidenceDir,
  stageReleaseGateEvidence,
  validateReleaseGateEvidence,
  writeNotExecutedEvidence,
} from "./release-gate-artifact.mjs";

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

describe("release gate artifact integrity", () => {
  it("rejects stale evidence when commitSha does not match the current run", () => {
    const result = validateReleaseGateEvidence(
      {
        commitSha: "oldsha1111111111111111111111111111111111",
        timestamp: new Date().toISOString(),
        status: "passed",
      },
      {
        commitSha: "newsha2222222222222222222222222222222222",
        runId: "12345",
      },
    );

    assert.equal(result.valid, false);
    assert.equal(result.reasons.includes("commit-sha-mismatch"), true);
  });

  it("does not treat a historical *-last.json as valid evidence for a new run", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "release-gate-artifact-"));
    const env = {
      GITHUB_RUN_ID: "999001",
      GITHUB_SHA: "abc123def4567890abc123def4567890abc123de",
    };

    writeJson(path.join(root, "var/ops/release-gate-static-contracts-last.json"), {
      commitSha: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      timestamp: "2026-01-01T00:00:00.000Z",
      status: "passed",
      ciRunId: "111",
    });

    cleanStaleReleaseGateArtifacts(root);
    assert.equal(fs.existsSync(path.join(root, "var/ops/release-gate-static-contracts-last.json")), false);

    const staged = stageReleaseGateEvidence(root, {
      env,
      group: "static-contracts",
    });

    assert.equal(staged.executed, false);
    assert.equal(staged.validation.valid, true);
    assert.match(staged.markerPath, /not-executed\.json$/);
  });

  it("stages fresh evidence only when commitSha and runId bind to the current CI run", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "release-gate-artifact-"));
    const env = {
      GITHUB_RUN_ID: "999002",
      GITHUB_SHA: "abc123def4567890abc123def4567890abc123de",
    };

    writeJson(path.join(root, "var/ops/release-gate-static-contracts-last.json"), {
      commitSha: env.GITHUB_SHA,
      timestamp: new Date().toISOString(),
      status: "passed",
      ciRunId: env.GITHUB_RUN_ID,
      evidenceIntegrity: { status: "passed" },
    });

    const staged = stageReleaseGateEvidence(root, {
      env,
      group: "static-contracts",
    });

    assert.equal(staged.executed, true);
    assert.equal(staged.validation.valid, true);
    const evidenceDir = getCiEvidenceDir(root, env);
    assert.equal(fs.existsSync(path.join(evidenceDir, "evidence-manifest.json")), true);
    assert.equal(fs.existsSync(path.join(evidenceDir, "release-gate-static-contracts.json")), true);
  });

  it("writes CURRENT_RUN_NOT_EXECUTED when the gate aborts before report generation", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "release-gate-artifact-"));
    const env = {
      GITHUB_RUN_ID: "999003",
      GITHUB_SHA: "abc123def4567890abc123def4567890abc123de",
    };

    const markerPath = writeNotExecutedEvidence(root, {
      env,
      group: "content-production-journeys",
    });
    const marker = JSON.parse(fs.readFileSync(markerPath, "utf8"));

    assert.equal(marker.status, "CURRENT_RUN_NOT_EXECUTED");
    assert.equal(marker.commitSha, env.GITHUB_SHA);
    assert.equal(marker.runId, env.GITHUB_RUN_ID);
  });
});
