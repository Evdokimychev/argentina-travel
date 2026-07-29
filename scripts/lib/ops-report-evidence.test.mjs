import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveHealthyDeploymentGitSha,
  validateOpsReportEvidence,
} from "./ops-report-evidence.mjs";

const now = new Date("2026-07-29T12:00:00.000Z");

function report(overrides = {}) {
  return {
    generatedAt: "2026-07-29T11:00:00.000Z",
    baseUrl: "https://www.goargentina.ru",
    gitSha: "1234567890abcdef",
    ...overrides,
  };
}

describe("ops report evidence", () => {
  it("binds a deployment only to a fully healthy 200 response", () => {
    const body = { ok: true, gitSha: "1234567890abcdef" };
    assert.equal(resolveHealthyDeploymentGitSha(200, body), body.gitSha);
    assert.equal(resolveHealthyDeploymentGitSha(503, body), null);
    assert.equal(resolveHealthyDeploymentGitSha(200, { ...body, ok: false }), null);
    assert.equal(resolveHealthyDeploymentGitSha(200, { ok: true, gitSha: "short" }), null);
  });

  it("accepts a fresh report bound to the requested deployment", () => {
    assert.deepEqual(
      validateOpsReportEvidence(report(), {
        now,
        expectedBaseUrl: "https://www.goargentina.ru/",
        expectedGitSha: "1234567",
        requireBaseUrl: true,
        requireGitSha: true,
        requireExpectedGitSha: true,
        requireGeneratedAt: true,
      }),
      { valid: true, reasons: [] },
    );
  });

  it("rejects stale, wrong-origin and wrong-deployment evidence", () => {
    const result = validateOpsReportEvidence(
      report({
        generatedAt: "2026-07-27T00:00:00.000Z",
        baseUrl: "https://preview.example.com",
        gitSha: "abcdef1234567890",
      }),
      {
        now,
        expectedBaseUrl: "https://www.goargentina.ru",
        expectedGitSha: "1234567",
        requireBaseUrl: true,
        requireGitSha: true,
        requireExpectedGitSha: true,
        requireGeneratedAt: true,
      },
    );

    assert.equal(result.valid, false);
    for (const reason of ["stale-report", "base-url-mismatch", "git-sha-mismatch"]) {
      assert.equal(result.reasons.includes(reason), true);
    }
  });

  it("rejects unbound reports instead of interpreting them as production proof", () => {
    const result = validateOpsReportEvidence(
      report({ baseUrl: null, gitSha: null }),
      {
        now,
        expectedBaseUrl: "https://www.goargentina.ru",
        expectedGitSha: "1234567",
        requireBaseUrl: true,
        requireGitSha: true,
        requireExpectedGitSha: true,
        requireGeneratedAt: true,
      },
    );

    assert.equal(result.reasons.includes("missing-base-url"), true);
    assert.equal(result.reasons.includes("missing-git-sha"), true);
  });

  it("rejects a legacy report with only ranAt", () => {
    const result = validateOpsReportEvidence(
      report({ generatedAt: undefined, ranAt: "2026-07-29T11:00:00.000Z" }),
      { now, requireGeneratedAt: true },
    );

    assert.equal(result.reasons.includes("missing-generated-at"), true);
  });
});
