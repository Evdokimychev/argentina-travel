import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  finalizeCandidateEvidence,
  parseCandidateDirtyPaths,
  validateCandidateEvidence,
} from "./candidate-evidence.mjs";

const NOW = new Date("2026-07-17T12:00:00.000Z");

function validReport(overrides = {}) {
  return {
    evidenceScope: "candidate",
    candidateTree: "tree-1",
    evidenceRunId: "run-12345678",
    evidenceGeneratedAt: "2026-07-17T11:00:00.000Z",
    evidenceEnvironment: "local-production",
    evidenceBaseUrl: "http://127.0.0.1:3100",
    evidenceIntegrity: { status: "passed", reasons: [], dirtyPaths: [] },
    ...overrides,
  };
}

test("accepts fresh evidence for the exact candidate tree and allowed environment", () => {
  assert.deepEqual(
    validateCandidateEvidence(validReport(), {
      candidateTree: "tree-1",
      now: NOW,
      allowedEnvironments: ["local-production"],
    }),
    { valid: true, reasons: [] },
  );
});

test("rejects production baselines, another tree, missing run id, and wrong environment", () => {
  const result = validateCandidateEvidence(
    validReport({
      evidenceScope: "production-baseline",
      candidateTree: "tree-old",
      evidenceRunId: null,
      evidenceEnvironment: "production-baseline",
    }),
    {
      candidateTree: "tree-1",
      now: NOW,
      allowedEnvironments: ["local-production"],
    },
  );
  assert.equal(result.valid, false);
  assert.deepEqual(result.reasons, [
    "wrong-scope",
    "candidate-tree-mismatch",
    "missing-run-id",
    "wrong-environment",
  ]);
});

test("rejects stale, undated, and canonical production reports", () => {
  assert.equal(
    validateCandidateEvidence(
      validReport({ evidenceGeneratedAt: "2026-07-01T00:00:00.000Z" }),
      { candidateTree: "tree-1", now: NOW },
    ).reasons.includes("stale-report"),
    true,
  );
  assert.equal(
    validateCandidateEvidence(validReport({ evidenceGeneratedAt: null }), {
      candidateTree: "tree-1",
      now: NOW,
    }).reasons.includes("missing-timestamp"),
    true,
  );
  assert.equal(
    validateCandidateEvidence(
      validReport({ evidenceBaseUrl: "https://www.goargentina.ru/blog" }),
      {
        candidateTree: "tree-1",
        now: NOW,
        forbidCanonicalProduction: true,
        canonicalProductionUrl: "https://www.goargentina.ru",
      },
    ).reasons.includes("canonical-production-is-baseline"),
    true,
  );
});

test("dirty path parser ignores staged-only and runtime outputs but rejects live inputs", () => {
  assert.deepEqual(
    parseCandidateDirtyPaths([
      "M  src/staged.ts",
      " M src/live.ts",
      "?? scripts/new-source.mjs",
      " M var/ops/report.json",
      "?? .next-debug/cache/file",
      " M docs/audit/content-audit-2026-07-14.md",
    ].join("\n")),
    ["src/live.ts", "scripts/new-source.mjs"],
  );
});

test("finalization rejects a changed tree or dirty candidate", () => {
  const calls = [
    { status: 0, stdout: "tree-2\n" },
    { status: 0, stdout: " M src/live.ts\n" },
  ];
  const metadata = finalizeCandidateEvidence(
    "/repo",
    {
      candidateTree: "tree-1",
      evidenceRunId: "run-12345678",
      evidenceStartedAt: "2026-07-17T11:00:00.000Z",
      initialDirtyPaths: [],
    },
    { now: () => NOW, spawn: () => calls.shift() },
  );
  assert.equal(metadata.evidenceScope, "invalid-candidate");
  assert.equal(metadata.candidateTree, null);
  assert.deepEqual(metadata.evidenceIntegrity.reasons, [
    "candidate-tree-changed",
    "dirty-candidate-at-end",
  ]);
  assert.deepEqual(metadata.evidenceIntegrity.dirtyPaths, ["src/live.ts"]);
});

test("staging candidate evidence must be bound to the deployed tree", () => {
  const rejected = validateCandidateEvidence(
    validReport({ evidenceEnvironment: "staging-candidate" }),
    {
      candidateTree: "tree-1",
      now: NOW,
      allowedEnvironments: ["staging-candidate"],
      requireDeploymentBindingForEnvironments: ["staging-candidate"],
    },
  );
  assert.deepEqual(rejected.reasons, ["missing-deployment-id", "deployed-tree-mismatch"]);

  const accepted = validateCandidateEvidence(
    validReport({
      evidenceEnvironment: "staging-candidate",
      deploymentId: "deployment-123",
      deployedTree: "tree-1",
    }),
    {
      candidateTree: "tree-1",
      now: NOW,
      allowedEnvironments: ["staging-candidate"],
      requireDeploymentBindingForEnvironments: ["staging-candidate"],
    },
  );
  assert.equal(accepted.valid, true);
});

test("readiness routes every scored slot through the fail-closed selector", () => {
  const source = readFileSync(join(process.cwd(), "scripts/readiness-90.mjs"), "utf8");
  const keys = [
    "publish",
    "productionReadiness",
    "release",
    "publicEditorial",
    "seo",
    "lighthouse",
    "ux",
    "analytics",
    "rls",
    "staging",
    "partnerAttribution",
    "commercialFunnel",
    "paymentProvider",
    "operations",
  ];

  for (const key of keys) {
    assert.match(source, new RegExp(`${key}: selectCandidate\\("${key}"`));
    assert.doesNotMatch(source, new RegExp(`${key}: read\\(`));
  }
  assert.match(source, /comparisons:\s*\{\s*productionBaseline:/s);
  assert.match(source, /seo-audit-production-baseline-last\.json/);
  assert.match(source, /lighthouse-phase2-prod-last\.json/);
});
