import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { commercialFunnelDefinition } from "./commercial-funnel-readiness.mjs";
import {
  buildLocalContractReport,
  readCandidateTree,
} from "./lib/local-contract-evidence.mjs";
import { operationsDefinition } from "./operations-readiness.mjs";
import { paymentProviderDefinition } from "./payment-provider-readiness.mjs";

const generatedAt = "2026-07-17T12:00:00.000Z";
const candidateTree = "0123456789abcdef0123456789abcdef01234567";

function passedChecks(definition) {
  return definition.checks.map((check) => ({
    id: check.id,
    label: check.label,
    kind: check.kind,
    status: "passed",
    exitCode: 0,
    durationMs: 1,
    command: check.kind === "file-contract" ? `verify ${check.file}` : "contract command",
    sources: check.sources ?? [check.file],
  }));
}

test("all producers expose the required local evidence identity", () => {
  for (const definition of [
    commercialFunnelDefinition,
    operationsDefinition,
    paymentProviderDefinition,
  ]) {
    const report = buildLocalContractReport(definition, {
      generatedAt,
      candidateTree,
      checks: passedChecks(definition),
    });

    assert.equal(report.schemaVersion, 1);
    assert.equal(report.reportType, definition.reportType);
    assert.equal(report.generatedAt, generatedAt);
    assert.equal(report.evidenceScope, "candidate");
    assert.equal(report.evidenceLevel, "local-contract");
    assert.equal(report.candidateTree, candidateTree);
    assert.equal(report.status, "passed");
    assert.equal(report.live, false);
    assert.equal(report.sandbox, false);
    assert.equal(report.external, false);
  }
});

test("external, live and sandbox proof fields stay false after local contracts pass", () => {
  const commercial = buildLocalContractReport(commercialFunnelDefinition, {
    generatedAt,
    candidateTree,
    checks: passedChecks(commercialFunnelDefinition),
  });
  assert.equal(commercial.localContracts.eventTaxonomy, true);
  assert.equal(commercial.localContracts.leadCaptureAdapter, true);
  assert.equal(commercial.localContracts.newsletterDeduplication, true);
  assert.equal(commercial.events, false);
  assert.equal(commercial.leadCapture, false);
  assert.equal(commercial.deduplication, false);
  assert.equal(commercial.dashboard, false);
  assert.equal(commercial.conversionProof, false);
  assert.equal(commercial.revenueAttribution, false);

  const operations = buildLocalContractReport(operationsDefinition, {
    generatedAt,
    candidateTree,
    checks: passedChecks(operationsDefinition),
  });
  assert.equal(operations.localContracts.outboxBeforeSend, true);
  assert.equal(operations.localContracts.retryMechanics, true);
  assert.equal(operations.localContracts.incidentRollbackMarkers, true);
  assert.equal(operations.emailOutbox, false);
  assert.equal(operations.retryProof, false);
  assert.equal(operations.incidentRunbook, false);
  assert.equal(operations.alerting, false);
  assert.equal(operations.bookingSlo, false);

  const payment = buildLocalContractReport(paymentProviderDefinition, {
    generatedAt,
    candidateTree,
    checks: passedChecks(paymentProviderDefinition),
  });
  assert.equal(payment.localContracts.idempotency, true);
  assert.equal(payment.idempotency, false);
  for (const field of paymentProviderDefinition.externalClaims) {
    assert.equal(payment[field], false, `${field} must not be inferred from local tests`);
  }
});

test("a failed contract or missing candidate tree fails closed", () => {
  const checks = passedChecks(commercialFunnelDefinition);
  checks[0] = { ...checks[0], status: "failed", exitCode: 1 };
  const failedContract = buildLocalContractReport(commercialFunnelDefinition, {
    generatedAt,
    candidateTree,
    checks,
  });
  assert.equal(failedContract.status, "failed");
  assert.equal(failedContract.events, false);
  assert.equal(failedContract.leadCapture, false);
  assert.equal(failedContract.deduplication, false);
  assert.equal(failedContract.localContracts.eventTaxonomy, false);
  assert.equal(failedContract.localContracts.leadCaptureAdapter, false);

  const missingTree = buildLocalContractReport(operationsDefinition, {
    generatedAt,
    candidateTree: null,
    checks: passedChecks(operationsDefinition),
  });
  assert.equal(missingTree.status, "failed");
  assert.equal(missingTree.emailOutbox, false);
  assert.equal(missingTree.retryProof, false);
  assert.equal(missingTree.incidentRunbook, false);
  assert.equal(missingTree.localContracts.outboxBeforeSend, false);
});

test("candidateTree is the exact value returned by git write-tree", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "goargentina-local-evidence-"));
  try {
    execFileSync("git", ["init", "--quiet"], { cwd: tempRoot });
    fs.writeFileSync(path.join(tempRoot, "contract.txt"), "local contract\n", "utf8");
    execFileSync("git", ["add", "contract.txt"], { cwd: tempRoot });
    const expected = execFileSync("git", ["write-tree"], {
      cwd: tempRoot,
      encoding: "utf8",
    }).trim();
    assert.equal(readCandidateTree(tempRoot), expected);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
