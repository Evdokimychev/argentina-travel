import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import {
  ACCEPTANCE_EVIDENCE_BOUNDARIES,
  ACCEPTANCE_JOURNEYS,
  type AcceptanceEvidenceBoundary,
  journeyIdFromTitle,
} from "../../../src/lib/staging-acceptance/journey-registry";
import {
  createSafeFingerprint,
  type AcceptanceFingerprint,
} from "../../../src/lib/staging-acceptance/environment";
import {
  captureCandidateContext,
  finalizeCandidateEvidence,
} from "../../../scripts/lib/candidate-evidence.mjs";

const REQUIRED_PROJECTS = ["chromium", "webkit"] as const;
const CLEANUP_MANIFEST_PATH = "test-results/staging-acceptance/cleanup-manifest.json";
const DETAILED_REPORT_PATH = "test-results/staging-acceptance/report.json";
const CANONICAL_REPORT_PATH = "var/ops/staging-acceptance-last.json";

type EvidenceMap = Record<AcceptanceEvidenceBoundary, boolean>;

export type JourneyResult = {
  id: string;
  matrixId: number;
  title: string;
  status: "passed" | "failed" | "skipped" | "not_implemented";
  durationMs: number;
  evidence: EvidenceMap;
  artifacts: Array<{ project: string; name: string; path: string | null }>;
  missingEvidence: string[];
  missingProjects: string[];
};

type ObservedResult = {
  project: string;
  status: TestResult["status"];
  durationMs: number;
  attachments: Array<{ name: string; path: string | null }>;
};

export type CleanupEvidence = {
  status: "passed" | "failed" | "not-run";
  orphanFixtures: number | null;
  manifestPath: string;
  reasons: string[];
};

type CandidateEvidence = {
  evidenceScope: string;
  candidateTree: string | null;
  evidenceRunId: string | null;
  evidenceStartedAt: string | null;
  evidenceGeneratedAt: string;
  evidenceEnvironment: string;
  evidenceBaseUrl: string | null;
  evidenceIntegrity: {
    status: string;
    reasons: string[];
    dirtyPaths: string[];
  };
};

type EnvironmentLike = Record<string, string | undefined>;

function evidenceMap(names: Set<string>): EvidenceMap {
  return Object.fromEntries(
    ACCEPTANCE_EVIDENCE_BOUNDARIES.map((boundary) => [boundary, names.has(boundary)]),
  ) as EvidenceMap;
}

function emptyEvidenceMap(): EvidenceMap {
  return evidenceMap(new Set());
}

function safeValue(env: EnvironmentLike, key: string): string | null {
  return env[key]?.trim() || null;
}

export function hashProjectRef(projectRef: string): string {
  return createHash("sha256").update(projectRef).digest("hex");
}

export function parseCleanupManifest(
  value: unknown,
  expectedRunId: string,
  manifestPath = CLEANUP_MANIFEST_PATH,
): CleanupEvidence {
  const reasons: string[] = [];
  const manifest = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

  if (!manifest) {
    return {
      status: "failed",
      orphanFixtures: null,
      manifestPath,
      reasons: ["invalid-cleanup-manifest"],
    };
  }

  if (manifest.schemaVersion !== 1) reasons.push("unsupported-cleanup-schema");
  if (manifest.runId !== expectedRunId) reasons.push("cleanup-run-id-mismatch");
  if (manifest.status !== "passed") reasons.push("cleanup-status-not-passed");

  const orphanFixtures = manifest.orphanFixtures;
  if (!Number.isSafeInteger(orphanFixtures) || Number(orphanFixtures) < 0) {
    reasons.push("invalid-orphan-count");
  } else if (orphanFixtures !== 0) {
    reasons.push("orphan-fixtures-remain");
  }

  return {
    status: reasons.length === 0 ? "passed" : "failed",
    orphanFixtures: Number.isSafeInteger(orphanFixtures) ? Number(orphanFixtures) : null,
    manifestPath,
    reasons,
  };
}

export function readCleanupEvidence(root: string, runId: string): CleanupEvidence {
  const manifestPath = path.join(root, CLEANUP_MANIFEST_PATH);
  if (!fs.existsSync(manifestPath)) {
    return {
      status: "not-run",
      orphanFixtures: null,
      manifestPath: CLEANUP_MANIFEST_PATH,
      reasons: ["missing-cleanup-manifest"],
    };
  }

  try {
    return parseCleanupManifest(
      JSON.parse(fs.readFileSync(manifestPath, "utf8")),
      runId,
      CLEANUP_MANIFEST_PATH,
    );
  } catch {
    return {
      status: "failed",
      orphanFixtures: null,
      manifestPath: CLEANUP_MANIFEST_PATH,
      reasons: ["invalid-cleanup-manifest"],
    };
  }
}

function evidenceBinding(
  fingerprint: AcceptanceFingerprint,
  candidateEvidence: CandidateEvidence,
  env: EnvironmentLike,
) {
  const deploymentId = safeValue(env, "STAGING_ACCEPTANCE_DEPLOYMENT_ID");
  const migrationId = safeValue(env, "STAGING_ACCEPTANCE_MIGRATION_ID");
  const reasons: string[] = [];

  if (!deploymentId) reasons.push("missing-deployment-id");
  else if (!/^[a-zA-Z0-9._:-]{6,200}$/.test(deploymentId)) reasons.push("invalid-deployment-id");

  if (!migrationId) reasons.push("missing-migration-id");
  else if (!/^\d{14}_[a-z0-9_]+$/.test(migrationId)) reasons.push("invalid-migration-id");

  if (!candidateEvidence.candidateTree) reasons.push("missing-deployed-tree");

  return {
    deploymentId,
    deployedTree: candidateEvidence.candidateTree,
    projectRefHash: hashProjectRef(fingerprint.supabaseProjectRef),
    migrationId,
    reasons,
  };
}

export function buildStagingAcceptanceReport(input: {
  fullStatus: FullResult["status"];
  journeys: JourneyResult[];
  cleanup: CleanupEvidence;
  fingerprint: AcceptanceFingerprint;
  candidateEvidence: CandidateEvidence;
  env: EnvironmentLike;
}) {
  const binding = evidenceBinding(input.fingerprint, input.candidateEvidence, input.env);
  const integrityReasons = [
    ...input.candidateEvidence.evidenceIntegrity.reasons,
    ...binding.reasons,
  ];
  if (
    input.candidateEvidence.evidenceIntegrity.status !== "passed" &&
    integrityReasons.length === 0
  ) {
    integrityReasons.push("failed-candidate-integrity");
  }
  if (input.candidateEvidence.evidenceScope !== "candidate") {
    integrityReasons.push("wrong-candidate-scope");
  }
  const evidenceIntegrity = {
    ...input.candidateEvidence.evidenceIntegrity,
    status: integrityReasons.length === 0 ? "passed" : "rejected",
    reasons: [...new Set(integrityReasons)],
  };
  const incompleteJourneys = input.journeys.some((journey) => journey.status !== "passed");
  const cleanupFailed =
    input.cleanup.status !== "passed" || input.cleanup.orphanFixtures !== 0;
  const expectedIds = new Set(ACCEPTANCE_JOURNEYS.map((journey) => journey.id));
  const reportedIds = new Set(input.journeys.map((journey) => journey.id));
  const exactJourneySet =
    input.journeys.length === ACCEPTANCE_JOURNEYS.length &&
    reportedIds.size === expectedIds.size &&
    [...expectedIds].every((id) => reportedIds.has(id));
  const failed =
    input.fullStatus !== "passed" ||
    !exactJourneySet ||
    incompleteJourneys ||
    cleanupFailed ||
    evidenceIntegrity.status !== "passed";
  const runStatus: "passed" | "failed" = failed ? "failed" : "passed";

  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    ...input.candidateEvidence,
    evidenceScope: evidenceIntegrity.status === "passed" ? "candidate" : "invalid-candidate",
    evidenceEnvironment: "staging-live",
    evidenceBaseUrl: input.fingerprint.baseUrl,
    evidenceLevel: "live-database",
    deploymentId: binding.deploymentId,
    deployedTree: binding.deployedTree,
    projectRefHash: binding.projectRefHash,
    migrationId: binding.migrationId,
    evidenceIntegrity,
    runStatus,
    status: runStatus,
    fingerprint: input.fingerprint,
    summary: {
      total: input.journeys.length,
      passed: input.journeys.filter((journey) => journey.status === "passed").length,
      failed: input.journeys.filter((journey) => journey.status === "failed").length,
      skipped: input.journeys.filter((journey) => journey.status === "skipped").length,
      notImplemented: input.journeys.filter((journey) => journey.status === "not_implemented").length,
    },
    cleanup: input.cleanup,
    journeys: input.journeys,
  };
}

export function writeStagingAcceptanceReports(
  root: string,
  report: ReturnType<typeof buildStagingAcceptanceReport>,
): string[] {
  const written: string[] = [];
  for (const relativePath of [DETAILED_REPORT_PATH, CANONICAL_REPORT_PATH]) {
    const reportPath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    written.push(relativePath);
  }
  return written;
}

function projectName(test: TestCase): string {
  let suite: Suite | undefined = test.parent;
  while (suite) {
    const project = suite.project();
    if (project?.name) return project.name;
    suite = suite.parent;
  }
  return "unknown";
}

class StagingAcceptanceReporter implements Reporter {
  private readonly observed = new Map<string, ObservedResult[]>();
  private candidateContext: ReturnType<typeof captureCandidateContext> | null = null;

  onBegin(_config: FullConfig, suite: Suite): void {
    this.candidateContext = captureCandidateContext(process.cwd());
    const unknownIds = suite
      .allTests()
      .map((test) => journeyIdFromTitle(test.title))
      .filter((id): id is NonNullable<typeof id> => Boolean(id))
      .filter((id) => !ACCEPTANCE_JOURNEYS.some((journey) => journey.id === id));
    if (unknownIds.length > 0) {
      throw new Error(`[staging-acceptance] tests reference unknown journey ids: ${unknownIds.join(", ")}`);
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const id = journeyIdFromTitle(test.title);
    if (!id) return;
    const results = this.observed.get(id) ?? [];
    results.push({
      project: projectName(test),
      status: result.status,
      durationMs: result.duration,
      attachments: result.attachments.map((attachment) => ({
        name: attachment.name,
        path: attachment.path ?? null,
      })),
    });
    this.observed.set(id, results);
  }

  async onEnd(result: FullResult): Promise<{ status?: FullResult["status"] }> {
    const journeys: JourneyResult[] = ACCEPTANCE_JOURNEYS.map((journey) => {
      const results = this.observed.get(journey.id);
      if (!results) {
        return {
          id: journey.id,
          matrixId: journey.matrixId,
          title: journey.title,
          status: "not_implemented",
          durationMs: 0,
          evidence: emptyEvidenceMap(),
          artifacts: [],
          missingEvidence: [...journey.requiredEvidence],
          missingProjects: [...REQUIRED_PROJECTS],
        };
      }

      const attachmentNames = new Set(
        results.flatMap((entry) => entry.attachments.map((item) => item.name)),
      );
      const projects = new Set(results.map((entry) => entry.project));
      const missingEvidence = journey.requiredEvidence.filter(
        (boundary) => !attachmentNames.has(boundary),
      );
      const missingProjects = REQUIRED_PROJECTS.filter((project) => !projects.has(project));
      const hasFailure = results.some((entry) => entry.status !== "passed");
      const hasSkip = results.some((entry) => entry.status === "skipped");
      const status = hasSkip
        ? "skipped"
        : hasFailure || missingEvidence.length > 0 || missingProjects.length > 0
          ? "failed"
          : "passed";
      return {
        id: journey.id,
        matrixId: journey.matrixId,
        title: journey.title,
        status,
        durationMs: results.reduce((total, entry) => total + entry.durationMs, 0),
        evidence: evidenceMap(attachmentNames),
        artifacts: results.flatMap((entry) =>
          entry.attachments.map((attachment) => ({
            project: entry.project,
            name: attachment.name,
            path: attachment.path,
          })),
        ),
        missingEvidence,
        missingProjects,
      };
    });
    const root = process.cwd();
    const fingerprint = createSafeFingerprint(process.env);
    const context = this.candidateContext ?? captureCandidateContext(root);
    const candidateEvidence = finalizeCandidateEvidence(root, context, {
      environment: "staging-live",
      baseUrl: fingerprint.baseUrl,
    }) as CandidateEvidence;
    const cleanup = readCleanupEvidence(root, fingerprint.runId);
    const report = buildStagingAcceptanceReport({
      fullStatus: result.status,
      journeys,
      cleanup,
      fingerprint,
      candidateEvidence,
      env: process.env,
    });

    for (const relativePath of writeStagingAcceptanceReports(root, report)) {
      console.log(`[staging-acceptance] report: ${path.join(root, relativePath)}`);
    }
    if (report.runStatus !== "passed") {
      console.error("[staging-acceptance] acceptance remains blocked until all 25 journeys pass");
    }
    return { status: report.runStatus };
  }
}

export default StagingAcceptanceReporter;
