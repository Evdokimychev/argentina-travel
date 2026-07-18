import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildStagingAcceptanceReport,
  hashProjectRef,
  parseCleanupManifest,
  writeStagingAcceptanceReports,
  type CleanupEvidence,
  type JourneyResult,
} from "../../../tests/staging-acceptance/reporters/staging-acceptance-reporter";
import {
  ACCEPTANCE_EVIDENCE_BOUNDARIES,
  ACCEPTANCE_JOURNEYS,
} from "./journey-registry";
import type { AcceptanceFingerprint } from "./environment";

const candidateTree = "0123456789abcdef0123456789abcdef01234567";
const projectRef = "stagingprojectref001";

const fingerprint: AcceptanceFingerprint = {
  baseUrl: "https://argentina-travel-staging.vercel.app",
  supabaseUrl: `https://${projectRef}.supabase.co`,
  supabaseProjectRef: projectRef,
  runId: "acceptance-20260717-001",
  mailMode: "disposable",
  paymentSandbox: true,
  partnerWrites: false,
  gitSha: "abcdef0123456789abcdef0123456789abcdef01",
  migrationFingerprint: "a".repeat(64),
};

const candidateEvidence = {
  evidenceScope: "candidate",
  candidateTree,
  evidenceRunId: "run-12345678",
  evidenceStartedAt: "2026-07-17T12:00:00.000Z",
  evidenceGeneratedAt: "2026-07-17T12:10:00.000Z",
  evidenceEnvironment: "staging-live",
  evidenceBaseUrl: fingerprint.baseUrl,
  evidenceIntegrity: { status: "passed", reasons: [], dirtyPaths: [] },
};

const cleanup: CleanupEvidence = {
  status: "passed",
  orphanFixtures: 0,
  manifestPath: "test-results/staging-acceptance/cleanup-manifest.json",
  reasons: [],
};

function journey(status: JourneyResult["status"] = "passed"): JourneyResult[] {
  return ACCEPTANCE_JOURNEYS.map((item) => ({
    id: item.id,
    matrixId: item.matrixId,
    title: item.title,
    status,
    durationMs: 100,
    evidence: Object.fromEntries(
      ACCEPTANCE_EVIDENCE_BOUNDARIES.map((boundary) => [boundary, status === "passed"]),
    ) as JourneyResult["evidence"],
    artifacts: [],
    missingEvidence: status === "passed" ? [] : [...item.requiredEvidence],
    missingProjects: status === "passed" ? [] : ["chromium", "webkit"],
  }));
}

function build(overrides: Partial<Parameters<typeof buildStagingAcceptanceReport>[0]> = {}) {
  return buildStagingAcceptanceReport({
    fullStatus: "passed",
    journeys: journey(),
    cleanup,
    fingerprint,
    candidateEvidence,
    env: {
      STAGING_ACCEPTANCE_DEPLOYMENT_ID: "dpl_acceptance_20260717",
      STAGING_ACCEPTANCE_MIGRATION_ID: "20260717051000_internal_outbox_rls_policies",
      SUPABASE_SERVICE_ROLE_KEY: "must-not-appear-in-report",
      STAGING_ACCEPTANCE_MAILBOX_TOKEN: "must-not-appear-in-report-either",
    },
    ...overrides,
  });
}

describe("staging acceptance evidence reporter", () => {
  it("produces safe candidate, deployment and database binding for exactly 25 journeys", () => {
    const report = build();

    expect(report.runStatus).toBe("passed");
    expect(report.summary).toEqual({
      total: 25,
      passed: 25,
      failed: 0,
      skipped: 0,
      notImplemented: 0,
    });
    expect(report).toMatchObject({
      evidenceScope: "candidate",
      evidenceEnvironment: "staging-live",
      evidenceLevel: "live-database",
      candidateTree,
      deployedTree: candidateTree,
      deploymentId: "dpl_acceptance_20260717",
      migrationId: "20260717051000_internal_outbox_rls_policies",
      projectRefHash: hashProjectRef(projectRef),
      evidenceIntegrity: { status: "passed", reasons: [] },
      cleanup: { status: "passed", orphanFixtures: 0 },
    });
    expect(report.journeys).toHaveLength(25);
    expect(report.journeys[0]?.evidence).toEqual({
      browser: true,
      request: true,
      database: true,
      roleVisibility: true,
      cleanup: true,
    });
    expect(JSON.stringify(report)).not.toContain("must-not-appear-in-report");
  });

  it("writes identical detailed and canonical reports", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "staging-evidence-"));
    try {
      const report = build();
      expect(writeStagingAcceptanceReports(root, report)).toEqual([
        "test-results/staging-acceptance/report.json",
        "var/ops/staging-acceptance-last.json",
      ]);
      const detailed = fs.readFileSync(
        path.join(root, "test-results/staging-acceptance/report.json"),
        "utf8",
      );
      const canonical = fs.readFileSync(
        path.join(root, "var/ops/staging-acceptance-last.json"),
        "utf8",
      );
      expect(canonical).toBe(detailed);
      expect(JSON.parse(canonical).summary.total).toBe(25);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it.each(["not_implemented", "skipped", "failed"] as const)(
    "fails closed when a journey is %s",
    (status) => {
      const journeys = journey();
      journeys[0] = { ...journeys[0], status };

      const report = build({ journeys });

      expect(report.runStatus).toBe("failed");
      expect(report.summary.notImplemented).toBe(status === "not_implemented" ? 1 : 0);
      expect(report.summary.skipped).toBe(status === "skipped" ? 1 : 0);
      expect(report.summary.failed).toBe(status === "failed" ? 1 : 0);
    },
  );

  it("fails closed when cleanup is absent or orphan fixtures remain", () => {
    expect(build({
      cleanup: {
        status: "not-run",
        orphanFixtures: null,
        manifestPath: cleanup.manifestPath,
        reasons: ["missing-cleanup-manifest"],
      },
    }).runStatus).toBe("failed");

    const parsed = parseCleanupManifest({
      schemaVersion: 1,
      runId: fingerprint.runId,
      status: "passed",
      orphanFixtures: 2,
    }, fingerprint.runId);
    expect(parsed).toMatchObject({
      status: "failed",
      orphanFixtures: 2,
      reasons: ["orphan-fixtures-remain"],
    });
    expect(build({ cleanup: parsed }).runStatus).toBe("failed");
  });

  it("rejects missing deployment or migration binding without leaking environment values", () => {
    const report = build({
      env: {
        SUPABASE_SERVICE_ROLE_KEY: "another-secret",
      },
    });

    expect(report.runStatus).toBe("failed");
    expect(report.evidenceScope).toBe("invalid-candidate");
    expect(report.evidenceIntegrity).toMatchObject({
      status: "rejected",
      reasons: ["missing-deployment-id", "missing-migration-id"],
    });
    expect(JSON.stringify(report)).not.toContain("another-secret");
  });

  it("rejects a duplicated journey even when the row count remains 25", () => {
    const journeys = journey();
    journeys[24] = { ...journeys[24], id: journeys[0].id };
    expect(build({ journeys }).runStatus).toBe("failed");
  });

  it("accepts only a zero-orphan cleanup manifest for the same run", () => {
    expect(parseCleanupManifest({
      schemaVersion: 1,
      runId: fingerprint.runId,
      status: "passed",
      orphanFixtures: 0,
    }, fingerprint.runId)).toEqual(cleanup);

    expect(parseCleanupManifest({
      schemaVersion: 1,
      runId: "another-run",
      status: "passed",
      orphanFixtures: 0,
    }, fingerprint.runId).reasons).toContain("cleanup-run-id-mismatch");
  });
});
